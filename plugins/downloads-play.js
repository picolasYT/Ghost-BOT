import fetch from "node-fetch"
import yts from "yt-search"
import fs from "fs"
import path from "path"

const TMP_DIR = "./tmp"
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true })

const handler = async (m, { conn, text, command }) => {
  let tmpFile

  try {
    if (!text || !text.trim()) {
      return conn.reply(m.chat, "❀ Ingresa el nombre o link del video.", m)
    }

    await m.react("🕒")

    // 🔎 BUSCAR VIDEO
    const match = text.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([a-zA-Z0-9_-]{11})/)
    const query = match ? `https://youtu.be/${match[1]}` : text
    const search = await yts(query)
    const video = match
      ? search.videos.find(v => v.videoId === match[1])
      : search.videos[0]

    if (!video) {
      return conn.reply(m.chat, "❌ No se encontraron resultados.", m)
    }

    const { title, thumbnail, timestamp, views, ago, url } = video

    const info = `「✦」Descargando *${title}*

> ❑ Canal » *${video.author?.name || "Desconocido"}*
> ♡ Vistas » *${views?.toLocaleString() || "?"}*
> ✧︎ Duración » *${timestamp || "?"}*
> ☁︎ Publicado » *${ago || "?"}*`

    const thumb = (await conn.getFile(thumbnail)).data
    await conn.sendMessage(m.chat, { image: thumb, caption: info }, { quoted: m })

    // 🎧 SOLO AUDIO
    if (!["play", "yta", "ytmp3", "playaudio"].includes(command)) {
      return conn.reply(m.chat, "❌ Este comando solo descarga audio.", m)
    }

    // 🔗 API AKUARI (NO SE CAMBIA)
    const api = `https://api.akuari.my.id/downloader/youtube?url=${encodeURIComponent(url)}`
    const res = await fetch(api)
    const json = await res.json()

    // 🧠 EXTRAER AUDIO (ROBUSTO)
    const audioUrl =
      (typeof json?.audio?.url === "string" && json.audio.url) ||
      (typeof json?.audio === "string" && json.audio) ||
      (typeof json?.result?.audio === "string" && json.result.audio) ||
      (typeof json?.data?.audio === "string" && json.data.audio)

    if (!audioUrl) {
      console.log("RESPUESTA API AKUARI:", json)
      return conn.reply(m.chat, "⚠ La API no devolvió un audio válido.", m)
    }

    // 📥 DESCARGAR AUDIO A ARCHIVO
    const safe = title.replace(/[\\/:*?"<>|]/g, "").slice(0, 50)
    tmpFile = path.join(TMP_DIR, `${Date.now()}-${safe}.mp3`)

    const audioRes = await fetch(audioUrl)
    const buffer = Buffer.from(await audioRes.arrayBuffer())
    fs.writeFileSync(tmpFile, buffer)

    // 📄 ENVIAR COMO DOCUMENTO (FUNCIONA EN CELU)
    await conn.sendMessage(
      m.chat,
      {
        document: fs.readFileSync(tmpFile),
        mimetype: "audio/mpeg",
        fileName: `${safe}.mp3`
      },
      { quoted: m }
    )

    await m.react("✔️")

  } catch (err) {
    console.error("PLAY ERROR:", err)
    await m.react("✖️")
    conn.reply(m.chat, "⚠ Error inesperado.", m)
  } finally {
    if (tmpFile && fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile)
  }
}

handler.command = ["play", "yta", "ytmp3", "playaudio"]
handler.tags = ["descargas"]
handler.group = true

export default handler
