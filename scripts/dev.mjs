import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';

const root = process.cwd();
const wrangler = resolve(root, 'node_modules/wrangler/bin/wrangler.js');
const vite = resolve(root, 'node_modules/vite/bin/vite.js');
if (!existsSync(wrangler) || !existsSync(vite)) {
  console.error('Dependencies not installed. Run npm install once, then npm run dev.');
  process.exit(1);
}
const children = [];
function start(label, script, args) {
  const child = spawn(process.execPath, [script, ...args], { cwd: root, stdio: 'inherit', env: process.env });
  child.on('error', (e) => { console.error(`${label} failed to start:`, e.message); shutdown(1); });
  child.on('exit', (code) => {
    if (!shuttingDown && code !== 0) {
      console.error(`${label} stopped (exit ${code ?? 'unknown'}).`);
      shutdown(code || 1);
    }
  });
  children.push(child);
  return child;
}
let shuttingDown = false;
function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) if (!child.killed) child.kill();
  setTimeout(() => process.exit(code), 300);
}
process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
console.log('\nPREFACE FITNESS: starting local Cloudflare Worker + Vite');
console.log('Worker API: http://localhost:8787');
console.log('Website:    http://localhost:5173\n');
start('Cloudflare Worker', wrangler, ['--config', 'cloudflare/wrangler.toml', 'dev', '--local', '--port', '8787']);
start('Vite', vite, ['--host', 'localhost', '--port', '5173', '--strictPort']);
