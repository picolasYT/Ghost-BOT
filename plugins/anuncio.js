// plugins/anuncio.js

const anuncios = global.anuncios || (global.anuncios = {})

const handler = async (m, { conn, text, usedPrefix }) => {

  if (!text) {
    return m.reply(
      `📢 *Uso del comando anuncio*\n\n` +
      `• ${usedPrefix}anuncio <tiempo> <mensaje>\n` +
      `• ${usedPrefix}anuncio stop\n\n` +
      `Ejemplos:\n` +
      `• ${usedPrefix}anuncio 5m API: ejemplo.com\n` +
      `• ${usedPrefix}anuncio 2h Síguenos en nuestro canal`
    )
  }

  // 🛑 STOP
  if (text.toLowerCase() === 'stop') {
    if (!anuncios[m.chat]) {
      return m.reply('⚠️ No hay ningún anuncio activo en este chat.')
    }

    clearInterval(anuncios[m.chat].interval)
    delete anuncios[m.chat]

    return m.reply('🛑 Anuncio detenido correctamente.')
  }

  // ⏱ Parseo tiempo
  const match = text.match(/^(\d+)([mhd])\s+([\s\S]+)/i)
  if (!match) {
    return m.reply(
      '❌ Formato inválido.\n\n' +
      `Ejemplo correcto:\n${usedPrefix}anuncio 5m Mensaje del anuncio`
    )
  }

  const cantidad = parseInt(match[1])
  const unidad = match[2].toLowerCase()
  const mensaje = match[3]

  let tiempoMs = 0
  if (unidad === 'm') tiempoMs = cantidad * 60 * 1000
  if (unidad === 'h') tiempoMs = cantidad * 60 * 60 * 1000
  if (unidad === 'd') tiempoMs = cantidad * 24 * 60 * 60 * 1000

  if (tiempoMs < 60000) {
    return m.reply('⚠️ El tiempo mínimo permitido es 1 minuto.')
  }

  // 🔁 Reemplazar anuncio si ya existe
  if (anuncios[m.chat]) {
    clearInterval(anuncios[m.chat].interval)
  }

  const interval = setInterval(async () => {
    try {
      await conn.sendMessage(m.chat, { text: `📢 *ANUNCIO*\n\n${mensaje}` })
    } catch (e) {
      console.error('Error en anuncio:', e)
    }
  }, tiempoMs)

  anuncios[m.chat] = {
    interval,
    mensaje,
    tiempoMs,
    creadoPor: m.sender
  }

  m.reply(
    `📢 *Anuncio programado*\n\n` +
    `⏱ Repetición: *cada ${cantidad}${unidad}*\n` +
    `💬 Mensaje:\n${mensaje}\n\n` +
    `🛑 Para detener:\n${usedPrefix}anuncio stop`
  )
}

handler.help = ['anuncio']
handler.tags = ['admin']
handler.command = ['anuncio']
handler.group = true
handler.admin = true   // 🔥 CLAVE PARA TU HANDLER

export default handler
