import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const source=readFileSync(new URL('../scripts/import-browser-backup-relational.mjs',import.meta.url),'utf8');
test('relational importer maps all known browser backup collections',()=>{
 for(const table of ['membership_plans','members','payments','attendance','trainers','pt_sessions','progress_records','workout_plans','diet_plans','communication_logs','app_settings','leads']) assert.match(source,new RegExp(`insert\\('${table}'`));
});
test('importer is non-destructive and does not invent auth credentials',()=>{
 assert.match(source,/INSERT OR IGNORE INTO/);
 assert.match(source,/member_portal_credentials PIN hashes/);
 assert.doesNotMatch(source,/INSERT OR REPLACE INTO users/);
});
test('self-referencing member referrals are deferred until member rows exist',()=>assert.match(source,/Resolve self-referential member referrals after all parent member rows exist/));
