import { spawn } from 'child_process';
import fs from 'fs';

console.log('🚀 Iniciando Sprint Party 3D con Túnel Público para Universidades/4G...');

// 1. Start Vite
const vite = spawn('npx', ['vite', '--host'], { stdio: 'inherit' });

// 2. Start Cloudflare Tunnel
const cloudflared = spawn('cloudflared', ['tunnel', '--url', 'http://localhost:3000']);

cloudflared.stderr.on('data', (data) => {
  const text = data.toString();
  const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
  if (match) {
    const url = match[0];
    fs.writeFileSync('/tmp/cloudflared.log', url);
    console.log('\n===============================================================');
    console.log('🌐 ¡TÚNEL PÚBLICO ACTIVO PARA CUALQUIER RED O DATOS MÓVILES!');
    console.log(`👉 URL para Móviles: ${url}`);
    console.log('===============================================================\n');
  }
});

const cleanup = () => {
  try { vite.kill(); } catch (e) {}
  try { cloudflared.kill(); } catch (e) {}
  process.exit();
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
