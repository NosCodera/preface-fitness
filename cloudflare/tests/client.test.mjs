import test from 'node:test';
import assert from 'node:assert/strict';
import { createCloudflareClient, CloudflareApiError } from '../../src/cloudflare/client.js';

function withFetch(fn) {
  const original = globalThis.fetch;
  globalThis.fetch = fn;
  return () => { globalThis.fetch = original; };
}

test('health calls the configured Worker and parses JSON', async () => {
  const restore = withFetch(async (url, init) => {
    assert.equal(url, 'https://api.example.test/health');
    assert.equal(init.method, 'GET');
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  });
  try {
    const api = createCloudflareClient({ baseUrl: 'https://api.example.test/', getToken: async () => null });
    assert.deepEqual(await api.health(), { ok: true });
  } finally { restore(); }
});

test('login sends credentials and gym ID as JSON', async () => {
  const restore = withFetch(async (_url, init) => {
    assert.equal(init.method, 'POST');
    assert.deepEqual(JSON.parse(init.body), { email: 'owner@example.test', password: 'example-pass', gymId: 'gym-1' });
    return new Response(JSON.stringify({ token: 'opaque-token' }), { status: 200 });
  });
  try {
    const api = createCloudflareClient({ baseUrl: 'https://api.example.test', getToken: async () => null, gymId: 'gym-1' });
    assert.deepEqual(await api.login('owner@example.test', 'example-pass'), { token: 'opaque-token' });
  } finally { restore(); }
});

test('authenticated data requests attach bearer token', async () => {
  const restore = withFetch(async (_url, init) => {
    assert.equal(init.headers.authorization, 'Bearer test-token');
    assert.equal(init.method, 'POST');
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  });
  try {
    const api = createCloudflareClient({ baseUrl: 'https://api.example.test', getToken: async () => 'test-token' });
    assert.deepEqual(await api.upsert('members', [{ id: 'm-1' }]), { ok: true });
  } finally { restore(); }
});

test('non-2xx responses throw CloudflareApiError with status and payload', async () => {
  const restore = withFetch(async () => new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }));
  try {
    const api = createCloudflareClient({ baseUrl: 'https://api.example.test', getToken: async () => null });
    await assert.rejects(api.me(), (error) => error instanceof CloudflareApiError && error.status === 401 && error.message === 'Unauthorized');
  } finally { restore(); }
});

test('missing base URL is rejected before making a request', () => {
  assert.throws(() => createCloudflareClient({ baseUrl: '', getToken: async () => null }), /base URL/);
});

test('account updates require current password and send optional credentials', async () => {
  const restore = withFetch(async (_url, init) => {
    assert.equal(init.method, 'PATCH');
    assert.deepEqual(JSON.parse(init.body), { currentPassword: 'old-pass', email: 'new@example.test', password: 'new-password' });
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  });
  try {
    const api = createCloudflareClient({ baseUrl: 'https://api.example.test', getToken: async () => 'token' });
    assert.deepEqual(await api.updateAccount({ currentPassword: 'old-pass', email: 'new@example.test', password: 'new-password' }), { ok: true });
  } finally { restore(); }
});

test('changes endpoint includes a durable cursor', async () => {
  const restore = withFetch(async (url) => {
    assert.equal(url, 'https://api.example.test/api/changes?after=12&limit=50');
    return new Response(JSON.stringify({ events: [], cursor: 12 }), { status: 200 });
  });
  try {
    const api = createCloudflareClient({ baseUrl: 'https://api.example.test', getToken: async () => 'token' });
    assert.deepEqual(await api.changes({ after: 12, limit: 50 }), { events: [], cursor: 12 });
  } finally { restore(); }
});

test('RPC calls preserve explicit not-implemented response as an API error', async () => {
  const restore = withFetch(async (_url, init) => {
    assert.deepEqual(JSON.parse(init.body), { name: 'get_my_access', args: {} });
    return new Response(JSON.stringify({ error: 'RPC_NOT_IMPLEMENTED' }), { status: 501 });
  });
  try {
    const api = createCloudflareClient({ baseUrl: 'https://api.example.test', getToken: async () => 'token' });
    await assert.rejects(api.rpc('get_my_access'), (error) => error instanceof CloudflareApiError && error.status === 501);
  } finally { restore(); }
});

test('relational list returns the data collection from the Worker envelope', async () => {
  const restore = withFetch(async (url) => {
    assert.equal(url, 'https://api.example.test/api/data/members?limit=25&after=');
    return new Response(JSON.stringify({ data: [{ id:'m-1', name:'Member One' }] }), { status: 200 });
  });
  try {
    const api = createCloudflareClient({ baseUrl:'https://api.example.test', getToken:async()=> 'token' });
    assert.deepEqual(await api.list('members', { limit:25 }), [{ id:'m-1', name:'Member One' }]);
  } finally { restore(); }
});

test('relational get reads a single gym-scoped record', async () => {
  const restore = withFetch(async (url) => {
    assert.equal(url, 'https://api.example.test/api/data/members/m-1');
    return new Response(JSON.stringify({ data: { id:'m-1', name:'Member One' } }), { status: 200 });
  });
  try {
    const api = createCloudflareClient({ baseUrl:'https://api.example.test', getToken:async()=> 'token' });
    assert.deepEqual(await api.get('members','m-1'), { id:'m-1', name:'Member One' });
  } finally { restore(); }
});
