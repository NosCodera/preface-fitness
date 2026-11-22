#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
const get = (name, fallback) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : fallback; };
const confirmed = args.includes('--confirm-remote');
const database = get('--database', 'preface-fitness');
const config = get('--config', 'cloudflare/wrangler.toml');
const directory = path.resolve(get('--out', 'cloudflare/import-output'));
const manifestPath = path.join(directory, 'manifest.json');
if (!confirmed) {
  console.error('Safety stop: this script writes to REMOTE D1. Re-run with --confirm-remote only after verifying the database name and backup.');
  process.exit(2);
}
if (!fs.existsSync(manifestPath)) throw new Error(`Import manifest not found: ${manifestPath}. Run import-browser-backup-relational.mjs first.`);
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
if (manifest.sourceCreatedAt !== '2026-11-14T12:00:17.840Z') {
  throw new Error(`Unexpected backup timestamp ${manifest.sourceCreatedAt}; refusing remote import.`);
}
if (manifest.gymId !== 'd702119b-3205-46a2-9ee0-294d682ddf14') {
  throw new Error(`Unexpected gym ID ${manifest.gymId}; refusing remote import.`);
}
const files = fs.readdirSync(directory).filter(name => /^\d{3}-relational\.sql$/.test(name)).sort();
if (!files.length) throw new Error(`No SQL batches found in ${directory}`);
console.log(`About to apply ${files.length} non-destructive SQL batches to REMOTE D1 database "${database}".`);
console.log(`Source backup: ${manifest.sourceCreatedAt}; counts: ${JSON.stringify(manifest.counts)}`);
for (let i = 13; i < files.length; i++) {
  const file = path.join(directory, files[i]);
  console.log(`[${i + 1}/${files.length}] ${files[i]}`);
  const result = spawnSync('npx', ['wrangler', '--config', config, 'd1', 'execute', database, '--remote', '--yes', '--file', file], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) {
    throw new Error(`Remote import stopped at ${files[i]}. Do not blindly rerun; inspect the last successful batch and D1 counts first.`);
  }
}
console.log('Remote relational import batches completed. Run the verification queries in cloudflare/PRODUCTION_CUTOVER.md.');
