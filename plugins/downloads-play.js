import fetch from "node-fetch"
import yts from "yt-search"

const handler = async (m, { conn, text, usedPrefix, command }) => {
  try {
    if (!text.trim())
      return conn.reply(
        m.chat,
        '❀ Por favor, ingresa el nombre o link del video.',
        m
      )

    await m.react('🕒')

    // Detectar link de YouTube o buscar
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

    // límite 30 min
    if (seconds > 1800)
      throw '⚠ El contenido supera el límite de duración (30 minutos).'

    const info = `「✦」Descargando *<${title}>*

> ❑ Canal » *${author.name}*
> ♡ Vistas » *${formatViews(views)}*
> ✧︎ Duración » *${timestamp}*
> ☁︎ Publicado » *${ago}*
> ➪ Link » ${url}`

    // enviar miniatura
    const thumb = (await conn.getFile(thumbnail)).data
    await conn.sendMessage(
      m.chat,
      { image: thumb, caption: info },
      { quoted: m }
    )

    // =======================
    // AUDIO
    // =======================
    if (['play', 'yta', 'ytmp3', 'playaudio'].includes(command)) {
      const audio = await getAud(url)
      if (!audio?.url) throw '⚠ No se pudo obtener el audio.'

      await conn.reply(
        m.chat,
        `> ❀ *Audio procesado*\n> Servidor: \`${audio.api}\``,
        m
      )

      await conn.sendMessage(
        m.chat,
        {
          audio: { url: audio.url },
          fileName: `${title}.mp3`,
          mimetype: 'audio/mpeg'
        },
        { quoted: m }
      )

      await m.react('✔️')
    }

    // =======================
    // VIDEO
    // =======================
    else if (['play2', 'ytv', 'ytmp4', 'mp4'].includes(command)) {
      const video = await getVid(url)
      if (!video?.url) throw '⚠ No se pudo obtener el video.'

      await conn.reply(
        m.chat,
        `> ❀ *Video procesado*\n> Servidor: \`${video.api}\``,
        m
      )

      await conn.sendFile(
        m.chat,
        video.url,
        `${title}.mp4`,
        `> ❀ ${title}`,
        m
      )

      await m.react('✔️')
    }

  } catch (e) {
    await m.react('✖️')
    return conn.reply(
      m.chat,
      typeof e === 'string'
        ? e
        : `⚠︎ Error inesperado.\n${e.message || e}`,
      m
    )
  }
}

handler.command = handler.help = [
  'play',
  'yta',
  'ytmp3',
  'playaudio',
  'play2',
  'ytv',
  'ytmp4',
  'mp4'
]
handler.tags = ['descargas']
handler.group = true

export default handler

// =======================
// AUDIO (GawrGura)
// =======================
async function getAud(url) {
  try {
    const endpoint =
      `https://gawrgura-api.onrender.com/download/ytmp3?url=${encodeURIComponent(url)}`
    const res = await fetch(endpoint).then(r => r.json())
    const link = res?.result?.download
    if (!link) return null
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
    const endpoint =
      `https://gawrgura-api.onrender.com/download/ytmp4?url=${encodeURIComponent(url)}`
    const res = await fetch(endpoint).then(r => r.json())
    const link = res?.result?.download
    if (!link) return null
    return { url: link, api: 'GawrGura MP4' }
  } catch {
    return null
  }
}

// =======================
// UTIL
// =======================
function formatViews(views) {
  if (views === undefined) return 'No disponible'
  if (views >= 1_000_000_000)
    return `${(views / 1_000_000_000).toFixed(1)}B (${views.toLocaleString()})`
  if (views >= 1_000_000)
    return `${(views / 1_000_000).toFixed(1)}M (${views.toLocaleString()})`
  if (views >= 1_000)
    return `${(views / 1_000).toFixed(1)}k (${views.toLocaleString()})`
  return views.toString()
}
