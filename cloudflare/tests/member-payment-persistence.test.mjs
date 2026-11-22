import test from 'node:test';
import assert from 'node:assert/strict';
import { encodeRow, decodeRow } from '../worker/index.js';

test('member legacy identifier is retained by the Worker data allowlist', () => {
  const row = { id: 'cloud-member-1', gym_id: 'gym-1', member_code: 'PF-1001', legacy_id: 'old-member-1' };
  const encoded = encodeRow('members', row);
  assert.equal(encoded.legacy_id, 'old-member-1');
  assert.equal(decodeRow('members', encoded).legacy_id, 'old-member-1');
});

test('payment legacy identifier is retained by the Worker data allowlist', () => {
  const row = { id: 'cloud-payment-1', gym_id: 'gym-1', member_id: 'cloud-member-1', amount: 500, legacy_id: 'PAY-123' };
  const encoded = encodeRow('payments', row);
  assert.equal(encoded.legacy_id, 'PAY-123');
  assert.equal(decodeRow('payments', encoded).legacy_id, 'PAY-123');
});
