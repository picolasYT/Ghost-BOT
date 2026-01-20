import yts from 'yt-search'
import fetch from 'node-fetch'
import { getBuffer } from '../lib/message.js' // ajustá la ruta si es necesario

const isYTUrl = url =>
  /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/i.test(url)

export default {
  command: ['play', 'mp3', 'ytmp3', 'ytaudio', 'playaudio'],
  tags: ['descargas'],
  group: true,

  async run(client, m, args, usedPrefix, command) {
    try {
      if (!args[0]) {
        return m.reply('❀ Ingresa el nombre o link del video.')
      }

      const text = args.join(' ')
      const videoMatch = text.match(
        /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/|v\/))([a-zA-Z0-9_-]{11})/
      )

      const query = videoMatch
        ? 'https://youtu.be/' + videoMatch[1]
        : text

      /* 🔍 BUSCAR VIDEO */
      const search = await yts(query)
      if (!search.all.length) {
        return m.reply('⚠ No se encontraron resultados.')
      }

      const video =
        videoMatch
          ? search.videos.find(v => v.videoId === videoMatch[1]) || search.all[0]
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

      const info = `「✦」Descargando *${title}*

> ❑ Canal » *${author?.name || 'Desconocido'}*
> ♡ Vistas » *${views?.toLocaleString() || 'N/A'}*
> ✧︎ Duración » *${timestamp || 'N/A'}*
> ☁︎ Publicado » *${ago || 'N/A'}*`

      const thumb = await getBuffer(image)
      await client.sendMessage(
        m.chat,
        { image: thumb, caption: info },
        { quoted: m }
      )

      /* 🔗 GAWRGURA MP3 */
      const apiUrl =
        `https://gawrgura-api.onrender.com/download/ytmp3?url=${encodeURIComponent(url)}`

      const apiRes = await fetch(apiUrl).then(r => r.json())

      const audioUrl =
        (typeof apiRes?.result === 'string' && apiRes.result) ||
        (typeof apiRes?.result?.download === 'string' && apiRes.result.download)

      if (!audioUrl) {
        return m.reply('⚠ No se pudo obtener el audio.')
      }

      /* 🎧 BUFFER (CLAVE PARA CELULAR) */
      const audioBuffer = await getBuffer(audioUrl)

      await client.sendMessage(
        m.chat,
        {
          audio: audioBuffer,
          mimetype: 'audio/mpeg',
          fileName: `${title}.mp3`
        },
        { quoted: m }
      )

    } catch (e) {
      console.error(e)
      m.reply('⚠ Error inesperado al procesar el audio.')
    }
  }
}
