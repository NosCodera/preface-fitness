#!/usr/bin/env node
/**
 * Safe, repeatable import of Preface Fitness browser JSON backup into D1's
 * transition `records` store. Uses INSERT OR IGNORE: it never overwrites rows.
 * Run only after applying migrations 0001 and 0002 to the target D1 database.
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
const get = (name, fallback) => { const i=args.indexOf(name); return i>=0 ? args[i+1] : fallback; };
const backupPath = get('--backup', 'preface-fitness-complete-backup-2026-11-14.json');
const database = get('--database', 'preface-fitness');
const batchSize = Math.max(1, Math.min(100, Number(get('--batch-size', '40'))));
const execute = args.includes('--execute');
const outputDir = path.resolve(get('--out', './d1-import-generated'));

if (!fs.existsSync(backupPath)) throw new Error(`Backup file not found: ${backupPath}`);
const backup = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
if (backup.format !== 'preface-fitness-complete-backup' || !backup.data || !backup.data.gym?.id) {
  throw new Error('Unexpected backup format or missing gym identity. Nothing imported.');
}
const gym = backup.data.gym;
const gymId = String(gym.id);
const tables = [
  ['members','members'], ['leads','leads'], ['payments','payments'],
  ['attendance','attendance'], ['trainers','trainers'], ['ptSessions','pt_sessions'],
  ['progressRecords','progress_records'], ['workoutPlans','workout_plans'],
  ['dietPlans','diet_plans'], ['communicationLogs','communication_logs'],
  ['feedbacks','feedbacks'], ['membershipPlans','membership_plans'],
  ['websiteEnquiries','public_enquiries']
];
const sqlString = value => `'${String(value).replaceAll("'", "''")}'`;
const rows = [];
for (const [sourceKey, tableName] of tables) {
  const list = backup.data[sourceKey] ?? [];
  if (!Array.isArray(list)) throw new Error(`${sourceKey} is not an array`);
  for (let i=0; i<list.length; i++) {
    const source = list[i];
    const id = String(source.cloudId || source.id || `${sourceKey}-${i+1}`);
    const payload = { ...source, id, cloudId: source.cloudId || source.id || id };
    rows.push({ id, tableName, payload });
  }
}
// Preserve the entire browser settings object as one app_settings record.
rows.push({ id: 'preface-settings', tableName: 'app_settings', payload: { id:'preface-settings', settings: backup.data.settings || {} } });

fs.mkdirSync(outputDir, {recursive:true});
const gymSql = `INSERT OR IGNORE INTO gyms (id,name,slug,public_config_json) VALUES (${sqlString(gymId)},${sqlString(gym.name||'Preface Fitness')},${sqlString('preface-'+gymId.slice(0,8))},${sqlString(JSON.stringify(gym))});\n`;
fs.writeFileSync(path.join(outputDir,'000-gym.sql'), gymSql);
const files=[];
for (let offset=0, part=1; offset<rows.length; offset+=batchSize, part++) {
  const batch=rows.slice(offset,offset+batchSize);
  const statements=batch.map(r => `INSERT OR IGNORE INTO records (id,gym_id,table_name,payload_json,version) VALUES (${sqlString(r.id)},${sqlString(gymId)},${sqlString(r.tableName)},${sqlString(JSON.stringify(r.payload))},1);`).join('\n');
  const file=path.join(outputDir,`${String(part).padStart(3,'0')}-records.sql`);
  fs.writeFileSync(file, statements+'\n'); files.push(file);
}
const expected={gym:1};
for (const [key,table] of tables) expected[table]=(backup.data[key]||[]).length;
expected.app_settings=1;
fs.writeFileSync(path.join(outputDir,'manifest.json'), JSON.stringify({format:backup.format,createdAt:backup.createdAt,gymId,backupCounts:expected,generatedAt:new Date().toISOString(),insertMode:'INSERT OR IGNORE (no overwrite)',sourceMediaAssets:Object.keys(backup.mediaAssets||{}).length,sourceMediaFailures:(backup.mediaFailures||[]).length},null,2));
console.log(`Prepared ${rows.length} business records for gym ${gymId}.`);
console.log(`SQL batches: ${files.length}; output: ${outputDir}`);
console.log('Safety: INSERT OR IGNORE only. Existing D1 rows will not be overwritten.');
if (execute) {
  const commands=[path.join(outputDir,'000-gym.sql'),...files];
  for (const file of commands) {
    console.log(`Applying ${path.basename(file)} ...`);
    const result=spawnSync('npx',['wrangler','d1','execute',database,'--remote','--file',file],{stdio:'inherit',shell:process.platform==='win32'});
    if (result.status!==0) throw new Error(`Wrangler failed on ${file}; stop here and inspect D1 before retrying.`);
  }
  console.log('Import commands completed. Run the verification SQL in docs/POST_IMPORT_VERIFICATION.sql.');
} else {
  console.log('Dry run only. Re-run with --execute to apply the generated SQL to remote D1.');
}
