// plugins/anuncio.js

const anuncios = global.anuncios || (global.anuncios = {})

const handler = async (m, { conn, text, usedPrefix, command, isOwner, isAdmin }) => {
  if (!isOwner && !isAdmin) {
    return m.reply('❌ Solo administradores u owner pueden usar este comando.')
  }

  if (!text) {
    return m.reply(
      `Uso:\n${usedPrefix}anuncio <tiempo> <mensaje>\n\nEjemplos:\n${usedPrefix}anuncio 5m API: ejemplo.com\n${usedPrefix}anuncio 2h Mensaje\n${usedPrefix}anuncio stop`
    )
  }

  // Detener anuncio
  if (text.toLowerCase() === 'stop') {
    if (!anuncios[m.chat]) return m.reply('⚠️ No hay anuncios activos en este chat.')

    clearInterval(anuncios[m.chat].interval)
    delete anuncios[m.chat]

    return m.reply('🛑 Anuncio detenido correctamente.')
  }

  // Parsear tiempo
  const match = text.match(/^(\d+)([mhd])\s+([\s\S]+)/i)
  if (!match) {
    return m.reply(
      '❌ Formato inválido.\nEjemplo:\n.anuncio 5m Mensaje del anuncio'
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
    return m.reply('⚠️ El tiempo mínimo es 1 minuto.')
  }

  // Si ya hay anuncio, lo reemplaza
  if (anuncios[m.chat]) {
    clearInterval(anuncios[m.chat].interval)
  }

  const interval = setInterval(async () => {
    try {
      await conn.sendMessage(m.chat, { text: mensaje })
    } catch (e) {
      console.error('Error anuncio:', e)
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
    `⏱ Cada: *${cantidad}${unidad}*\n` +
    `💬 Mensaje:\n${mensaje}\n\n` +
    `🛑 Para detener:\n${usedPrefix}anuncio stop`
  )
}

handler.help = ['anuncio']
handler.tags = ['admin']
handler.command = ['anuncio']
handler.group = true

export default handler
