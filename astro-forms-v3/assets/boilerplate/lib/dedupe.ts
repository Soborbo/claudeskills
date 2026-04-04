/**
 * Duplicate Submission Detection
 * Uses Cloudflare KV to detect repeat submissions within a time window.
 * Prevents: double-click, browser retry, bot replay.
 */

const DEDUPE_WINDOW_SECONDS = 60;

/**
 * Check if this submission is a duplicate.
 * Fingerprint = hash of email + formId.
 * Returns true if duplicate detected (should silently accept but not process).
 */
export async function isDuplicate(
  kv: KVNamespace,
  email: string,
  formId: string
): Promise<boolean> {
  const fingerprint = await hashFingerprint(`${email}:${formId}`);
  const key = `dedup:${fingerprint}`;

  try {
    const existing = await kv.get(key);
    if (existing) {
      return true; // Duplicate within window
    }

    // Mark this submission
    await kv.put(key, '1', { expirationTtl: DEDUPE_WINDOW_SECONDS });
    return false;
  } catch (error) {
    // On KV error, allow submission (don't lose leads over dedup failure)
    console.error('Dedupe check failed:', error);
    return false;
  }
}

/**
 * Hash the fingerprint string using SHA-256.
 * We hash to avoid storing raw email in KV keys.
 */
async function hashFingerprint(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
