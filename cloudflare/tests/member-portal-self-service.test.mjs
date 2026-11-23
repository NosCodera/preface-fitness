import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const migration = readFileSync(new URL('../migrations/0006_member_portal_self_service.sql', import.meta.url), 'utf8');
const worker = readFileSync(new URL('../worker/index.js', import.meta.url), 'utf8');

test('member portal history migration is additive and gym/member scoped', () => {
  assert.match(migration, /CREATE TABLE IF NOT EXISTS member_portal_profile_history/i);
  assert.match(migration, /FOREIGN KEY \(gym_id\) REFERENCES gyms\(id\)/i);
  assert.match(migration, /FOREIGN KEY \(member_id\) REFERENCES members\(id\)/i);
  assert.doesNotMatch(migration, /\bDROP\s+(TABLE|COLUMN|INDEX)\b/i);
});

test('member portal login returns PT and profile history', () => {
  assert.match(worker, /pt_sessions p LEFT JOIN trainers t/i);
  assert.match(worker, /profile_history:/i);
});

test('member profile update verifies PIN and records snapshots', () => {
  assert.match(worker, /member_portal_update_profile/);
  assert.match(worker, /bcrypt\.compare\(pin,credential\.pin_hash\)/);
  assert.match(worker, /INSERT INTO member_portal_profile_history/);
  assert.match(worker, /INSERT INTO progress_records/);
});
