const statusEl = document.getElementById('status')
const refreshBtn = document.getElementById('refresh')

async function loadStatus() {
  statusEl.innerText = '⏳ Cargando estado...'

  try {
    const res = await fetch('/api/status')
    const data = await res.json()

    statusEl.innerText =
      `🟢 Estado: ${data.status}\n` +
      `🤖 Bot: ${data.bot}\n` +
      `⏱ Uptime: ${Math.floor(data.uptime)} segundos`
  } catch (err) {
    statusEl.innerText = '🔴 Error al obtener el estado del servidor'
    console.error(err)
  }
}

// Botón actualizar
if (refreshBtn) {
  refreshBtn.addEventListener('click', loadStatus)
}

// Cargar automático al abrir
loadStatus()
