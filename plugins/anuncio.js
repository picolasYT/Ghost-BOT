// plugins/anuncio.js

const anuncios = global.anuncios || (global.anuncios = {})

const handler = async (m, { conn, text, usedPrefix }) => {

  if (!text) {
    return m.reply(
      `📢 Uso correcto:\n\n` +
      `${usedPrefix}anuncio <tiempo> <mensaje>\n` +
      `${usedPrefix}anuncio stop\n\n` +
      `Ejemplo:\n${usedPrefix}anuncio 5m API: ejemplo.com`
    )
  }

  // detener anuncio
  if (text.toLowerCase() === 'stop') {
    if (!anuncios[m.chat]) {
      return m.reply('⚠️ No hay anuncios activos en este chat.')
    }

    clearInterval(anuncios[m.chat].interval)
    delete anuncios[m.chat]

    return m.reply('🛑 Anuncio detenido correctamente.')
  }

  // parse tiempo
  const match = text.match(/^(\d+)([mhd])\s+([\s\S]+)/i)
  if (!match) {
    return m.reply('❌ Formato inválido.\nEjemplo: .anuncio 5m Mensaje')
  }

  const cantidad = Number(match[1])
  const unidad = match[2].toLowerCase()
  const mensaje = match[3]

  let tiempoMs = 0
  if (unidad === 'm') tiempoMs = cantidad * 60 * 1000
  if (unidad === 'h') tiempoMs = cantidad * 60 * 60 * 1000
  if (unidad === 'd') tiempoMs = cantidad * 24 * 60 * 60 * 1000

  if (tiempoMs < 60000) {
    return m.reply('⚠️ El tiempo mínimo es 1 minuto.')
  }

  // reemplazar anuncio previo
  if (anuncios[m.chat]) {
    clearInterval(anuncios[m.chat].interval)
  }

  const interval = setInterval(() => {
    conn.sendMessage(m.chat, {
      text: `📢 *ANUNCIO OFICIAL*\n\n${mensaje}`
    })
  }, tiempoMs)

  anuncios[m.chat] = {
    interval,
    creadoPor: m.sender
  }

  m.reply(
    `✅ *Anuncio activado*\n\n` +
    `⏱ Cada: *${cantidad}${unidad}*\n` +
    `🛑 Para detener:\n${usedPrefix}anuncio stop`
  )
}

handler.command = ['anuncio']
handler.group = true
handler.owner = true   // 🔥 SOLO EL CREADOR DEL BOT

export default handler
