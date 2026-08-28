const fetch = require('node-fetch'); // Make sure you have node-fetch installed

const targetUrl = process.argv[2] || 'http://localhost:3000/api/simulate/reading';
const intervalMs = 10000; // 10 seconds

console.log(`\n🚀 Iniciando Simulador de Energía en Tiempo Real`);
console.log(`📡 Destino: ${targetUrl}`);
console.log(`⏱️  Frecuencia: Cada ${intervalMs / 1000} segundos`);
console.log(`Presiona Ctrl+C para detener...\n`);

let tickCount = 1;

setInterval(async () => {
  try {
    const res = await fetch(targetUrl, { method: 'POST' });
    if (res.ok) {
      console.log(`[${new Date().toLocaleTimeString()}] ✅ Tick #${tickCount} enviado correctamente (Consumo y Solar generados).`);
    } else {
      console.error(`[${new Date().toLocaleTimeString()}] ❌ Error en Tick #${tickCount}: HTTP ${res.status}`);
    }
  } catch (error) {
    console.error(`[${new Date().toLocaleTimeString()}] ⚠️ Error de conexión: ${error.message}`);
  }
  tickCount++;
}, intervalMs);
