import fetch from "node-fetch"

const handler = async (m, { conn, text, usedPrefix }) => {
  if (!text) {
    return m.reply(
      `📌 Uso correcto:\n${usedPrefix}ytstalk <nombre o ID del canal>`
    )
  }

  await m.react("🔍")

  try {
    const endpoint = `https://gawrgura-api.onrender.com/stalk/youtube?user=${encodeURIComponent(text)}`
    const res = await fetch(endpoint).then(r => r.json())

    if (!res?.status || !res?.result) {
      throw "No se encontró información del canal."
    }

    const data = res.result

    let info = `📺 *YouTube Stalk*
    
👤 *Canal:* ${data.name || "No disponible"}
🔗 *Link:* ${data.url || "No disponible"}
👁️ *Vistas:* ${data.views || "No disponible"}
👥 *Suscriptores:* ${data.subscribers || "No disponible"}
🎥 *Videos:* ${data.videos || "No disponible"}
📅 *Creado:* ${data.createdAt || "No disponible"}
💬 *Descripción:* ${data.description || "No disponible"}
`

    // Si la API devuelve imagen
    if (data.thumbnail) {
      await conn.sendMessage(
        m.chat,
        {
          image: { url: data.thumbnail },
          caption: info.trim()
        },
        { quoted: m }
      )
    } else {
      m.reply(info.trim())
    }
    await m.react("✅")

  } catch (e) {
    await m.react("✖️")
    m.reply(typeof e === "string"
      ? `⚠️ ${e}`
      : "❌ Error al consultar la API de YouTube.")
  }
}

handler.help = ['ytstalk']
handler.tags = ['tools']
handler.command = ['ytstalk', 'youtubestalk']

export default handler
