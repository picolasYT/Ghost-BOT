import fetch from "node-fetch"

const handler = async (m, { text }) => {
  if (!text) {
    return m.reply("❀ Uso:\n.ytstalk <usuario | @handle | url>")
  }

  try {
    // limpiar texto
    let user = text.trim()

    // si pega url completa
    if (user.includes("youtube.com")) {
      const match = user.match(/(@[a-zA-Z0-9._-]+)/)
      if (match) user = match[1]
    }

    const apiUrl = `https://gawrgura-api.onrender.com/stalk/youtube?user=${encodeURIComponent(user)}`
    const res = await fetch(apiUrl)
    const json = await res.json()

    // la API a veces responde distinto
    const data = json.result || json.data || json

    if (!data || !data.name) {
      console.log("Respuesta API:", json)
      return m.reply("❌ No se pudo obtener info del canal.")
    }

    const msg = `
📺 *YouTube Stalk*

👤 *Canal:* ${data.name}
👥 *Suscriptores:* ${data.subscribers || "No disponible"}
👁️ *Vistas:* ${data.views || "No disponible"}
🎥 *Videos:* ${data.videos || "No disponible"}
📅 *Creado:* ${data.created || "No disponible"}

🔗 ${data.url || "No disponible"}
`.trim()

    await m.reply(msg)

  } catch (e) {
    console.error("YTSTALK ERROR:", e)
    m.reply("⚠️ Error consultando YouTube.")
  }
}

handler.help = ["ytstalk"]
handler.tags = ["tools"]
handler.command = ["ytstalk"]

// 👇 CLAVE PARA TU HANDLER
handler.owner = false
handler.admin = false
handler.group = false
handler.private = false
handler.premium = false
handler.botAdmin = false

export default handler
