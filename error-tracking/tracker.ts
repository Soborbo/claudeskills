// src/lib/errors/tracker.ts
// KLIENS-OLDALI error tracker — NINCS codes.ts import, ~4KB a bundle-ben
//
// A severity/retryable/userImpact feloldást a SZERVER végzi
// (error-report.ts endpoint + tracker-server.ts).

import { sanitizeContext } from './sanitize';
import type { ErrorContext, ErrorReport } from './types';

// ============================================================
// CONFIG STORE
// ============================================================
// FIX: A CatcherConfig-ból érkező értékeket tároljuk modul szinten,
// hogy trackError() használni tudja. Előző bug: initGlobalCatcher()
// megkapta a config-ot de sehol nem mentette el, trackError() pedig
// kizárólag import.meta.env-ből próbált olvasni.

interface TrackerConfig {
  endpoint: string;
  siteId: string;
  deployId: string;
}

const _config: TrackerConfig = {
  endpoint: '/api/error-report',
  siteId: '',
  deployId: '',
};

/**
 * Hívd az initGlobalCatcher()-ből — beállítja a modul szintű config-ot.
 * Ha nem hívod, az import.meta.env-ből próbál olvasni (fallback).
 */
export function configureTracker(config: Partial<TrackerConfig>): void {
  if (config.endpoint) _config.endpoint = config.endpoint;
  if (config.siteId) _config.siteId = config.siteId;
  if (config.deployId) _config.deployId = config.deployId;
}

function getSiteId(): string {
  return _config.siteId
    || (typeof import.meta !== 'undefined' && import.meta.env?.PUBLIC_SITE_ID)
    || 'unknown';
}

function getDeployId(): string {
  return _config.deployId
    || (typeof import.meta !== 'undefined' && import.meta.env?.PUBLIC_DEPLOY_ID)
    || '';
}

// ============================================================
// SESSION + REQUEST ID
// ============================================================

function getSessionId(): string {
  if (typeof sessionStorage === 'undefined') return 'no-session';
  try {
    let id = sessionStorage.getItem('_err_sid');
    if (!id) {
      id = generateId();
      sessionStorage.setItem('_err_sid', id);
    }
    return id;
  } catch {
    return 'ss-error';
  }
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID().slice(0, 12);
  }
  return Math.random().toString(36).slice(2, 14);
}

// ============================================================
// JOURNEY ID
// ============================================================

let _journeyId = '';
export function setJourneyId(id: string): void { _journeyId = id; }
export function clearJourneyId(): void { _journeyId = ''; }

// ============================================================
// DEDUP
// ============================================================

const recentFingerprints = new Map<string, number>();
const DEDUPE_WINDOW_MS = 60_000;
let sessionReportCount = 0;
const MAX_REPORTS_PER_SESSION = 50;

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

function makeFingerprint(code: string, message: string, source: string): string {
  return `${code}:${source}:${simpleHash(message)}`;
}

function shouldReport(fingerprint: string): boolean {
  if (sessionReportCount >= MAX_REPORTS_PER_SESSION) return false;
  const lastSent = recentFingerprints.get(fingerprint);
  if (lastSent && Date.now() - lastSent < DEDUPE_WINDOW_MS) return false;
  recentFingerprints.set(fingerprint, Date.now());
  sessionReportCount++;
  return true;
}

// ============================================================
// OFFLINE QUEUE — localStorage
// ============================================================

const QUEUE_KEY = '_err_queue';
const MAX_QUEUE = 20;
const QUEUE_MAX_AGE_MS = 86_400_000; // 24h

function readQueue(): ErrorReport[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const queue: ErrorReport[] = JSON.parse(raw);
    const now = Date.now();
    return queue.filter((r) => now - new Date(r.timestamp).getTime() < QUEUE_MAX_AGE_MS);
  } catch { return []; }
}

function writeQueue(queue: ErrorReport[]): void {
  if (typeof localStorage === 'undefined') return;
  try { localStorage.setItem(QUEUE_KEY, JSON.stringify(queue.slice(-MAX_QUEUE))); }
  catch { /* full */ }
}

