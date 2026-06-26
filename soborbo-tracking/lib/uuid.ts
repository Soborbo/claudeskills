/**
 * UUID v4 generation using the native Web Crypto API.
 * Requires HTTPS or localhost (secure context). Throws otherwise — we don't
 * fall back to Math.random because the event_id doubles as the dedup key
 * across Meta CAPI, GA4 MP, and Google Ads orderId, where collisions cause
 * silent dedup failures and ROAS distortion.
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  throw new Error(
    'Cannot generate UUID: secure context (HTTPS) required. Math.random fallback removed because event_id is a dedup key.'
  );
}
