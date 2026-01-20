import yts from 'yt-search'
import fetch from 'node-fetch'
import { getBuffer } from '../lib/message.js'

export default {
  command: [
    'play','mp3','ytmp3','ytaudio','playaudio',
    'mp4','ytmp4','play2','ytv'
  ],
  tags: ['descargas'],
  group: true,

  async run(conn, m, args) {
    try {
      if (!args[0]) {
        return m.reply('❀ Ingresa el nombre o link del video.')
      }

      const text = args.join(' ')
      const match = text.match(
        /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/|v\/))([a-zA-Z0-9_-]{11})/
      )

      const query = match
        ? 'https://youtu.be/' + match[1]
        : text

      /* 🔍 BUSCAR VIDEO */
      const search = await yts(query)
      if (!search.all.length) {
        return m.reply('⚠ No se encontraron resultados.')
      }

      const video =
        match
          ? search.videos.find(v => v.videoId === match[1]) || search.all[0]
          : search.all[0]

      const {
        title,
        url,
        image,
        timestamp,
        views,
        ago,
        author
      } = video

      const info = `「✦」Procesando *${title}*

> ❑ Canal » *${author?.name || 'Desconocido'}*
> ♡ Vistas » *${views?.toLocaleString() || 'N/A'}*
> ✧︎ Duración » *${timestamp || 'N/A'}*
> ☁︎ Publicado » *${ago || 'N/A'}*`

      const thumb = await getBuffer(image)
      await conn.sendMessage(
        m.chat,
        { image: thumb, caption: info },
        { quoted: m }
      )

      /* ================= MP3 ================= */
      if (['play','mp3','ytmp3','ytaudio','playaudio'].includes(m.command)) {
        const api =
          `https://gawrgura-api.onrender.com/download/ytmp3?url=${encodeURIComponent(url)}`
        const res = await fetch(api).then(r => r.json())

        const audioUrl =
          (typeof res?.result === 'string' && res.result) ||
          (typeof res?.result?.download === 'string' && res.result.download)

        if (!audioUrl) {
          return m.reply('⚠ No se pudo obtener el audio.')
        }

        const audioBuffer = await getBuffer(audioUrl)

        await conn.sendMessage(
          m.chat,
          {
            audio: audioBuffer,
            mimetype: 'audio/mpeg',
            fileName: `${title}.mp3`
          },
          { quoted: m }
        )
      }

      /* ================= MP4 ================= */
      else {
        const api =
          `https://gawrgura-api.onrender.com/download/ytmp4?url=${encodeURIComponent(url)}`
        const res = await fetch(api).then(r => r.json())

        const videoUrl =
          (typeof res?.result === 'string' && res.result) ||
          (typeof res?.result?.download === 'string' && res.result.download)

        if (!videoUrl) {
          return m.reply('⚠ No se pudo obtener el video.')
        }

        const videoBuffer = await getBuffer(videoUrl)

        await conn.sendMessage(
          m.chat,
          {
            video: videoBuffer,
            mimetype: 'video/mp4',
            caption: `> ❀ ${title}`
          },
          { quoted: m }
        )
      }

    } catch (e) {
      console.error(e)
      m.reply('⚠ Error inesperado.')
    }
  }
}
