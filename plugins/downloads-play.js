import fetch from 'node-fetch'
import yts from 'yt-search'
import fs from 'fs'
import path from 'path'
import { exec } from 'child_process'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const TMP_DIR = path.join(__dirname, '../tmp')
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true })

function ffmpeg(input, output) {
  return new Promise((resolve, reject) => {
    exec(
      `ffmpeg -y -i "${input}" -vn -acodec libmp3lame -ab 128k "${output}"`,
      err => err ? reject(err) : resolve()
    )
  })
}

async function getMp3(url) {
  try {
    const res = await fetch(
      `https://gawrgura-api.onrender.com/download/ytmp3?url=${encodeURIComponent(url)}`
    )

    const type = res.headers.get('content-type') || ''
    if (!type.includes('application/json')) return null

    const json = await res.json()
    if (typeof json?.result === 'string') return json.result

    return null
  } catch {
    return null
  }
}

const handler = async (m, { conn, text }) => {
  if (!text) {
    return m.reply('🎵 Usa: .play nombre de canción')
  }

  await m.react('🔍')

  const search = await yts(text)
  const video = search.videos?.[0]
  if (!video) return m.reply('❌ No encontré resultados')

  await conn.sendMessage(
    m.chat,
    {
      image: { url: video.image },
      caption: `🎶 *${video.title}*\n⏳ Procesando audio...`
    },
    { quoted: m }
  )

  const audioUrl = await getMp3(video.url)
  if (!audioUrl) return m.reply('⚠ La API no devolvió un audio válido.')

  const safe = video.title.replace(/[\\/:*?"<>|]/g, '').slice(0, 50)
  const raw = path.join(TMP_DIR, `${Date.now()}.bin`)
  const mp3 = path.join(TMP_DIR, `${safe}.mp3`)

  const res = await fetch(audioUrl)
  await new Promise((resolve, reject) => {
    const s = fs.createWriteStream(raw)
    res.body.pipe(s)
    res.body.on('error', reject)
    s.on('finish', resolve)
  })

  await ffmpeg(raw, mp3)

  await conn.sendFile(
    m.chat,
    mp3,
    `${safe}.mp3`,
    `🎧 ${video.title}`,
    m,
    false,
    { asDocument: true }
  )

  fs.unlinkSync(raw)
  fs.unlinkSync(mp3)

  await m.react('✅')
}

handler.help = ['play <texto>']
handler.tags = ['descargas']
handler.command = /^play$/i

export default handler
