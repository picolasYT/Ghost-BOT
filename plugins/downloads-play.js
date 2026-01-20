import fetch from "node-fetch"
import yts from "yt-search"
import fs from "fs"
import path from "path"

const TMP_DIR = "./tmp"
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true })

const handler = async (m, { conn, text, command }) => {
  let tmpFile

  try {
    if (!text?.trim()) {
      return conn.reply(m.chat, "❀ Ingresa el nombre o link del video.", m)
    }

    await m.react("🕒")

    // ================= BUSCAR VIDEO =================
    const match = text.match(
      /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/|v\/))([a-zA-Z0-9_-]{11})/
    )
    const query = match ? `https://youtu.be/${match[1]}` : text
    const search = await yts(query)
    const video = match
      ? search.videos.find(v => v.videoId === match[1])
      : search.videos[0]

    if (!video) throw "❌ No se encontraron resultados."

    const { title, thumbnail, timestamp, views, ago, url, author, seconds } = video
    if (seconds > 1800) throw "⚠ Máximo 30 minutos."

    const info = `「✦」Descargando *${title}*

> ❑ Canal » *${author.name}*
> ♡ Vistas » *${views?.toLocaleString() || "?"}*
> ✧︎ Duración » *${timestamp}*
> ☁︎ Publicado » *${ago}*`

    const thumb = (await conn.getFile(thumbnail)).data
    await conn.sendMessage(m.chat, { image: thumb, caption: info }, { quoted: m })

    // ================= AUDIO (DOCUMENTO) =================
    if (["play", "yta", "ytmp3", "playaudio"].includes(command)) {
      const api = `https://api.akuari.my.id/downloader/youtube?url=${encodeURIComponent(url)}`
const res = await fetch(api)
const json = await res.json()

const audioUrl =
  (typeof json?.audio?.url === "string" && json.audio.url) ||
  (typeof json?.audio === "string" && json.audio) ||
  (typeof json?.result?.audio === "string" && json.result.audio) ||
  (typeof json?.data?.audio === "string" && json.data.audio)

if (!audioUrl) {
  console.log("RESPUESTA API AKUARI:", json)
  throw "⚠ La API no devolvió un audio válido."
}

      const safe = title.replace(/[\\/:*?"<>|]/g, "").slice(0, 50)
      tmpFile = path.join(TMP_DIR, `${Date.now()}.mp3`)

      const audioRes = await fetch(audioUrl)
      const buffer = Buffer.from(await audioRes.arrayBuffer())
      fs.writeFileSync(tmpFile, buffer)

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
    }

    // ================= VIDEO =================
    else if (["play2", "ytv", "ytmp4", "mp4"].includes(command)) {
      const api = `https://api.akuari.my.id/downloader/youtube?url=${encodeURIComponent(url)}`
      const res = await fetch(api)
      const json = await res.json()

      const videoUrl = json?.video?.[0]?.url
      if (!videoUrl || typeof videoUrl !== "string") {
        throw "⚠ La API no devolvió un video válido."
      }

      await conn.sendFile(
        m.chat,
        videoUrl,
        `${title}.mp4`,
        `> ❀ ${title}`,
        m
      )

      await m.react("✔️")
    }

  } catch (e) {
    await m.react("✖️")
    conn.reply(m.chat, typeof e === "string" ? e : "⚠ Error inesperado.", m)
  } finally {
    if (tmpFile && fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile)
  }
}

handler.command = [
  "play", "yta", "ytmp3", "playaudio",
  "play2", "ytv", "ytmp4", "mp4"
]
handler.tags = ["descargas"]
handler.group = true

export default handler
