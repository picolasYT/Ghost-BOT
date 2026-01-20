import fetch from "node-fetch"
import yts from "yt-search"
import fs from "fs"
import path from "path"
import os from "os"

const handler = async (m, { conn, text, command }) => {
  try {
    if (!text?.trim()) {
      return conn.reply(m.chat, '❀ Ingresa el nombre o link del video.', m)
    }

    await m.react('🕒')

    // 🔍 Buscar video o detectar link
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

    // 🖼️ Miniatura
    const thumb = (await conn.getFile(thumbnail)).data
    await conn.sendMessage(m.chat, { image: thumb, caption: info }, { quoted: m })

    // ================= AUDIO =================
    if (['play', 'yta', 'ytmp3', 'playaudio'].includes(command)) {

      // 🎵 Pedir link a la API
      const apiRes = await fetch(
        `https://gawrgura-api.onrender.com/download/ytmp3?url=${encodeURIComponent(url)}`
      ).then(r => r.json())

      const audioUrl = apiRes?.result?.download || apiRes?.result
      if (!audioUrl || typeof audioUrl !== 'string') {
        throw '⚠ No se pudo obtener el audio.'
      }

      // 📂 Rutas temporales
      const safeTitle = title.replace(/[\\/:*?"<>|]/g, '').slice(0, 60)
      const tmpPath = path.join(os.tmpdir(), `${Date.now()}-${safeTitle}.mp3`)

      // ⬇️ Descargar audio a archivo
      const audioRes = await fetch(audioUrl)
      const buffer = Buffer.from(await audioRes.arrayBuffer())
      fs.writeFileSync(tmpPath, buffer)

      // 🎧 Enviar AUDIO REAL (BUFFER)
      await conn.sendMessage(
        m.chat,
        {
          audio: fs.readFileSync(tmpPath),
          mimetype: 'audio/mpeg',
          fileName: `${safeTitle}.mp3`
        },
        { quoted: m }
      )

      // 🧹 Limpiar
      fs.unlinkSync(tmpPath)

      await m.react('✔️')
    }

    // ================= VIDEO =================
    else if (['play2', 'ytv', 'ytmp4', 'mp4'].includes(command)) {

      const apiRes = await fetch(
        `https://gawrgura-api.onrender.com/download/ytmp4?url=${encodeURIComponent(url)}`
      ).then(r => r.json())

      const videoUrl = apiRes?.result?.download
      if (!videoUrl || typeof videoUrl !== 'string') {
        throw '⚠ No se pudo obtener el video.'
      }

      await conn.sendFile(
        m.chat,
        videoUrl,
        `${title}.mp4`,
        `> ❀ ${title}`,
        m
      )

      await m.react('✔️')
    }

  } catch (e) {
    await m.react('✖️')
    conn.reply(
      m.chat,
      typeof e === 'string' ? e : `⚠ Error inesperado.\n${e.message || e}`,
      m
    )
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
function formatViews(views) {
  if (!views) return 'No disponible'
  if (views >= 1e9) return `${(views / 1e9).toFixed(1)}B`
  if (views >= 1e6) return `${(views / 1e6).toFixed(1)}M`
  if (views >= 1e3) return `${(views / 1e3).toFixed(1)}k`
  return views.toString()
}