function enqueue(report: ErrorReport): void {
  const q = readQueue(); q.push(report); writeQueue(q);
}

function flushQueue(): void {
  const q = readQueue();
  if (!q.length) return;
  writeQueue([]);
  for (const r of q) sendToEndpoint(r);
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', flushQueue);
  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => { if (navigator.onLine) flushQueue(); });
  }
}

// ============================================================
// SEND — Blob sendBeacon + fetch fallback
// ============================================================

function sendToEndpoint(report: ErrorReport): void {
  const endpoint = _config.endpoint;
  const payload = JSON.stringify(report);
  const blob = new Blob([payload], { type: 'application/json' });

  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    if (navigator.sendBeacon(endpoint, blob)) return;
  }

  if (typeof fetch !== 'undefined') {
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    }).catch(() => enqueue(report));
    return;
  }

  enqueue(report);
}

// ============================================================
// DEV CONSOLE
// ============================================================

function logToDev(code: string, message: string, error?: unknown, context?: ErrorContext): void {
  const s = 'background:#ea580c;color:white;padding:2px 6px;border-radius:3px;font-weight:bold';
  console.groupCollapsed(`%c${code}%c ${message}`, s, 'color:inherit');
  if (context && Object.keys(context).length > 0) console.table(context);
  if (error instanceof Error) console.error(error);
  console.groupEnd();
}

// ============================================================
// HELPERS
// ============================================================

function getConnection(): string {
  if (typeof navigator === 'undefined') return 'unknown';
  if (!navigator.onLine) return 'offline';
  const c = (navigator as any).connection;
  return c?.effectiveType || c?.type || 'unknown';
}

function getViewport(): string {
  if (typeof window === 'undefined') return '0x0';
  return `${window.innerWidth}x${window.innerHeight}`;
}

function detectEnv(): ErrorReport['env'] {
  if (typeof import.meta !== 'undefined') {
    if (import.meta.env?.DEV) return 'development';
    if (import.meta.env?.PUBLIC_CF_PAGES_BRANCH &&
        import.meta.env.PUBLIC_CF_PAGES_BRANCH !== 'main') return 'preview';
  }
  return 'production';
}

// ============================================================
// PUBLIC: trackError (kliens)
// ============================================================

/**
 * Track error kliens-oldalon.
 * NEM importálja codes.ts-t — 0 bundle cost a 290 kódra.
 * Severity/retryable/userImpact feloldás a SZERVEREN történik.
 */
export function trackError(
  code: string,
  error?: unknown,
  context?: ErrorContext,
  source?: string,
): void {
  const message = (error instanceof Error ? error.message : String(error || '')) || 'Unknown error';
  const resolvedSource = source
    || (error instanceof Error && error.stack ? error.stack.split('\n')[1]?.trim().slice(0, 100) : '')
    || 'unknown';

  // Dev: console only, nem küld sehova
  if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
    logToDev(code, message, error, context);
    return;
  }

  // Dedup
  const fingerprint = makeFingerprint(code, message, resolvedSource);
  if (!shouldReport(fingerprint)) return;

  const report: ErrorReport = {
    code,
    severity: 'ERROR',        // Placeholder — szerver feloldja codes.ts-ből
    message: message.substring(0, 500),
    stack: error instanceof Error ? (error.stack || '').split('\n').slice(0, 5).join('\n') : '',
    context: sanitizeContext(context || {}),
    url: typeof location !== 'undefined' ? location.href.substring(0, 500) : '',
    source: resolvedSource.substring(0, 200),
    sessionId: getSessionId(),
    requestId: `r_${generateId()}`,
    journeyId: _journeyId,
    deployId: getDeployId(),
    env: detectEnv(),
    siteId: getSiteId(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent.substring(0, 200) : '',
    viewport: getViewport(),
    connection: getConnection(),
    timestamp: new Date().toISOString(),
    pageLoadedAgo: typeof performance !== 'undefined' ? Math.round(performance.now()) : 0,
    retryable: false,          // Placeholder — szerver feloldja
    userImpact: 'degraded',    // Placeholder — szerver feloldja
    fingerprint,
  };

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    enqueue(report);
  } else {
    sendToEndpoint(report);
  }
}
