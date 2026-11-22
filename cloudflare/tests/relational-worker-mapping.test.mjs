import test from 'node:test';
import assert from 'node:assert/strict';
import { encodeRow, decodeRow } from '../worker/index.js';

test('membership plans map source months/price/description to D1 relational columns', () => {
  const encoded = encodeRow('membership_plans', { id:'p1', gym_id:'g1', name:'Annual', months:12, price:12000, description:'One year' });
  assert.equal(encoded.months, 12);
  assert.equal(encoded.price, 12000);
  assert.equal(encoded.description, 'One year');
  const decoded = decodeRow('membership_plans', { id:'p1', gym_id:'g1', name:'Annual', months:12, price:12000, description:'One year' });
  assert.equal(decoded.months, 12);
  assert.equal(decoded.price, 12000);
  assert.equal(decoded.description, 'One year');
});

test('member JSON metadata and photo are preserved without dropping scalar columns', () => {
  const encoded = encodeRow('members', { id:'m1', gym_id:'g1', name:'A', metadata:{ source:'import' }, photo:'data:image/jpeg;base64,AA==' });
  assert.equal(encoded.metadata_json, '{"source":"import"}');
  assert.equal(encoded.photo, 'data:image/jpeg;base64,AA==');
  const decoded = decodeRow('members', { id:'m1', gym_id:'g1', name:'A', metadata_json:'{"source":"import"}', photo:'data:image/jpeg;base64,AA==' });
  assert.deepEqual(decoded.metadata, { source:'import' });
  assert.equal(decoded.photo, 'data:image/jpeg;base64,AA==');
});

test('workout plan JSON arrays map to dedicated D1 columns and back', () => {
  const encoded = encodeRow('workout_plans', { id:'w1', gym_id:'g1', assigned_member_ids:['m1'], exercises:[{name:'Squat'}], metadata:{} });
  assert.equal(encoded.assigned_member_ids_json, '["m1"]');
  assert.equal(encoded.exercises_json, '[{"name":"Squat"}]');
  const decoded = decodeRow('workout_plans', { id:'w1', gym_id:'g1', assigned_member_ids_json:'["m1"]', exercises_json:'[{"name":"Squat"}]', metadata_json:'{}' });
  assert.deepEqual(decoded.assigned_member_ids, ['m1']);
  assert.deepEqual(decoded.exercises, [{name:'Squat'}]);
});

test('app settings JSON values are retained as JSON values', () => {
  const encoded = encodeRow('app_settings', { id:'s1', gym_id:'g1', setting_key:'gymLatitude', setting_value:26.8 });
  assert.equal(encoded.setting_value_json, '26.8');
  const decoded = decodeRow('app_settings', { id:'s1', gym_id:'g1', setting_key:'gymLatitude', setting_value_json:'26.8' });
  assert.equal(decoded.setting_value, 26.8);
});
