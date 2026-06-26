/**
 * Observability — STABLE diagnostic codes.
 *
 * Tracking fails silently and expensively: a broken dispatch or a leaked PII key
 * is invisible until conversions quietly drop days later. So every notable
 * condition is reported with a stable code, three ways:
 *   1. console (error/warn always; info only in diag-debug) — visible in the browser
 *   2. a ring buffer at `window.__sbTrackingDiag` (last 50) — scrape it from a probe
 *   3. a DOM CustomEvent `sb-tracking-diagnostic` — forward to your error pipeline
 *      (e.g. the `error-pipeline` skill → Tail Worker → throttled email)
 *
 * If a future change breaks a leg, the matching code fires and you SEE it.
 */

export type DiagSeverity = 'info' | 'warn' | 'error';

interface CodeDef { code: string; severity: DiagSeverity; message: string }

export const TRACKING_CODES = {
  // 1xxx — gateway / worker connection
  GATEWAY_OK:              { code: 'TRK-1000', severity: 'info',  message: 'Gateway dispatch sent' },
  GATEWAY_NO_TURNSTILE:    { code: 'TRK-1001', severity: 'warn',  message: 'Gateway dispatch skipped: no Turnstile token' },
  GATEWAY_NETWORK_FAIL:    { code: 'TRK-1002', severity: 'error', message: 'Gateway POST failed (network/transport)' },
  GATEWAY_BEACON_FALLBACK: { code: 'TRK-1003', severity: 'info',  message: 'sendBeacon unavailable/failed; used fetch keepalive' },
  // 2xxx — Turnstile
  TURNSTILE_NOT_LOADED:    { code: 'TRK-2001', severity: 'warn',  message: 'Turnstile script not loaded' },
  TURNSTILE_NO_CONTAINER:  { code: 'TRK-2002', severity: 'warn',  message: 'Turnstile container #cf-turnstile-invisible missing' },
  TURNSTILE_TIMEOUT:       { code: 'TRK-2003', severity: 'warn',  message: 'Turnstile challenge timed out' },
  TURNSTILE_NO_SITEKEY:    { code: 'TRK-2004', severity: 'error', message: 'PUBLIC_TURNSTILE_SITE_KEY is empty — server-side dispatch will be skipped' },
  // 3xxx — data integrity
  PII_IN_DATALAYER:        { code: 'TRK-3001', severity: 'error', message: 'PII-shaped key blocked from a dataLayer push' },
} as const satisfies Record<string, CodeDef>;

export type TrackingCodeKey = keyof typeof TRACKING_CODES;
export type TrackingCode = (typeof TRACKING_CODES)[TrackingCodeKey]['code'];

export interface TrackingDiagnostic {
  code: TrackingCode;
  severity: DiagSeverity;
  message: string;
  context?: Record<string, unknown>;
  ts: number;
}

const RING_MAX = 50;
const DIAG_EVENT = 'sb-tracking-diagnostic';
let diagDebug = false;

/** Turn on info-level console output for diagnostics (enabled by ?debugTracking=1). */
export function enableDiagDebug(): void { diagDebug = true; }

function ring(): TrackingDiagnostic[] {
  const w = window as unknown as { __sbTrackingDiag?: TrackingDiagnostic[] };
  if (!w.__sbTrackingDiag) w.__sbTrackingDiag = [];
  return w.__sbTrackingDiag;
}

/** Emit a coded diagnostic. Returns the record (handy in tests). */
export function report(key: TrackingCodeKey, context?: Record<string, unknown>): TrackingDiagnostic {
  const def = TRACKING_CODES[key];
  const diag: TrackingDiagnostic = {
    code: def.code, severity: def.severity, message: def.message, context,
    ts: typeof Date !== 'undefined' ? Date.now() : 0,
  };

  // 1) console — errors/warnings always; info only under diag-debug.
  const line = `[tracking] ${def.code} ${def.message}`;
  if (def.severity === 'error') console.error(line, context ?? '');
  else if (def.severity === 'warn') console.warn(line, context ?? '');
  else if (diagDebug) console.log(line, context ?? '');

  if (typeof window !== 'undefined') {
    // 2) ring buffer (bounded)
    const buf = ring();
    buf.push(diag);
    if (buf.length > RING_MAX) buf.splice(0, buf.length - RING_MAX);
    // 3) CustomEvent for the site's error pipeline — only for real problems
    //    (info is throughput heartbeat; don't spam the pipeline with it).
    if (def.severity !== 'info') {
      try { window.dispatchEvent(new CustomEvent(DIAG_EVENT, { detail: diag })); } catch { /* */ }
    }
  }
  return diag;
}

/** Read the recent diagnostics ring (newest last). */
export function getDiagnostics(): TrackingDiagnostic[] {
  return typeof window !== 'undefined' ? [...ring()] : [];
}

/** Clear the diagnostics ring. */
export function clearDiagnostics(): void {
  if (typeof window !== 'undefined') (window as unknown as { __sbTrackingDiag?: TrackingDiagnostic[] }).__sbTrackingDiag = [];
}

// ── PII guard (data integrity) ──────────────────────────────────────
// Name-based guard: PII must never reach the dataLayer (it goes to the hidden
// side-channel instead). This is the defense-in-depth net behind events.ts —
// if a future change pushes a PII-shaped key, it's stripped AND reported (TRK-3001).
export const PII_DATALAYER_KEYS: ReadonlySet<string> = new Set([
  'email', 'phone', 'phone_number', 'user_provided_data', 'user_data',
  'first_name', 'last_name', 'name', 'street', 'city', 'postal_code', 'postcode',
  // Meta Advanced Matching short codes
  'em', 'ph', 'fn', 'ln',
]);

/** Delete any PII-shaped keys from `data` IN PLACE; return the names removed. */
export function redactPii(data: Record<string, unknown>): string[] {
  const leaked = Object.keys(data).filter((k) => PII_DATALAYER_KEYS.has(k));
  for (const k of leaked) delete data[k];
  return leaked;
}
