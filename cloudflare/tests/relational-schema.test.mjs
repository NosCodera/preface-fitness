import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sql = readFileSync(new URL('../migrations/0004_relational_business_schema.sql', import.meta.url), 'utf8');

test('creates dedicated member and payment tables', () => {
  assert.match(sql, /CREATE TABLE IF NOT EXISTS members\s*\(/i);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS payments\s*\(/i);
});

test('creates staff, trainer, PT and member portal tables', () => {
  for (const name of ['gym_users','trainers','pt_sessions','member_portal_credentials','member_portal_login_attempts']) {
    assert.match(sql, new RegExp(`CREATE TABLE IF NOT EXISTS ${name}\\s*\\(`, 'i'));
  }
});

test('keeps gym scoping and foreign key constraints', () => {
  assert.match(sql, /FOREIGN KEY \(gym_id\) REFERENCES gyms\(id\)/i);
  assert.match(sql, /idx_members_gym_name/i);
  assert.match(sql, /idx_payments_gym_date/i);
});

test('migration is additive and does not drop transition data', () => {
  assert.doesNotMatch(sql, /\bDROP\s+(TABLE|COLUMN|INDEX)\b/i);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS relational_schema_manifest/i);
});

test('marks uncertain membership plan mapping as provisional', () => {
  assert.match(sql, /membership_plans.*Provisional columns; verify source table column export before import/s);
});
