/**
 * Client submit: single in-flight request, success only on a real 2xx,
 * conversion only after success.
 *
 * Invariants E/H/L:
 *  - one click = one request (femkeriteslec: no guard → 2 e-mails + 2 CRM leads);
 *  - a failed request is never shown as success (femkeriteslec: `.catch(()=>{})`
 *    and the "we e-mailed you" screen shown before the fetch);
 *  - the conversion push happens after server acceptance, with an event_id
 *    that stays stable across retries (olcsokontenerhaz pushed before the
 *    Turnstile check: 2 conversions, 1 lead).
 */

export interface SubmitOutcome<T = unknown> {
  ok: boolean;
  status: number;
  data?: T;
  /** User-facing message when !ok. */
  error?: string;
  skipped?: 'in-flight';
}

export interface SubmitGuardOptions {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  /** Message shown on network error / non-2xx without a server message. */
  fallbackError: string;
}

export function createEventId(): string {
  const c = (globalThis as { crypto?: Crypto }).crypto;
  if (c?.randomUUID) return c.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createSubmitGuard(opts: SubmitGuardOptions) {
  let inFlight = false;
  let eventId: string | null = null;

  /** Stable across retries of the same submission; call reset() for a new quote. */
  function currentEventId(): string {
    if (!eventId) eventId = createEventId();
    return eventId;
  }

  async function submit<T>(url: string, body: Record<string, unknown>, onSuccess?: (data: T, eventId: string) => void): Promise<SubmitOutcome<T>> {
    if (inFlight) return { ok: false, status: 0, skipped: 'in-flight' };
    inFlight = true;
    const id = currentEventId();
    const f = opts.fetchImpl ?? fetch;
    const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = ctrl ? setTimeout(() => ctrl.abort(), opts.timeoutMs ?? 15000) : null;
    try {
      const res = await f(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, event_id: id }),
        signal: ctrl?.signal,
      });
      let data: unknown;
      try {
        data = await res.json();
      } catch {
        data = undefined;
      }
      const serverOk = res.ok && !(data && typeof data === 'object' && (data as { success?: unknown }).success === false);
      if (!serverOk) {
        const msg = data && typeof data === 'object' ? (data as { error?: unknown }).error : undefined;
        return { ok: false, status: res.status, data: data as T, error: typeof msg === 'string' && msg ? msg : opts.fallbackError };
      }
      onSuccess?.(data as T, id);
      return { ok: true, status: res.status, data: data as T };
    } catch {
      return { ok: false, status: 0, error: opts.fallbackError };
    } finally {
      if (timer) clearTimeout(timer);
      inFlight = false;
    }
  }

  return {
    submit,
    currentEventId,
    reset() { eventId = null; },
    get inFlight() { return inFlight; },
  };
}
