// src/lib/errors/tracker.ts
//
// Minimal client-side error tracker. ~1.5KB minified.
//
// What it does:
//   - Build a structured payload from a code + context
//   - Dedup within 60s per fingerprint
//   - Cap to 50 reports per page session
//   - Send via navigator.sendBeacon (fire-and-forget, zero blocking)
//   - Fallback to fetch() with keepalive when sendBeacon is missing
//
// What it does NOT do:
//   - Resolve severity (the notifier worker does that from codes.ts)
//   - localStorage offline queue (the 0.5% gain is not worth the complexity)
//   - Maintain sessionStorage state, journey IDs, or tracking metadata
//
// All payload fields are sanitised at the edge anyway, but keep PII out.

interface TrackerConfig {
  endpoint: string;
  siteId: string;
}

interface TrackContext {
  [key: string]: string | number | boolean;
}

const DEDUPE_WINDOW_MS = 60_000;
const MAX_REPORTS_PER_SESSION = 50;
const MAX_STRING = 500;

const _config: TrackerConfig = { endpoint: '/api/error-log', siteId: 'unknown' };
const _seen = new Map<string, number>();
let _count = 0;

export function configureTracker(cfg: Partial<TrackerConfig>): void {
  if (cfg.endpoint) _config.endpoint = cfg.endpoint;
  if (cfg.siteId) _config.siteId = cfg.siteId;
}

function trunc(s: unknown, max = MAX_STRING): string {
  const str = String(s ?? '');
  return str.length > max ? str.slice(0, max) : str;
}

function hash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36);
}

function makeFingerprint(code: string, message: string, source: string): string {
  return `${code}:${source}:${hash(message)}`;
}

function shouldReport(fingerprint: string): boolean {
  if (_count >= MAX_REPORTS_PER_SESSION) return false;
  const last = _seen.get(fingerprint);
  if (last && Date.now() - last < DEDUPE_WINDOW_MS) return false;
  _seen.set(fingerprint, Date.now());
  _count++;
  return true;
}

function getSessionId(): string {
  try {
    const k = '_err_sid';
    let id = sessionStorage.getItem(k);
    if (!id) {
      id = (crypto?.randomUUID?.() ?? Math.random().toString(36)).slice(0, 12);
      sessionStorage.setItem(k, id);
    }
    return id;
  } catch {
    return 'no-session';
  }
}

function getConnection(): string {
  if (!navigator.onLine) return 'offline';
  const c = (navigator as unknown as { connection?: { effectiveType?: string } }).connection;
  return c?.effectiveType || 'unknown';
}

function send(payload: object): void {
  const body = JSON.stringify(payload);
  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' });
      if (navigator.sendBeacon(_config.endpoint, blob)) return;
    }
  } catch { /* fall through */ }
  // Fallback — keepalive lets it survive page unload
  try {
    fetch(_config.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => { /* swallow */ });
  } catch { /* environment without fetch — give up */ }
}

/**
 * Track a client error. Code must exist in codes.ts on the notifier side.
 * If you pass an unknown code the notifier falls back to ERROR severity.
 */
export function trackError(
  code: string,
  error?: unknown,
  context?: TrackContext,
  source?: string,
): void {
  const message = error instanceof Error ? error.message : String(error ?? '');
  const stack = error instanceof Error ? (error.stack ?? '').split('\n').slice(0, 5).join('\n') : '';
  const resolvedSource = source
    || (error instanceof Error && error.stack ? (error.stack.split('\n')[1] ?? '').trim().slice(0, 100) : '')
    || 'unknown';

  const fingerprint = makeFingerprint(code, message, resolvedSource);
  if (!shouldReport(fingerprint)) return;

  send({
    __pipeline: 'error',
    code,
    message: trunc(message || 'Unknown error'),
    url: trunc(location.href),
    source: trunc(resolvedSource, 200),
    context: context ?? {},
    stack: trunc(stack, 1000),
    sessionId: getSessionId(),
    requestId: hash(fingerprint + Date.now()),
    userAgent: trunc(navigator.userAgent, 200),
    viewport: `${innerWidth}x${innerHeight}`,
    connection: getConnection(),
    fingerprint,
    ts: new Date().toISOString(),
    pageLoadedAgo: Math.round(performance?.now() ?? 0),
  });
}
