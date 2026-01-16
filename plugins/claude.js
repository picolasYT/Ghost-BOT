import fetch from 'node-fetch'
 
let handler = async (m, { text, command }) => {
  if (!text) {
    return m.reply(`❌ Uso correcto:\n.${command} <pregunta>`)
  }
 
  try {
    await m.reply('👻 Claude está pensando...')
 
    const res = await fetch('https://claude.ryzecodes.xyz/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: text
      })
    })
 
    const data = await res.json()
 
    // Ajuste defensivo por si cambia la respuesta
    const reply =
      data?.result ||
      data?.response ||
      data?.answer ||
      '❌ No hubo respuesta de la IA.'
 
    await m.reply(`🤖 *Claude dice:*\n\n${reply}`)
 
  } catch (err) {
    console.error(err)
    m.reply('❌ Error al conectar con Claude.')
  }
}
 
handler.help = ['claude <pregunta>']
handler.tags = ['ai']
handler.command = ['claude']
 
export default handler
 