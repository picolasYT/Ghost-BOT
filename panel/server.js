import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3000

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')))

// Ruta principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

// API simple (estado)
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    bot: 'Ghost-BOT',
    uptime: process.uptime()
  })
})

app.listen(PORT, () => {
  console.log(`🌐 Panel web activo en puerto ${PORT}`)
})
