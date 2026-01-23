import fetch from "node-fetch"

const RAPID_KEY = "814651014emsh71e028776d9a33dp1600e6jsn2e4b042ad0f6"
const RAPID_HOST = "netflix133.p.rapidapi.com"

// IDs conocidos (podés agregar más)
const RANDOM_IDS = [
  "81040344",
  "80192098",
  "70264888",
  "81215567",
  "80100172"
]

const handler = async (m, { conn, text }) => {
  try {
    await m.react("🎬")

    let contentId

    // 🎲 RANDOM
    if (text && text.toLowerCase() === "random") {
      contentId = RANDOM_IDS[Math.floor(Math.random() * RANDOM_IDS.length)]
    } else if (text) {
      contentId = text.trim()
    } else {
      contentId = RANDOM_IDS[0]
    }

    const url = `https://netflix133.p.rapidapi.com/content?contentId=${contentId}`

    const res = await fetch(url, {
      headers: {
        "x-rapidapi-host": RAPID_HOST,
        "x-rapidapi-key": RAPID_KEY,
      },
    })

    const data = await res.json()

    if (!data?.title) {
      return m.reply("❌ No se pudo obtener la película.")
    }

    let msg =
      `🎬 *${data.title}*\n\n` +
      `📅 Año: ${data.year || "N/D"}\n` +
      `⭐ Rating: ${data.rating || "N/D"}\n` +
      `📝 Tipo: ${data.type || "N/D"}\n\n` +
      `📖 *Sinopsis:*\n${data.synopsis || "No disponible"}`

    await conn.sendMessage(
      m.chat,
      {
        text: msg,
        image: data.poster ? { url: data.poster } : undefined
      },
      { quoted: m }
    )

    await m.react("✅")

  } catch (e) {
    console.error("MOVIE ERROR:", e)
    await m.react("❌")
    m.reply("⚠ Error al obtener la película.")
  }
}

handler.command = ["movie"]
handler.tags = ["entretenimiento"]
handler.register = true

export default handler
