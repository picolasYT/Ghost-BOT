import fetch from 'node-fetch'

const handler = async (m, { conn, text, usedPrefix, command }) => {
if (!text) return conn.reply(m.chat, `❍ Escribe el nombre del grupo a buscar.\nEj: *${usedPrefix + command} Memes*`, m)
await m.react('🕒') 
try {
const res = await fetch(`${global.APIs.gawrgura.url}/search/wpgroups?apikey=${global.APIs.gawrgura.key}&q=${encodeURIComponent(text)}`)
const json = await res.json()
if (!json.status || !json.data || json.data.length === 0) return conn.reply(m.chat, `ꕤ No se encontraron grupos con: *${text}*`, m)
let message = `✿ *Resultados de grupos para:* *${text}*\n\n`
json.data.slice(0, 10).forEach((g, i) => {
message += `「☆」 Busca *<${g.name}>*\n`
message += `> ❏ Link » ${g.link}\n\n`
})
conn.sendMessage(m.chat, { text: message }, { quoted: m })
} catch (e) {
conn.reply(m.chat, '✎ Ocurrió un error buscando los grupos.', m)
}}

handler.command = ['wagroups']
handler.tags = ['search']
handler.help = ['wpgroups', 'wagroups', 'wgrupos']

export default handler
