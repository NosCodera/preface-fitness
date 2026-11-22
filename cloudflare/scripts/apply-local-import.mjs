import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const root = process.cwd();
const dir = path.resolve(root, 'cloudflare/import-output');
if (!fs.existsSync(dir)) throw new Error('Import SQL not generated.');
const files = fs.readdirSync(dir).filter((name) => name.endsWith('.sql')).sort();
if (!files.length) throw new Error('No SQL import batches found.');

for (const file of files) {
  const sqlFile = path.resolve(dir, file);
  // On Windows, npx.cmd is a shell shim and cannot be launched reliably with
  // execFileSync. Run the command through the platform shell instead.
  const command = `npx wrangler --config cloudflare/wrangler.toml d1 execute preface-fitness --local --file "${sqlFile}"`;
  execSync(command, { stdio: 'inherit', shell: true, cwd: root });
}
console.log(`Applied ${files.length} import batches to local D1.`);
