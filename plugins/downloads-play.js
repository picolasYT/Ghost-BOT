import fetch from 'node-fetch'
import yts from 'yt-search'
import fs from 'fs'
import path from 'path'

const TMP_DIR = './tmp'
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true })

const handler = async (m, { conn, text, command }) => {
  let tmpFile

  try {
    if (!text || !text.trim()) {
      return conn.reply(m.chat, '❀ Ingresa el nombre o link del video.', m)
    }

    await m.react('🕒')

    // ================= BUSCAR VIDEO =================
    const ytRegex = /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/|v\/))([a-zA-Z0-9_-]{11})/
    const match = text.match(ytRegex)
    const query = match ? `https://youtu.be/${match[1]}` : text

    const search = await yts(query)
    const video = match
      ? search.videos.find(v => v.videoId === match[1])
      : search.videos[0]

    if (!video) throw 'ꕥ No se encontraron resultados.'

    const { title, thumbnail, timestamp, views, ago, url, author, seconds } = video

    if (seconds > 1800) throw '⚠ Máximo 30 minutos.'

    const info = `「✦」Descargando *${title}*

> ❑ Canal » *${author?.name || 'Desconocido'}*
> ♡ Vistas » *${formatViews(views)}*
> ✧︎ Duración » *${timestamp}*
> ☁︎ Publicado » *${ago || 'Desconocido'}*`

    const thumb = (await conn.getFile(thumbnail)).data
    await conn.sendMessage(m.chat, { image: thumb, caption: info }, { quoted: m })

    // ================= AUDIO (NOTA DE VOZ) =================
    if (['play','yta','ytmp3','playaudio'].includes(command)) {
      const audioUrl = await getAud(url)
      if (!audioUrl) throw '⚠ No se pudo obtener el audio.'

      const safe = title.replace(/[\\/:*?"<>|]/g, '').slice(0, 50)
      tmpFile = path.join(TMP_DIR, `${Date.now()}.mp3`)

      const res = await fetch(audioUrl)
      const buffer = Buffer.from(await res.arrayBuffer())
      fs.writeFileSync(tmpFile, buffer)

      // 🔥 NOTA DE VOZ REAL
      await conn.sendMessage(
        m.chat,
        {
          audio: fs.readFileSync(tmpFile),
          mimetype: 'audio/mpeg',
          ptt: true   // 👈 ESTO LO CONVIERTE EN NOTA DE VOZ
        },
        { quoted: m }
      )

      await m.react('✔️')
    }

    // ================= VIDEO =================
    else if (['play2','ytv','ytmp4','mp4'].includes(command)) {
      const videoUrl = await getVid(url)
      if (!videoUrl) throw '⚠ No se pudo obtener el video.'

      await conn.sendMessage(
        m.chat,
        {
          video: { url: videoUrl },
          mimetype: 'video/mp4',
          caption: title
        },
        { quoted: m }
      )

      await m.react('✔️')
    }

  } catch (e) {
    await m.react('✖️')
    conn.reply(m.chat, typeof e === 'string' ? e : '⚠ Error inesperado.', m)
  } finally {
    if (tmpFile && fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile)
  }
}

handler.command = [
  'play','yta','ytmp3','playaudio',
  'play2','ytv','ytmp4','mp4'
]
handler.tags = ['descargas']
handler.group = true

export default handler

// =======================
// AUDIO – GAWRGURA
// =======================
async function getAud(url) {
  try {
    const res = await fetch(
      `https://gawrgura-api.onrender.com/download/ytmp3?url=${encodeURIComponent(url)}`
    )
    const json = await res.json()

    if (typeof json?.result === 'string') return json.result
    if (typeof json?.result?.download === 'string') return json.result.download

    return null
  } catch {
    return null
  }
}

// =======================
// VIDEO – GAWRGURA
// =======================
async function getVid(url) {
  try {
    const res = await fetch(
      `https://gawrgura-api.onrender.com/download/ytmp4?url=${encodeURIComponent(url)}`
    )
    const json = await res.json()

    if (typeof json?.result === 'string') return json.result
    if (typeof json?.result?.download === 'string') return json.result.download

    return null
  } catch {
    return null
  }
}

// =======================
// UTIL
// =======================
function formatViews(views) {
  if (!views) return 'No disponible'
  if (views >= 1e9) return `${(views / 1e9).toFixed(1)}B`
  if (views >= 1e6) return `${(views / 1e6).toFixed(1)}M`
  if (views >= 1e3) return `${(views / 1e3).toFixed(1)}k`
  return views.toString()
}
