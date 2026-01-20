import fetch from 'node-fetch'
import yts from 'yt-search'
import fs from 'fs'
import path from 'path'
import { exec } from 'child_process'

const TMP = './tmp'
if (!fs.existsSync(TMP)) fs.mkdirSync(TMP, { recursive: true })

const handler = async (m, { conn, text, command }) => {
  let tmpFile

  try {
    if (!text?.trim()) {
      return conn.reply(m.chat, '❀ Ingresa el nombre o link del video.', m)
    }

    await m.react('🕒')

    // 🔎 Buscar video
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

    // 🖼️ Thumbnail en BUFFER (100% compatible)
    const imgRes = await fetch(thumbnail)
    const thumb = Buffer.from(await imgRes.arrayBuffer())

    await conn.sendMessage(
      m.chat,
      { image: thumb, caption: info },
      { quoted: m }
    )

    // ==========================
    // 🎵 AUDIO
    // ==========================
    if (['play', 'yta', 'ytmp3', 'playaudio'].includes(command)) {

      const api = `https://gawrgura-api.onrender.com/download/ytmp3?url=${encodeURIComponent(url)}`
      const res = await fetch(api).then(r => r.json())

      const downloadUrl = res?.result?.download || res?.result
      if (!downloadUrl || typeof downloadUrl !== 'string') {
        throw '⚠ No se pudo obtener el audio.'
      }

      // ⬇️ Descargar audio
      tmpFile = path.join(TMP, `${Date.now()}.mp3`)
      const audioRes = await fetch(downloadUrl)
      const buffer = Buffer.from(await audioRes.arrayBuffer())
      fs.writeFileSync(tmpFile, buffer)

      // 🎧 Enviar como AUDIO REAL (celu OK)
      await conn.sendMessage(
        m.chat,
        {
          audio: fs.readFileSync(tmpFile),
          mimetype: 'audio/mpeg',
          fileName: `${title}.mp3`
        },
        { quoted: m }
      )

      await m.react('✔️')
    }

    // ==========================
    // 🎬 VIDEO
    // ==========================
    else if (['play2', 'ytv', 'ytmp4', 'mp4'].includes(command)) {

      const api = `https://gawrgura-api.onrender.com/download/ytmp4?url=${encodeURIComponent(url)}`
      const res = await fetch(api).then(r => r.json())

      const downloadUrl = res?.result?.download
      if (!downloadUrl || typeof downloadUrl !== 'string') {
        throw '⚠ No se pudo obtener el video.'
      }

      await conn.sendFile(
        m.chat,
        downloadUrl,
        `${title}.mp4`,
        `> ❀ ${title}`,
        m
      )

      await m.react('✔️')
    }

  } catch (e) {
    console.error(e)
    await m.react('✖️')
    conn.reply(
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

// =======================
// UTIL
// =======================
function formatViews(v) {
  if (!v) return 'No disponible'
  if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B`
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`
  if (v >= 1e3) return `${(v / 1e3).toFixed(1)}k`
  return v.toString()
}
