import fetch from "node-fetch"

const RAPID_KEY = "814651014emsh71e028776d9a33dp1600e6jsn2e4b042ad0f6"
const RAPID_HOST = "netflix-api8.p.rapidapi.com"

const handler = async (m, { conn }) => {
  try {
    await m.react("🎬")

    const url =
      "https://netflix-api8.p.rapidapi.com/api/title/type?titleIds=70140425,81566729,81171201,70172929"

    const res = await fetch(url, {
      headers: {
        "x-rapidapi-host": RAPID_HOST,
        "x-rapidapi-key": RAPID_KEY,
      },
    })

    const data = await res.json()

    if (!Array.isArray(data) || !data.length)
      return m.reply("❌ No se pudieron obtener películas.")

    let text = "🎬 *Películas disponibles*\n\n"

    for (const movie of data) {
      text +=
        `🎥 *${movie.title || "Sin título"}*\n` +
        `📅 Año: ${movie.releaseYear || "N/D"}\n` +
        `⭐ Rating: ${movie.rating || "N/D"}\n` +
        `📝 Tipo: ${movie.type || "N/D"}\n\n`
    }

    await conn.sendMessage(
      m.chat,
      { text },
      { quoted: m }
    )

    await m.react("✅")

  } catch (e) {
    console.error(e)
    await m.react("❌")
    m.reply("⚠ Error al obtener películas.")
  }
}

handler.command = ["movie", "movies"]
handler.tags = ["entretenimiento"]
handler.register = true

export default handler
