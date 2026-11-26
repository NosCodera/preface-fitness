/*
 * Preface Fitness Cloudflare API client (Phase 4 foundation).
 * This module is intentionally NOT wired into the app yet.
 * Cloudflare Worker API client.
 */
const DEFAULT_TIMEOUT_MS = 15000;

export class CloudflareApiError extends Error {
  constructor(message, status = 0, payload = null) {
    super(message);
    this.name = 'CloudflareApiError';
    this.status = status;
    this.payload = payload;
  }
}

export function createCloudflareClient({ baseUrl, getToken, gymId, timeoutMs = DEFAULT_TIMEOUT_MS }) {
  const root = String(baseUrl || '').trim().replace(/\/+$/, '');
  if (!root) throw new Error('Cloudflare API base URL is required.');
  if (typeof getToken !== 'function') throw new Error('getToken must be a function.');

  async function request(path, { method = 'GET', body, headers = {}, signal } = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const token = await getToken();
    const merged = {
      accept: 'application/json',
      ...(body === undefined ? {} : { 'content-type': 'application/json' }),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(gymId ? { 'x-gym-id': String(gymId) } : {}),
      ...headers,
    };
    try {
      const response = await fetch(`${root}${path}`, {
        method,
        headers: merged,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: signal || controller.signal,
      });
      const text = await response.text();
      let payload = null;
      try { payload = text ? JSON.parse(text) : null; } catch { payload = { raw: text }; }
      if (!response.ok) {
        throw new CloudflareApiError(payload?.error || payload?.message || `API request failed (${response.status})`, response.status, payload);
      }
      return payload;
    } catch (error) {
      if (error?.name === 'AbortError') throw new CloudflareApiError('Request timed out. Please retry.', 408);
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  return {
    health: () => request('/health'),
    login: (email, password, targetGymId) => request('/api/auth/login', { method: 'POST', body: { email, password, gymId: targetGymId || gymId } }),
    logout: () => request('/api/auth/logout', { method: 'POST', body: {} }),
    me: () => request('/api/auth/me'),
    requestGymCurrent: async () => (await request('/api/gym/current')).data,
    publicGymProfile: (gymId) => request(`/api/public/gym-profile?gymId=${encodeURIComponent(gymId)}`),
    publicCheckIn: (args) => request('/api/public/check-in', { method:'POST', body:{ gymId:args.p_gym_id, memberNumber:args.p_member_number, latitude:args.p_lat, longitude:args.p_lng, gymLatitude:args.p_gym_lat, gymLongitude:args.p_gym_lng } }),
    publicSubmitFeedback: (args) => request('/api/public/feedback', { method:'POST', body:{ gymId:args.p_gym_id, memberName:args.p_member_name, category:args.p_category, priority:args.p_priority, feedback:args.p_feedback } }),
    updateAccount: ({ currentPassword, email, password }) => request('/api/auth/account', { method: 'PATCH', body: { currentPassword, ...(email === undefined ? {} : { email }), ...(password ? { password } : {}) } }),
    changes: ({ after = 0, limit = 100 } = {}) => request(`/api/changes?after=${encodeURIComponent(after)}&limit=${encodeURIComponent(limit)}`),
    rpc: (name, args = {}) => request('/api/rpc', { method: 'POST', body: { name, args } }),
    list: async (table, { limit = 100, after = '' } = {}) => {
      const safeLimit = Math.min(500, Math.max(1, Number(limit) || 100));
      // Member rows may contain base64 photos. Fetch them in small independent
      // D1/HTTP pages so no single D1 result or Worker response becomes enormous.
      const pageSize = table === 'members' ? 10 : safeLimit;
      let offset = Math.max(0, Number(after) || 0);
      const rows = [];
      while (rows.length < safeLimit) {
        const take = Math.min(pageSize, safeLimit - rows.length);
        const payload = await request(
          `/api/data/${encodeURIComponent(table)}?limit=${encodeURIComponent(take)}&after=${encodeURIComponent(offset)}`
        );
        const page = Array.isArray(payload?.data) ? payload.data : [];
        rows.push(...page);
        offset += page.length;
        if (page.length < take) break;
      }
      return rows;
    },
    get: async (table, id) => (await request(`/api/data/${encodeURIComponent(table)}/${encodeURIComponent(id)}`)).data,
    upsert: (table, rows) => request(`/api/data/${encodeURIComponent(table)}`, { method: 'POST', body: rows }),
    remove: (table, id) => request(`/api/data/${encodeURIComponent(table)}/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  };
}
