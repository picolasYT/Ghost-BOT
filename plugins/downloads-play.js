import fetch from "node-fetch"
import yts from "yt-search"

export default async function play(sock, chatId, body) {
  try {
    const text = body.split(/\s+/).slice(1).join(" ")
    if (!text) {
      return await sock.sendMessage(chatId, {
        text: "⚠️ Uso: .play <nombre o link>"
      })
    }

    // 🔍 BUSCAR VIDEO
    const match = text.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([a-zA-Z0-9_-]{11})/)
    const query = match ? `https://youtu.be/${match[1]}` : text

    const search = await yts(query)
    const video = match
      ? search.videos.find(v => v.videoId === match[1])
      : search.videos[0]

    if (!video) {
      return await sock.sendMessage(chatId, {
        text: "❌ No se encontraron resultados."
      })
    }

    const { title, url } = video
    const safe = title.replace(/[\\/:*?"<>|]/g, "").slice(0, 50)

    // 🎵 API GAWRGURA
    const api = `https://gawrgura-api.onrender.com/download/ytmp3?url=${encodeURIComponent(url)}`
    const res = await fetch(api)
    const json = await res.json()

    const audioUrl =
      (typeof json?.result === "string" && json.result) ||
      (typeof json?.result?.download === "string" && json.result.download)

    if (!audioUrl) {
      return await sock.sendMessage(chatId, {
        text: "⚠ La API no devolvió un audio válido."
      })
    }

    // ⬇️ DESCARGAR ARCHIVO
    const audioRes = await fetch(audioUrl)
    const buffer = Buffer.from(await audioRes.arrayBuffer())

    // tamaño mínimo (evita archivos rotos)
    if (buffer.length < 150 * 1024) {
      return await sock.sendMessage(chatId, {
        text: "⚠ El archivo descargado es inválido."
      })
    }

    // 📄 ENVIAR COMO DOCUMENTO (100% COMPATIBLE)
    await sock.sendMessage(chatId, {
      document: buffer,
      mimetype: "audio/mpeg",
      fileName: `${safe}.mp3`
    })

  } catch (err) {
    console.error("❌ PLAY ERROR:", err)
    await sock.sendMessage(chatId, {
      text: "❌ Error al procesar el audio."
    })
  }
}
