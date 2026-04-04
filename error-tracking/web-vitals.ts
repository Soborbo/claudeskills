// src/lib/errors/web-vitals.ts
// Core Web Vitals mérés — natív PerformanceObserver, 0 dependency
// Csak akkor küld reportot, ha a threshold BUKIK.
// Ha minden jó → csend. Install and forget.

import { trackError } from './tracker';

/** Thresholds — Google "good" határértékek */
const THRESHOLDS = {
  LCP:  2500,   // ms — Largest Contentful Paint
  CLS:  0.1,    // score — Cumulative Layout Shift
  INP:  200,    // ms — Interaction to Next Paint
  TTFB: 800,    // ms — Time to First Byte
} as const;

let lcpReported = false;
let clsReported = false;
let inpReported = false;

/**
 * Inicializáld a layout-ban, az initGlobalCatcher() UTÁN.
 * Csak production-ben mér — dev-ben kikapcsol, hogy ne zavarjon.
 *
 * @example
 * <script>
 *   import { initGlobalCatcher } from '@/lib/errors/client-catcher';
 *   import { initWebVitals } from '@/lib/errors/web-vitals';
 *   initGlobalCatcher({ ... });
 *   initWebVitals();
 * </script>
 */
export function initWebVitals(): void {
  // Dev-ben nem mérünk
  if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) return;
  // SSR guard
  if (typeof window === 'undefined' || typeof PerformanceObserver === 'undefined') return;

  observeLCP();
  observeCLS();
  observeINP();
  measureTTFB();
}

// ============================================================
// LCP — Largest Contentful Paint
// ============================================================
// FIX: lcp értéket KÍVÜL tároljuk, nem closure-ben.
// Előző bug: minden observer callback új closure-t hozott létre
// saját lcp értékkel + saját event listenerekkel. Ha keydown az
// első entry után tüzelt, a régi (kisebb) lcp-t reportolta.

function observeLCP(): void {
  try {
    let latestLCP = 0;
    let latestElement = 'unknown';
    let latestUrl = '';

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1] as any;
      if (!last || lcpReported) return;

      latestLCP = Math.round(last.startTime);
      latestElement = (last.element?.tagName || 'unknown').toLowerCase();
      latestUrl = last.url || '';
    });

    observer.observe({ type: 'largest-contentful-paint', buffered: true });

    // Report a végleges értéket — event listenerek EGYSZER, kívül
    const reportLCP = () => {
      if (lcpReported) return;
      lcpReported = true;
      observer.disconnect();

      if (latestLCP > THRESHOLDS.LCP) {
        trackError('SEO-PERF-001', null, {
          lcpMs: latestLCP,
          threshold: THRESHOLDS.LCP,
          element: latestElement,
          url: latestUrl,
          page: location.pathname,
        }, 'web-vitals');
      }
    };

    // visibilitychange = tab switch/close — CSAK hidden-nél reportolunk
    addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') reportLCP();
    });
    // keydown/pointerdown = első interakció véglegesíti az LCP-t
    addEventListener('keydown', reportLCP, { once: true });
    addEventListener('pointerdown', reportLCP, { once: true });
  } catch { /* Browser nem támogatja */ }
}

// ============================================================
// CLS — Cumulative Layout Shift
// ============================================================
// FIX 1: visibilitychange CSAK hidden-nél tüzel, NEM once:true
//   (előző bug: once:true + nem ellenőrizte hidden-t → ha első
//    visibilitychange visible volt, a handler elhasználódott)
// FIX 2: session window 5s max időtartam ellenőrzés hozzáadva
//   (előző kód csak 1s gap-et nézett entry-k között,
//    de a window elejétől számított 5s limitet nem)

function observeCLS(): void {
  try {
    let clsScore = 0;
    let sessionEntries: any[] = [];
    let sessionValue = 0;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as any[]) {
        // Csak azokat számoljuk, amik NEM user input miatt történtek
        if (entry.hadRecentInput) continue;

        const prevEntry = sessionEntries[sessionEntries.length - 1];
        const firstEntry = sessionEntries[0];

        // Új session window indul ha:
        // - >1s telt el az előző entry óta (gap)
        // - VAGY >5s telt el a session window eleje óta (max duration)
        if (sessionEntries.length && (
          entry.startTime - prevEntry.startTime > 1000 ||
          entry.startTime - firstEntry.startTime > 5000
        )) {
          if (sessionValue > clsScore) clsScore = sessionValue;
          sessionEntries = [];
          sessionValue = 0;
        }

        sessionEntries.push(entry);
        sessionValue += entry.value;
      }
    });

    observer.observe({ type: 'layout-shift', buffered: true });

    // Report page hide-nál — NEM once, mert hidden→visible→hidden is
    // lehetséges, és a CLS csak hidden-nél végleges
    addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'hidden') return;
      if (clsReported) return;

      // Utolsó session window értéke is számít
      if (sessionValue > clsScore) clsScore = sessionValue;

      if (clsScore > THRESHOLDS.CLS) {
        clsReported = true;
        trackError('SEO-PERF-002', null, {
          clsScore: Math.round(clsScore * 1000) / 1000,
          threshold: THRESHOLDS.CLS,
          page: location.pathname,
        }, 'web-vitals');
      }
    });
  } catch { /* Browser nem támogatja */ }
}

// ============================================================
// INP — Interaction to Next Paint
// ============================================================
// FIX: visibilitychange CSAK hidden-nél, NEM once:true

function observeINP(): void {
  try {
    let worstINP = 0;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as any[]) {
        const duration = entry.duration || 0;
        if (duration > worstINP) worstINP = duration;
      }
    });

    observer.observe({ type: 'event', buffered: true, durationThreshold: 16 });

    addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'hidden') return;
      if (inpReported) return;

      if (worstINP > THRESHOLDS.INP) {
        inpReported = true;
        trackError('SEO-PERF-003', null, {
          inpMs: Math.round(worstINP),
          threshold: THRESHOLDS.INP,
          page: location.pathname,
        }, 'web-vitals');
      }
    });
  } catch { /* Browser nem támogatja */ }
}

// ============================================================
// TTFB — Time to First Byte
// ============================================================

function measureTTFB(): void {
  try {
    const observer = new PerformanceObserver((list) => {
      const nav = list.getEntries()[0] as PerformanceNavigationTiming;
      if (!nav) return;

      const ttfb = Math.round(nav.responseStart - nav.requestStart);

      if (ttfb > THRESHOLDS.TTFB) {
        trackError('SEO-PERF-004', null, {
          ttfbMs: ttfb,
          threshold: THRESHOLDS.TTFB,
          page: location.pathname,
          protocol: nav.nextHopProtocol || 'unknown',
        }, 'web-vitals');
      }

      observer.disconnect();
    });

    observer.observe({ type: 'navigation', buffered: true });
  } catch { /* Browser nem támogatja */ }
}
