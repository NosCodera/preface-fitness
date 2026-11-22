// Cloudflare Worker is the only backend configured for this application.
// The existing data layer imports this compatibility object; it is backed only by the Cloudflare Worker.
import { backendClient } from './cloudflare/compatClient.js';
export { backendClient };
