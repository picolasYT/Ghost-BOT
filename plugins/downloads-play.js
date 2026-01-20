import fetch from "node-fetch"
import yts from "yt-search"

const handler = async (m, { conn, text, command }) => {
  try {
    if (!text?.trim()) {
      return conn.reply(m.chat, '❀ Ingresa el nombre o link del video.', m)
    }

    await m.react('🕒')

    // Buscar o detectar link
    const match = text.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([a-zA-Z0-9_-]{11})/)
    const query = match ? `https://youtu.be/${match[1]}` : text
    const search = await yts(query)
    const video = match
      ? search.videos.find(v => v.videoId === match[1])
      : search.videos[0]

    if (!video) throw 'ꕥ No se encontraron resultados.'

    const { title, thumbnail, timestamp, views, ago, url, author, seconds } = video

    if (seconds > 1800) throw '⚠ Máximo 30 minutos.'

    const info = `「✦」Descargando *${title}*

> ❑ Canal » *${author.name}*
> ♡ Vistas » *${formatViews(views)}*
> ✧︎ Duración » *${timestamp}*
> ☁︎ Publicado » *${ago}*`

    const thumb = (await conn.getFile(thumbnail)).data
    await conn.sendMessage(m.chat, { image: thumb, caption: info }, { quoted: m })

    // ================= AUDIO =================
    if (['play', 'yta', 'ytmp3', 'playaudio'].includes(command)) {
      const audio = await getAud(url)
      if (!audio) throw '⚠ No se pudo obtener el audio.'

      await conn.sendMessage(
        m.chat,
        {
          audio: { url: audio.url },
          mimetype: 'audio/mpeg',
          fileName: `${title}.mp3`
        },
        { quoted: m }
      )

      await m.react('✔️')
    }

    // ================= VIDEO =================
    else if (['play2', 'ytv', 'ytmp4', 'mp4'].includes(command)) {
      const vid = await getVid(url)
      if (!vid) throw '⚠ No se pudo obtener el video.'

      await conn.sendFile(
        m.chat,
        vid.url,
        `${title}.mp4`,
        `> ❀ ${title}`,
        m
      )

      await m.react('✔️')
    }

  } catch (e) {
    await m.react('✖️')
    conn.reply(m.chat, typeof e === 'string' ? e : '⚠ Error inesperado.', m)
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
// AUDIO (GawrGura)
// =======================
async function getAud(url) {
  try {
    const res = await fetch(
      `https://gawrgura-api.onrender.com/download/ytmp3?url=${encodeURIComponent(url)}`
    )
    const json = await res.json()

    const link = json?.result?.download || json?.result
    if (!link || typeof link !== 'string') return null

    return { url: link, api: 'GawrGura MP3' }
  } catch {
    return null
  }
}

// =======================
// VIDEO (GawrGura)
// =======================
async function getVid(url) {
  try {
    const res = await fetch(
      `https://gawrgura-api.onrender.com/download/ytmp4?url=${encodeURIComponent(url)}`
    )
    const json = await res.json()

    const link = json?.result?.download
    if (!link || typeof link !== 'string') return null

    return { url: link, api: 'GawrGura MP4' }
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
