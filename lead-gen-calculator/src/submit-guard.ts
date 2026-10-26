/**
 * Client submit: single in-flight request, success only on an EXPLICIT server
 * acceptance, conversion only after acceptance.
 *
 * Invariants E/H/L:
 *  - one click = one request (femkeriteslec: no guard → 2 e-mails + 2 CRM leads);
 *  - a failed request is never shown as success (femkeriteslec: `.catch(()=>{})`
 *    and the "we e-mailed you" screen shown before the fetch);
 *  - 2xx ≠ business success: a 200 with `success:false` / `ok:false`, or a
 *    202 / `deferred` / `pending` answer, is NOT an accepted lead
 *    (painlessremovals answered `202 {success:true, deferred:true}`);
 *  - the conversion push happens after server acceptance, with an event_id
 *    that stays stable across retries (olcsokontenerhaz pushed before the
 *    Turnstile check: 2 conversions, 1 lead);
 *  - an accepted lead stays accepted: a throwing / rejecting `onSuccess`
 *    (tracking, UI) is isolated into `callbackError`, never turned into a
 *    "network error" that invites a resubmit.
 *
 * Four states the UI must keep apart:
 *  1. request in flight             → `inFlight` / `skipped: 'in-flight'`;
 *  2. lead durably accepted         → `state: 'accepted'` (server: `leadAccepted`
 *                                     — a durable sink such as CRM/DB/Sheets took it);
 *  3. customer e-mail sent          → site-specific field in `data` (e.g.
 *                                     `emailDelivered`); never implied by 1 or 2;
 *  4. background delivery queued    → `state: 'pending'` — not success, not failure.
 */

export type SubmitState = 'accepted' | 'pending' | 'rejected' | 'network-error' | 'skipped';

/** Verdict on a server answer. `true`/`false` are shorthands for accepted/rejected. */
export type AcceptVerdict = 'accepted' | 'pending' | 'rejected' | boolean;

export interface SubmitOutcome<T = unknown> {
  /** true only for `state: 'accepted'`. */
  ok: boolean;
  state: SubmitState;
  status: number;
  data?: T;
  /** User-facing message for `rejected` / `network-error`. */
  error?: string;
  skipped?: 'in-flight';
  /** The lead WAS accepted but `onSuccess` threw / rejected (tracking, UI). */
  callbackError?: unknown;
}

export interface SubmitGuardOptions {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  /** Message shown on network error / rejection without a server message. */
  fallbackError: string;
  /**
   * Business acceptance rule. Only consulted for a 2xx — a non-2xx is always
   * rejected. Default: `defaultIsAccepted`.
   */
  isAccepted?: (res: Response, data: unknown) => AcceptVerdict;
}

const PENDING_STATUS = new Set(['pending', 'deferred', 'queued', 'processing']);

/**
 * Default acceptance rule (2xx ≠ business success):
 *  - pending: HTTP 202, `pending: true`, `deferred: true`, or
 *    `status` ∈ pending/deferred/queued/processing — even with `success: true`;
 *  - rejected: `success: false`, `ok: false`, `leadAccepted: false`, or no
 *    explicit positive flag (empty / non-JSON 2xx body);
 *  - accepted: `leadAccepted: true`, `success: true`, `ok: true` or `accepted: true`.
 */
export function defaultIsAccepted(res: Response, data: unknown): AcceptVerdict {
  const d = data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
  if (d.success === false || d.ok === false || d.leadAccepted === false || d.accepted === false) return 'rejected';
  if (res.status === 202 || d.pending === true || d.deferred === true) return 'pending';
  if (typeof d.status === 'string' && PENDING_STATUS.has(d.status.toLowerCase())) return 'pending';
  if (d.leadAccepted === true || d.success === true || d.ok === true || d.accepted === true) return 'accepted';
  return 'rejected';
}

function normalise(v: AcceptVerdict): 'accepted' | 'pending' | 'rejected' {
  if (v === true) return 'accepted';
  if (v === 'accepted' || v === 'pending') return v;
  return 'rejected';
}

export function createEventId(): string {
  const c = (globalThis as { crypto?: Crypto }).crypto;
  if (c?.randomUUID) return c.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createSubmitGuard(opts: SubmitGuardOptions) {
  let inFlight = false;
  let eventId: string | null = null;
  const isAccepted = opts.isAccepted ?? defaultIsAccepted;

  /** Stable across retries of the same submission; call reset() for a new quote. */
  function currentEventId(): string {
    if (!eventId) eventId = createEventId();
    return eventId;
  }

  /**
   * `onSuccess` runs only for `state: 'accepted'` (push the conversion there).
   * It may be async; its error is returned as `callbackError` and never changes
   * the outcome.
   */
  async function submit<T>(
    url: string,
    body: Record<string, unknown>,
    onSuccess?: (data: T, eventId: string) => unknown,
  ): Promise<SubmitOutcome<T>> {
    if (inFlight) return { ok: false, state: 'skipped', status: 0, skipped: 'in-flight' };
    inFlight = true;
    try {
      const id = currentEventId();
      const outcome = await request<T>(url, body, id);
      if (outcome.state === 'accepted' && onSuccess) {
        try {
          await onSuccess(outcome.data as T, id);
        } catch (err) {
          outcome.callbackError = err;
        }
      }
      return outcome;
    } finally {
      inFlight = false;
    }
  }

  async function request<T>(url: string, body: Record<string, unknown>, id: string): Promise<SubmitOutcome<T>> {
    const f = opts.fetchImpl ?? fetch;
    const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = ctrl ? setTimeout(() => ctrl.abort(), opts.timeoutMs ?? 15000) : null;
    let res: Response;
    let data: unknown;
    try {
      res = await f(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, event_id: id }),
        signal: ctrl?.signal,
      });
      try {
        data = await res.json();
      } catch {
        data = undefined;
      }
    } catch {
      return { ok: false, state: 'network-error', status: 0, error: opts.fallbackError };
    } finally {
      if (timer) clearTimeout(timer);
    }

    let verdict: 'accepted' | 'pending' | 'rejected' = 'rejected';
    if (res.ok) {
      try {
        verdict = normalise(isAccepted(res, data));
      } catch {
        verdict = 'rejected';
      }
    }
    if (verdict === 'accepted') return { ok: true, state: 'accepted', status: res.status, data: data as T };
    if (verdict === 'pending') return { ok: false, state: 'pending', status: res.status, data: data as T };
    const msg = data && typeof data === 'object' ? (data as { error?: unknown }).error : undefined;
    return { ok: false, state: 'rejected', status: res.status, data: data as T, error: typeof msg === 'string' && msg ? msg : opts.fallbackError };
  }

  return {
    submit,
    currentEventId,
    reset() { eventId = null; },
    get inFlight() { return inFlight; },
  };
}
