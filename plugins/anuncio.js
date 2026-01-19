// plugins/anuncio.js

// Almacén global de anuncios activos
if (!global.anuncios) global.anuncios = {}

const handler = async (m, { conn, text, usedPrefix, isOwner, isAdmin }) => {
  // 🔒 Permisos
  if (!isOwner && !isAdmin) {
    return m.reply('❌ Solo administradores u owner pueden usar este comando.')
  }

  if (!text) {
    return m.reply(
      `📢 *Uso del comando anuncio*\n\n` +
      `${usedPrefix}anuncio <tiempo> <mensaje>\n` +
      `${usedPrefix}anuncio stop\n\n` +
      `Ejemplos:\n` +
      `• ${usedPrefix}anuncio 5m API: ejemplo.com\n` +
      `• ${usedPrefix}anuncio 2h Recordatorio\n` +
      `• ${usedPrefix}anuncio stop`
    )
  }

  // 🛑 Detener anuncio
  if (text.toLowerCase() === 'stop') {
    if (!global.anuncios[m.chat]) {
      return m.reply('⚠️ No hay anuncios activos en este chat.')
    }

    clearInterval(global.anuncios[m.chat])
    delete global.anuncios[m.chat]

    return m.reply('🛑 Anuncio detenido correctamente.')
  }

  // ⏱ Parsear tiempo: 5m / 2h / 1d
  const match = text.match(/^(\d+)([mhd])\s+([\s\S]+)/i)
  if (!match) {
    return m.reply(
      '❌ Formato inválido.\n\nEjemplo correcto:\n.anuncio 5m Mensaje del anuncio'
    )
  }

  const cantidad = Number(match[1])
  const unidad = match[2].toLowerCase()
  const mensaje = match[3]

  let tiempoMs
  switch (unidad) {
    case 'm':
      tiempoMs = cantidad * 60 * 1000
      break
    case 'h':
      tiempoMs = cantidad * 60 * 60 * 1000
      break
    case 'd':
      tiempoMs = cantidad * 24 * 60 * 60 * 1000
      break
    default:
      tiempoMs = 0
  }

  if (tiempoMs < 60_000) {
    return m.reply('⚠️ El tiempo mínimo es 1 minuto.')
  }

  // ♻️ Si ya hay anuncio, lo reemplaza
  if (global.anuncios[m.chat]) {
    clearInterval(global.anuncios[m.chat])
  }

  // ▶️ Crear intervalo
  const interval = setInterval(async () => {
    try {
      await conn.sendMessage(m.chat, { text: mensaje })
    } catch (e) {
      console.error('[ANUNCIO ERROR]', e)
    }
  }, tiempoMs)

  global.anuncios[m.chat] = interval

  // ✅ Confirmación
  await m.reply(
    `📢 *Anuncio programado correctamente*\n\n` +
    `⏱ Intervalo: *${cantidad}${unidad}*\n` +
    `💬 Mensaje:\n${mensaje}\n\n` +
    `🛑 Para detener:\n${usedPrefix}anuncio stop`
  )
}

handler.help = ['anuncio']
handler.tags = ['admin']
handler.command = ['anuncio']
handler.group = true

export default handler
