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
    let successApi = null

    // APIs en orden de confiabilidad
    const apiUrls = [
      {
        name: "Darkcore",
        url: `https://api.darkcore.xyz/api/descargar/ytdl?url=${encodeURIComponent(url)}`,
        extractAudio: (d) => d?.audio,
        extractVideo: (d) => d?.video,
      },
      {
        name: "Ryzendesu",
        url: `https://api.ryzendesu.vip/api/ytdl?url=${encodeURIComponent(url)}`,
        extractAudio: (d) => d?.result?.audio,
        extractVideo: (d) => d?.result?.video,
      },
      {
        name: "YT API 1",
        url: `https://api.advaith.workers.dev?url=${encodeURIComponent(url)}`,
        extractAudio: (d) => d?.audio,
        extractVideo: (d) => d?.video,
      },
      {
        name: "YT API 2",
        url: `https://yt-api.p.rapidapi.com/dl?id=${extractVideoId(url)}`,
        extractAudio: (d) => d?.links?.find(l => l.quality === "128")?.url,
        extractVideo: (d) => d?.links?.find(l => l.quality === "18")?.url,
        headers: {
          "x-rapidapi-key": "tu-api-key", // Configura esto si lo tienes
          "x-rapidapi-host": "yt-api.p.rapidapi.com"
        }
      }
    ]

    // Intentar con múltiples APIs
    for (const api of apiUrls) {
      try {
        console.log(`🔄 Intentando con ${api.name}...`)
        
        const response = await fetch(api.url, {
          timeout: 20000,
          headers: api.headers || {}
        })

        if (!response.ok) {
          console.warn(`${api.name} - HTTP ${response.status}`)
          continue
        }

        const jsonData = await response.json()
        console.log(`📊 ${api.name} respondió:`, JSON.stringify(jsonData).substring(0, 300))

        // Validar que tenga datos
        if (!jsonData) {
          console.warn(`${api.name} - Respuesta vacía`)
          continue
        }

        // Intentar extraer URLs
        const audioUrl = type === "audio" ? api.extractAudio(jsonData) : null
        const videoUrl = type === "video" ? api.extractVideo(jsonData) : null
        const fileUrl = type === "audio" ? audioUrl : videoUrl

        if (fileUrl) {
          data = jsonData
          successApi = api.name
          console.log(`✅ Éxito con ${api.name}`)
          break
        }
      } catch (err) {
        console.error(`❌ ${api.name} error:`, err.message)
        continue
      }
    }

    if (!data || !successApi) {
      console.error("❌ Ninguna API funcionó")
      await m.react("❌")
      return m.reply("🚫 No se pudo descargar. Intenta más tarde.\n(Las APIs están caídas)")
    }

    // Extraer URLs según estructura de respuesta
    const fileUrl = type === "audio" ? 
      (data.audio || data.result?.audio || data.links?.[0]?.url) : 
      (data.video || data.result?.video || data.links?.[0]?.url)
    
    const title = cleanName(data.title || data.filename || data.name || "Archivo")

    if (!fileUrl) {
      console.error("❌ No se encontró URL de archivo")
      await m.react("❌")
      return m.reply("🚫 Archivo no disponible.")
    }

    console.log(`📥 Descargando desde: ${fileUrl}`)

    if (type === "audio") {
      try {
        const response = await fetch(fileUrl, { timeout: 60000 })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)

        const arrayBuffer = await response.arrayBuffer()
        const buffer = Buffer.from(new Uint8Array(arrayBuffer))

        console.log(`📦 Tamaño del audio: ${(buffer.length / 1024 / 1024).toFixed(2)}MB`)

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
        console.error("❌ Error descargando audio:", err)
        await m.react("❌")
        return m.reply(`❌ Error al descargar el audio.\n${err.message}`)
      }
    } else {
      try {
        const response = await fetch(fileUrl, { timeout: 60000 })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)

        const arrayBuffer = await response.arrayBuffer()
        const buffer = Buffer.from(new Uint8Array(arrayBuffer))

        console.log(`📦 Tamaño del video: ${(buffer.length / 1024 / 1024).toFixed(2)}MB`)

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
        console.error("❌ Error descargando video:", err)
        await m.react("❌")
        return m.reply(`❌ Error al descargar el video.\n${err.message}`)
      }
    }

    console.log(`✅ Descarga completada - API: ${successApi}`)
    await m.react("🎉")
  } catch (e) {
    console.error("❌ Error general en download:", e)
    await m.react("❌")
    m.reply(`❌ Error durante la descarga.\n${e.message}`)
  }
}

// ─────────────────────────────
// 🛠 EXTRAER ID DE VIDEO
// ─────────────────────────────
const extractVideoId = (url) => {
  try {
    const u = new URL(url)
    return u.searchParams.get("v") || url.split("v=")[1]
  } catch {
    return url
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