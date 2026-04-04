/**
 * Client-side error catcher
 * Catches window.onerror, unhandledrejection, img errors
 * Offline queue with localStorage persistence
 */

import type { ErrorReport, CatcherConfig } from './types';
import { sanitizeContext } from './sanitize';

const DEFAULT_CONFIG: CatcherConfig = {
  endpoint: '/api/error-report',
  maxReportsPerSession: 50,
  dedupeWindowMs: 60000,
  offlineQueueMax: 20,
};

let reportCount = 0;
const recentFingerprints = new Map<string, number>();
const QUEUE_KEY = 'error-queue';

function fingerprint(code: string, source: string, message: string): string {
  return `${code}:${source}:${message.slice(0, 50)}`;
}

function isDuplicate(fp: string, windowMs: number): boolean {
  const last = recentFingerprints.get(fp);
  if (last && Date.now() - last < windowMs) return true;
  recentFingerprints.set(fp, Date.now());
  return false;
}

function sendReport(report: ErrorReport, config: CatcherConfig): void {
  if (navigator.onLine) {
    fetch(config.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report),
      keepalive: true,
    }).catch(() => queueOffline(report, config));
  } else {
    queueOffline(report, config);
  }
}

function queueOffline(report: ErrorReport, config: CatcherConfig): void {
  try {
    const queue: ErrorReport[] = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
    if (queue.length < (config.offlineQueueMax || 20)) {
      queue.push(report);
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    }
  } catch {}
}

function flushQueue(config: CatcherConfig): void {
  try {
    const queue: ErrorReport[] = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
    if (queue.length === 0) return;
    localStorage.removeItem(QUEUE_KEY);

    // Filter out reports older than 24h
    const cutoff = Date.now() - 86400000;
    const valid = queue.filter(r => new Date(r.timestamp).getTime() > cutoff);

    for (const report of valid) {
      sendReport(report, config);
    }
  } catch {}
}

export function initClientCatcher(userConfig?: Partial<CatcherConfig>): void {
  const config = { ...DEFAULT_CONFIG, ...userConfig };

  // Flush offline queue on load
  if (navigator.onLine) flushQueue(config);
  window.addEventListener('online', () => flushQueue(config));

  // Global error handler
  window.onerror = (message, source, lineno, colno, error) => {
    if (reportCount >= (config.maxReportsPerSession || 50)) return;

    const report: ErrorReport = {
      code: 'JS-RUNTIME-001',
      message: String(message),
      severity: 'medium',
      source: `${source}:${lineno}:${colno}`,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      stack: error?.stack,
      userAgent: navigator.userAgent,
    };

    const fp = fingerprint(report.code, report.source, report.message);
    if (isDuplicate(fp, config.dedupeWindowMs || 60000)) return;

    reportCount++;
    sendReport(report, config);
  };

  // Unhandled promise rejection
  window.addEventListener('unhandledrejection', (event) => {
    if (reportCount >= (config.maxReportsPerSession || 50)) return;

    const report: ErrorReport = {
      code: 'JS-PROMISE-001',
      message: String(event.reason),
      severity: 'medium',
      source: 'promise',
      url: window.location.href,
      timestamp: new Date().toISOString(),
      stack: event.reason?.stack,
      userAgent: navigator.userAgent,
    };

    const fp = fingerprint(report.code, report.source, report.message);
    if (isDuplicate(fp, config.dedupeWindowMs || 60000)) return;

    reportCount++;
    sendReport(report, config);
  });

  // Image load errors
  document.addEventListener('error', (event) => {
    const target = event.target as HTMLElement;
    if (target.tagName !== 'IMG') return;
    if (reportCount >= (config.maxReportsPerSession || 50)) return;

    const src = (target as HTMLImageElement).src;
    const report: ErrorReport = {
      code: 'IMG-LOAD-001',
      message: `Image failed to load: ${src}`,
      severity: 'low',
      source: src,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    };

    const fp = fingerprint(report.code, report.source, report.message);
    if (isDuplicate(fp, config.dedupeWindowMs || 60000)) return;

    reportCount++;
    sendReport(report, config);
  }, true);
}
