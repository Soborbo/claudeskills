/**
 * Deduplication — prevents same email+formId within 60s
 * Uses KV with TTL
 */

async function sha256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function isDuplicate(
  kv: KVNamespace,
  email: string,
  formId: string,
  windowSeconds = 60,
): Promise<boolean> {
  const fingerprint = await sha256(`${email.toLowerCase()}:${formId}`);
  const key = `dedup:${fingerprint}`;

  const existing = await kv.get(key);
  if (existing) return true;

  await kv.put(key, '1', { expirationTtl: windowSeconds });
  return false;
}
