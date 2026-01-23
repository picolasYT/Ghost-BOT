import yts from "yt-search"
import fetch from "node-fetch"

const DARKCORE_KEY = "shd_488b9c30e05c0927d77f79a6"

const cleanYoutubeUrl = (url) => {
  try {
    const u = new URL(url)
    return `https://www.youtube.com/watch?v=${u.searchParams.get("v")}`
  } catch {
    return url
  }
}

const handler = async (m, { conn, text }) => {
  if (!text) return m.reply("🎶 Escribí el nombre o link de YouTube")

  await m.react("🕘")

  try {
    let url = text
    let title = ""
    let channel = ""
    let duration = ""
    let views = ""
    let thumbnail = ""

    // 🔍 buscar si no es link
    if (!text.startsWith("http")) {
      const res = await yts(text)
      if (!res.videos.length) return m.reply("🚫 No encontré resultados")

      const v = res.videos[0]
      url = v.url
      title = v.title
      channel = v.author.name
      duration = v.timestamp
      views = v.views
      thumbnail = v.thumbnail
    }

    // 🧼 limpiar URL (CLAVE)
    url = cleanYoutubeUrl(url)

    const caption = `
🎵 *${title}*
👤 Canal: ${channel}
👁️ Vistas: ${formatViews(views)}
⏱ Duración: ${duration}

🔗 ${url}
`

    const thumb = thumbnail
      ? (await conn.getFile(thumbnail)).data
      : null

    await conn.sendMessage(
      m.chat,
      {
        image: thumb,
        caption,
        buttons: [
          { buttonId: `ytdlaudio ${url}`, buttonText: { displayText: "🎧 Audio" }, type: 1 },
          { buttonId: `ytdlvideo ${url}`, buttonText: { displayText: "🎬 Video" }, type: 1 }
        ],
        headerType: 4
      },
      { quoted: m }
    )

    await m.react("✅")
  } catch (e) {
    console.error(e)
    m.reply("❌ Error en play")
  }
}

handler.before = async (m, { conn }) => {
  const sel = m?.message?.buttonsResponseMessage?.selectedButtonId
  if (!sel) return

  const [cmd, url] = sel.split(" ")

  if (cmd === "ytdlaudio") return download(conn, m, url, "audio")
  if (cmd === "ytdlvideo") return download(conn, m, url, "video")
}

const download = async (conn, m, url, type) => {
  try {
    const apiUrl = `https://api.darkcore.xyz/api/descargar/ytdl?url=${encodeURIComponent(url)}&key=shd_488b9c30e05c0927d77f79a6`

    const r = await fetch(apiUrl)
    const data = await r.json()

    if (!data?.status) {
      return m.reply("🚫 La API no pudo procesar este video")
    }

    // 🔥 FIX CLAVE
    const fileUrl = type === "audio" ? data.audio : data.video

    if (!fileUrl) {
      console.log("RESPUESTA API:", data)
      return m.reply("🚫 Archivo no disponible")
    }

    if (type === "audio") {
      const buf = Buffer.from(await (await fetch(fileUrl)).arrayBuffer())
      await conn.sendMessage(
        m.chat,
        { audio: buf, mimetype: "audio/mpeg" },
        { quoted: m }
      )
    } else {
      await conn.sendMessage(
        m.chat,
        { video: { url: fileUrl }, mimetype: "video/mp4" },
        { quoted: m }
      )
    }

  } catch (e) {
    console.error(e)
    m.reply("❌ Error en descarga")
  }
}

const formatViews = (v) => {
  if (!v) return "0"
  if (v >= 1e6) return (v / 1e6).toFixed(1) + "M"
  if (v >= 1e3) return (v / 1e3).toFixed(1) + "K"
  return v.toString()
}

handler.command = ["play", "yt"]
handler.tags = ["descargas"]
handler.register = true

export default handler
