/**
 * `crypto.randomUUID()` requires a secure context. On `localhost` and
 * production HTTPS this is fine; some preview / staging deploys served
 * from plain HTTP would crash. Fall back to a CSPRNG-backed v4
 * (`crypto.getRandomValues`), then to `Math.random` only as a last
 * resort.
 *
 * Why CSPRNG matters even for an "id": `event_id` is the dedup key Meta
 * uses to pair browser Pixel + server CAPI hits. A guessable id lets an
 * attacker pre-send a fake CAPI event and have Meta drop the legitimate
 * browser event as a "duplicate" — attribution theft. Math.random is
 * trivially predictable; getRandomValues is not.
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch {
      // fall through
    }
  }
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    try {
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      bytes[6] = (bytes[6] & 0x0f) | 0x40;
      bytes[8] = (bytes[8] & 0x3f) | 0x80;
      const hex: string[] = [];
      for (let i = 0; i < 16; i++) hex.push(bytes[i].toString(16).padStart(2, '0'));
      return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10, 16).join('')}`;
    } catch {
      // fall through
    }
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}
