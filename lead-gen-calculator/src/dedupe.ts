/**
 * Server-side duplicate suppression: CHECK before delivery, MARK after success.
 *
 * Invariant K/A: a dedupe key written before delivery turns a transient
 * delivery failure into a permanent lead loss — the user's retry is answered
 * with "already sent" (lomtalan.hu: 60 s key written before Resend/Brevo).
 * The key is the client event_id (stable per submission attempt-set), so a
 * retry after a lost response is deduped but a genuinely new quote is not.
 */

export interface KvLike {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, opts?: { expirationTtl?: number }): Promise<void>;
}

export type DeliveryResult = { ok: true } | { ok: false; error: string };

export interface DedupedOutcome {
  status: 'delivered' | 'duplicate' | 'failed';
  error?: string;
}

export async function deliverOnce(
  kv: KvLike | null | undefined,
  key: string,
  deliver: () => Promise<DeliveryResult>,
  ttlSeconds = 3600,
): Promise<DedupedOutcome> {
  const k = `dedupe:${key}`;
  if (kv) {
    try {
      if (await kv.get(k)) return { status: 'duplicate' };
    } catch {
      /* KV down: prefer a possible duplicate over a lost lead */
    }
  }
  const res = await deliver();
  if (!res.ok) return { status: 'failed', error: res.error };
  if (kv) {
    try {
      await kv.put(k, '1', { expirationTtl: ttlSeconds });
    } catch {
      /* best effort */
    }
  }
  return { status: 'delivered' };
}

/**
 * A lead is accepted when at least one DURABLE sink took it (CRM, Sheets, DB).
 * Notification e-mail failure alone must not turn a stored lead into a user-visible error.
 */
export function leadAccepted(sinks: Record<string, boolean>, durable: string[]): boolean {
  return durable.some((s) => sinks[s] === true);
}
