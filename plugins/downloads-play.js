import yts from "yt-search"
import fetch from "node-fetch"

const handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) return m.reply("🎶 Ingresa el nombre del video de YouTube.")

  await m.react("🕘")

  try {
    let url = text
    let title = "Desconocido"
    let authorName = "Desconocido"
    let durationTimestamp = "Desconocida"
    let views = "Desconocidas"
    let thumbnail = ""

    if (!text.startsWith("https://")) {
      const res = await yts(text)
      if (!res?.videos?.length)
        return m.reply("🚫 No encontré nada papu ); intenta buscar otra cosa")

      const video = res.videos[0]
      title = video.title
      authorName = video.author?.name
      durationTimestamp = video.timestamp
      views = video.views
      url = video.url
      thumbnail = video.thumbnail
    }

    const vistas = formatViews(views)

    const res3 = await fetch("https://files.catbox.moe/wfd0ze.jpg")
    const thumb3 = Buffer.from(await res3.arrayBuffer())

    const fkontak = {
      key: { fromMe: false, participant: "0@s.whatsapp.net" },
      message: {
        documentMessage: {
          title: `『 ${title} 』`,
          fileName: global.botname || "Ghost Bot",
          jpegThumbnail: thumb3
        }
      }
    }

    const caption = `
✧━───『 𝙸𝚗𝚏𝚘 𝚍𝚎𝚕 𝚅𝚒𝚍𝚎𝚘 』───━✧

👻 𝑻𝒊́𝒕𝒖𝒍𝒐: ${title}
😉 𝑪𝒂𝒏𝒂𝒍: ${authorName}
👁️ 𝑽𝒊𝒔𝒕𝒂𝒔: ${vistas}
⏳ 𝑫𝒖𝒓𝒂𝒄𝒊𝒐́𝒏: ${durationTimestamp}
🔗 𝑬𝒏𝒍𝒂𝒄𝒆: ${url}

✧━───『 gһ᥆s𝗍 ᑲ᥆𝗍 』───━✧
⚡ 𝑷𝒐𝒘𝒆𝒓𝒆𝒅 𝒃𝒚 𝒀𝒐𝒔𝒖𝒆 :D ⚡
`

    const thumb = (await conn.getFile(thumbnail)).data
    await conn.sendMessage(
      m.chat,
      {
        image: thumb,
        caption,
        footer: "⚡ Shadow — Descargas rápidas ⚡",
        buttons: [
          { buttonId: `shadowaudio ${url}`, buttonText: { displayText: "🎵 𝘿𝙚𝙨𝙘𝙖𝙧𝙜𝙖𝙧 𝘼𝙪𝙙𝙞𝙤" }, type: 1 },
          { buttonId: `shadowvideo ${url}`, buttonText: { displayText: "🎬 𝘿𝙚𝙨𝙘𝙖𝙧𝙜𝙖𝙧 𝙑𝙞𝙙𝙚𝙤" }, type: 1 }
        ],
        headerType: 4
      },
      { quoted: fkontak }
    )

    await m.react("✅")
  } catch (e) {
    m.reply("❌ Error: " + e.message)
    m.react("⚠️")
  }
}

handler.before = async (m, { conn }) => {
  const selected = m?.message?.buttonsResponseMessage?.selectedButtonId
  if (!selected) return

  const parts = selected.split(" ")
  const cmd = parts.shift()
  const url = parts.join(" ")

  if (cmd === "shadowaudio") {
    return downloadMedia(conn, m, url, "mp3")
  }

  if (cmd === "shadowvideo") {
    return downloadMedia(conn, m, url, "mp4")
  }
}

const fetchBuffer = async (url) => {
  const response = await fetch(url)
  return await response.buffer()
}

const downloadMedia = async (conn, m, url, type) => {
  try {
    const msg = type === "mp3"
      ? "🎵 Descargando audio..."
      : "🎬 Descargando video..."

    const sent = await conn.sendMessage(m.chat, { text: msg }, { quoted: m })

    const apiUrl = type === "mp3"
      ? `https://gawrgura-api.onrender.com/download/ytmp3?url=${encodeURIComponent(url)}&apikey=SHADOWKEYBOTMD`
      : `https://gawrgura-api.onrender.com/download/ytmp4?url=${encodeURIComponent(url)}&apikey=SHADOWKEYBOTMD`

    const r = await fetch(apiUrl)
    const data = await r.json()

    if (!data?.status || !data?.data?.url)
      return m.reply("🚫 No se pudo descargar el archivo.")

    const fileUrl = data.data.url
    const fileTitle = cleanName(data.data.title || "video")

    if (type === "mp3") {
      const audioBuffer = await fetchBuffer(fileUrl)
      await conn.sendMessage(
        m.chat,
        { audio: audioBuffer, mimetype: "audio/mpeg", fileName: fileTitle + ".mp3" },
        { quoted: m }
      )
    } else {
      await conn.sendMessage(
        m.chat,
        { video: { url: fileUrl }, mimetype: "video/mp4", fileName: fileTitle + ".mp4" },
        { quoted: m }
      )
    }

    await conn.sendMessage(
      m.chat,
      { text: `✅ Descarga completada\n\n🎼 Título: ${fileTitle}`, edit: sent.key }
    )

    await m.react("✅")
  } catch (e) {
    console.error(e)
    m.reply("❌ Error: " + e.message)
    m.react("💀")
  }
}

const cleanName = (name) =>
  name.replace(/[^\w\s-_.]/gi, "").substring(0, 50)

const formatViews = (views) => {
  if (views === undefined || views === null) return "No disponible"
  if (views >= 1e9) return `${(views / 1e9).toFixed(1)}B`
  if (views >= 1e6) return `${(views / 1e6).toFixed(1)}M`
  if (views >= 1e3) return `${(views / 1e3).toFixed(1)}K`
  return views.toString()
}

/* 🔥 ÚNICO CAMBIO REAL */
handler.command = [
  "play",
  "play2",
  "ytmp3",
  "ytmp4",
  "playdoc",
  "playdoc2",
  "yt",
  "ytsearch"
]

handler.tags = ["descargas"]
handler.register = true

export default handler
