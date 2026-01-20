import fetch from "node-fetch"
import yts from "yt-search"
import fs from "fs"
import path from "path"

const TMP_DIR = "./tmp"
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true })

const MAX_AUDIO_SIZE = 16 * 1024 * 1024 // 16 MB

const handler = async (m, { conn, text, command }) => {
  let tmpFile = null

  try {
    if (!text?.trim()) {
      return conn.reply(m.chat, '❀ Ingresa el nombre o link del video.', m)
    }

    await m.react('🕒')

    /* ================= BUSCAR VIDEO ================= */
    const match = text.match(
      /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([a-zA-Z0-9_-]{11})/
    )
    const query = match ? `https://youtu.be/${match[1]}` : text
    const search = await yts(query)
    const video = match
      ? search.videos.find(v => v.videoId === match[1])
      : search.videos[0]

    if (!video) throw 'ꕥ No se encontraron resultados.'

    const {
      title,
      thumbnail,
      timestamp,
      views,
      ago,
      url,
      author,
      seconds
    } = video

    if (seconds > 1800) throw '⚠ Máximo 30 minutos.'

    const info = `「✦」Descargando *${title}*

> ❑ Canal » *${author.name}*
> ♡ Vistas » *${formatViews(views)}*
> ✧︎ Duración » *${timestamp}*
> ☁︎ Publicado » *${ago}*`

    const thumb = (await conn.getFile(thumbnail)).data
    await conn.sendMessage(
      m.chat,
      { image: thumb, caption: info },
      { quoted: m }
    )

    /* ================= AUDIO ================= */
    if (['play', 'yta', 'ytmp3', 'playaudio'].includes(command)) {
      const audioUrl = await getAud(url)
      if (!audioUrl) throw '⚠ No se pudo obtener el audio.'

      const safe = title.replace(/[\\/:*?"<>|]/g, '').slice(0, 50)
      tmpFile = path.join(TMP_DIR, `${Date.now()}.mp3`)

      const res = await fetch(audioUrl)
      const buffer = Buffer.from(await res.arrayBuffer())
      fs.writeFileSync(tmpFile, buffer)

      const stats = fs.statSync(tmpFile)

      if (stats.size > MAX_AUDIO_SIZE) {
        // Documento (audios grandes)
        await conn.sendMessage(
          m.chat,
          {
            document: fs.readFileSync(tmpFile),
            mimetype: 'audio/mpeg',
            fileName: `${safe}.mp3`
          },
          { quoted: m }
        )
      } else {
        // Audio normal (reproducible en celular)
        await conn.sendMessage(
          m.chat,
          {
            audio: fs.readFileSync(tmpFile),
            mimetype: 'audio/mpeg',
            fileName: `${safe}.mp3`
          },
          { quoted: m }
        )
      }

      await m.react('✔️')
    }

    /* ================= VIDEO ================= */
    else if (['play2', 'ytv', 'ytmp4', 'mp4'].includes(command)) {
      const videoUrl = await getVid(url)
      if (!videoUrl) throw '⚠ No se pudo obtener el video.'

      await conn.sendMessage(
        m.chat,
        {
          video: { url: videoUrl },
          mimetype: 'video/mp4',
          caption: `> ❀ ${title}`
        },
        { quoted: m }
      )

      await m.react('✔️')
    }

  } catch (e) {
    await m.react('✖️')
    await conn.reply(
      m.chat,
      typeof e === 'string' ? e : '⚠ Error inesperado.',
      m
    )
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

/* ======================= */
/* AUDIO – GAWRGURA        */
/* ======================= */
async function getAud(url) {
  try {
    const res = await fetch(
      `https://gawrgura-api.onrender.com/download/ytmp3?url=${encodeURIComponent(url)}`
    )
    const json = await res.json()

    const link =
      (typeof json?.result === 'string' && json.result) ||
      (typeof json?.result?.download === 'string' && json.result.download)

    return link || null
  } catch {
    return null
  }
}

/* ======================= */
/* VIDEO – GAWRGURA        */
/* ======================= */
async function getVid(url) {
  try {
    const res = await fetch(
      `https://gawrgura-api.onrender.com/download/ytmp4?url=${encodeURIComponent(url)}`
    )
    const json = await res.json()

    const link =
      (typeof json?.result === 'string' && json.result) ||
      (typeof json?.result?.download === 'string' && json.result.download)

    return link || null
  } catch {
    return null
  }
}

/* ======================= */
/* UTIL                   */
/* ======================= */
function formatViews(views) {
  if (!views) return 'No disponible'
  if (views >= 1e9) return `${(views / 1e9).toFixed(1)}B`
  if (views >= 1e6) return `${(views / 1e6).toFixed(1)}M`
  if (views >= 1e3) return `${(views / 1e3).toFixed(1)}k`
  return views.toString()
}
