/**
 * Web Vitals monitoring
 * Only reports when metrics exceed poor thresholds
 */

import type { ErrorReport } from './types';

const THRESHOLDS = {
  LCP: 2500,
  CLS: 0.1,
  INP: 200,
  TTFB: 800,
};

export function initWebVitals(endpoint = '/api/error-report'): void {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

  // LCP
  try {
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1] as PerformanceEntry & { startTime: number };
      if (last.startTime > THRESHOLDS.LCP) {
        report('PERF-LCP-001', `LCP: ${Math.round(last.startTime)}ms`, endpoint);
      }
      lcpObserver.disconnect();
    });
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch {}

  // CLS
  try {
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as Array<PerformanceEntry & { value: number; hadRecentInput: boolean }>) {
        if (!entry.hadRecentInput) clsValue += entry.value;
      }
    });
    clsObserver.observe({ type: 'layout-shift', buffered: true });

    // Report on visibilitychange
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden' && clsValue > THRESHOLDS.CLS) {
        report('PERF-CLS-001', `CLS: ${clsValue.toFixed(3)}`, endpoint);
        clsObserver.disconnect();
      }
    });
  } catch {}

  // INP
  try {
    let maxINP = 0;
    const inpObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as Array<PerformanceEntry & { duration: number }>) {
        if (entry.duration > maxINP) maxINP = entry.duration;
      }
    });
    inpObserver.observe({ type: 'event', buffered: true });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden' && maxINP > THRESHOLDS.INP) {
        report('PERF-INP-001', `INP: ${Math.round(maxINP)}ms`, endpoint);
        inpObserver.disconnect();
      }
    });
  } catch {}
}

function report(code: string, message: string, endpoint: string): void {
  const payload: ErrorReport = {
    code,
    message,
    severity: 'medium',
    source: 'web-vitals',
    url: window.location.href,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
  };

  if (navigator.sendBeacon) {
    navigator.sendBeacon(endpoint, JSON.stringify(payload));
  }
}
