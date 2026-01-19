import fetch from "node-fetch"

const handler = async (m, { text }) => {
  if (!text) {
    return m.reply("❀ Uso correcto:\n.ytstalk <usuario de YouTube>")
  }

  try {
    const url = `https://gawrgura-api.onrender.com/stalk/youtube?user=${encodeURIComponent(text)}`
    const res = await fetch(url)
    const json = await res.json()

    if (!json || !json.result) {
      return m.reply("❌ No se encontró información del canal.")
    }

    const c = json.result

    const msg = `
📺 *YouTube Stalk*

👤 *Canal:* ${c.name || "No disponible"}
👥 *Subs:* ${c.subscribers || "?"}
👁️ *Vistas:* ${c.views || "?"}
🎥 *Videos:* ${c.videos || "?"}
📅 *Creado:* ${c.created || "?"}

🔗 ${c.url || "No disponible"}
`.trim()

    await m.reply(msg)

  } catch (e) {
    console.error(e)
    m.reply("⚠️ Error al consultar la API.")
  }
}

/* ===== CONFIGURACIÓN CLAVE PARA TU HANDLER ===== */

handler.help = ['ytstalk']
handler.tags = ['tools']
handler.command = ['ytstalk']

handler.owner = false     // ❌ NO solo owner
handler.admin = false     // ❌ NO solo admin
handler.group = false     // ✅ funciona en grupos
handler.private = false   // ✅ funciona en privado
handler.botAdmin = false
handler.premium = false

export default handler
