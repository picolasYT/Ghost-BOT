import yts from "yt-search"
import fetch from "node-fetch"

// ─────────────────────────────
// 🧼 Limpiar URL YouTube (quita playlist / radio)
// ─────────────────────────────
const cleanYoutubeUrl = (url) => {
  try {
    const u = new URL(url)
    const id = u.searchParams.get("v")
    return id ? `https://www.youtube.com/watch?v=${id}` : url
  } catch {
    return url
  }
}

// ─────────────────────────────
// 🎶 COMANDO PLAY
// ─────────────────────────────
const handler = async (m, { conn, text }) => {
  if (!text) {
    return m.reply("🎧 *Usá:* `.play nombre o link de YouTube`")
  }

  await m.react("🎵")

  try {
    let videoUrl = text
    let title = "Desconocido"
    let channel = "Desconocido"
    let duration = "N/D"
    let views = 0
    let thumbnail = null

    // 🔍 Buscar si no es link
    if (!text.startsWith("http")) {
      const res = await yts(text)
      if (!res?.videos?.length) {
        await m.react("❌")
        return m.reply("🚫 No encontré resultados.")
      }

      const v = res.videos[0]
      videoUrl = v.url
      title = v.title
      channel = v.author?.name || "Desconocido"
      duration = v.timestamp || "N/D"
      views = v.views || 0
      thumbnail = v.thumbnail
    }

    // 🧼 limpiar URL
    videoUrl = cleanYoutubeUrl(videoUrl)

    const menuText = `
╭─── 🎶 *PLAY MUSIC* 🎶 ───╮
│
│ 🎵 *Título:* ${title}
│ 👤 *Canal:* ${channel}
│ ⏱ *Duración:* ${duration}
│ 👁 *Vistas:* ${formatViews(views)}
│
╰─── 🔽 Elegí una opción 🔽 ───╯
`

    let img = null
    if (thumbnail) {
      try {
        img = (await conn.getFile(thumbnail)).data
      } catch (err) {
        console.error("Error cargando thumbnail:", err)
      }
    }

    await conn.sendMessage(
      m.chat,
      {
        image: img,
        caption: menuText,
        footer: "👻 Ghost Bot • Descargas rápidas",
        buttons: [
          {
            buttonId: `play_audio ${videoUrl}`,
            buttonText: { displayText: "🎧 Descargar Audio (MP3)" },
            type: 1,
          },
          {
            buttonId: `play_video ${videoUrl}`,
            buttonText: { displayText: "🎬 Descargar Video (MP4)" },
            type: 1,
          },
        ],
        headerType: 4,
      },
      { quoted: m }
    )

    await m.react("✅")
  } catch (e) {
    console.error("Error en handler play:", e)
    await m.react("❌")
    m.reply("❌ Error al procesar el video.")
  }
}

// ─────────────────────────────
// 🔘 BOTONES
// ─────────────────────────────
handler.before = async (m, { conn }) => {
  const selected = m?.message?.buttonsResponseMessage?.selectedButtonId
  if (!selected) return

  const parts = selected.split(" ")
  const cmd = parts[0]
  const url = parts.slice(1).join(" ")

  if (cmd === "play_audio") return download(conn, m, url, "audio")
  if (cmd === "play_video") return download(conn, m, url, "video")
}

// ─────────────────────────────
// ⬇️ DESCARGA CON MÚLTIPLES APIs
// ─────────────────────────────
const download = async (conn, m, url, type) => {
  try {
    await conn.sendMessage(
      m.chat,
      { text: "⏳ *Procesando descarga...*" },
      { quoted: m }
    )

    let data = null
    const apiUrls = [
      `https://api.darkcore.xyz/api/descargar/ytdl?url=${encodeURIComponent(url)}`,
      `https://api.ryzendesu.vip/api/ytdl?url=${encodeURIComponent(url)}`,
    ]

    // Intentar con múltiples APIs
    for (const apiUrl of apiUrls) {
      try {
        const res = await fetch(apiUrl, { timeout: 30000 })
        if (!res.ok) continue
        
        data = await res.json()
        if (data?.status && (data?.audio || data?.video)) {
          break
        }
      } catch (err) {
        console.error(`API ${apiUrl} falló:`, err.message)
        continue
      }
    }

    if (!data?.status || (!data?.audio && !data?.video)) {
      await m.react("❌")
      return m.reply("🚫 No se pudo descargar. Intenta más tarde.")
    }

    const fileUrl = type === "audio" ? data.audio : data.video
    const title = cleanName(data.title || "Archivo")

    if (!fileUrl) {
      await m.react("❌")
      return m.reply("🚫 Archivo no disponible.")
    }

    if (type === "audio") {
      try {
        const response = await fetch(fileUrl, { timeout: 60000 })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        
        const arrayBuffer = await response.arrayBuffer()
        const buffer = Buffer.from(new Uint8Array(arrayBuffer))

        if (buffer.length === 0) {
          await m.react("❌")
          return m.reply("🚫 El archivo descargado está vacío.")
        }

        await conn.sendMessage(
          m.chat,
          {
            audio: buffer,
            mimetype: "audio/mpeg",
            ptt: false,
          },
          { quoted: m }
        )
      } catch (err) {
        console.error("Error descargando audio:", err)
        await m.react("❌")
        return m.reply("❌ Error al descargar el audio.")
      }
    } else {
      try {
        const response = await fetch(fileUrl, { timeout: 60000 })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        
        const arrayBuffer = await response.arrayBuffer()
        const buffer = Buffer.from(new Uint8Array(arrayBuffer))

        if (buffer.length === 0) {
          await m.react("❌")
          return m.reply("🚫 El archivo descargado está vacío.")
        }

        await conn.sendMessage(
          m.chat,
          {
            video: buffer,
            mimetype: "video/mp4",
            fileName: `${title}.mp4`,
            caption: `🎬 *${title}*`,
          },
          { quoted: m }
        )
      } catch (err) {
        console.error("Error descargando video:", err)
        await m.react("❌")
        return m.reply("❌ Error al descargar el video.")
      }
    }

    await m.react("🎉")
  } catch (e) {
    console.error("Error general en download:", e)
    await m.react("❌")
    m.reply("❌ Error durante la descarga.")
  }
}

// ─────────────────────────────
// 🛠 UTILIDADES
// ─────────────────────────────
const cleanName = (name) => {
  if (!name || typeof name !== "string") return "Archivo"
  return name.replace(/[^\w\s-_.]/gi, "").substring(0, 60)
}

const formatViews = (views) => {
  if (typeof views !== "number" || views < 0) return "0"
  if (views >= 1e9) return (views / 1e9).toFixed(1) + "B"
  if (views >= 1e6) return (views / 1e6).toFixed(1) + "M"
  if (views >= 1e3) return (views / 1e3).toFixed(1) + "K"
  return views.toString()
}

handler.command = ["play", "yt"]
handler.tags = ["descargas"]
handler.register = true

export default handler