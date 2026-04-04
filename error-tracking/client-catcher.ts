// src/lib/errors/client-catcher.ts
// Global error catcher — window.onerror + unhandledrejection + image errors

import { trackError, configureTracker } from './tracker';
import type { CatcherConfig } from './types';

let isInitialized = false;

/**
 * Inicializáld a base layout-ban, utolsó script-ként </body> előtt.
 *
 * @example
 * <script>
 *   import { initGlobalCatcher } from '@/lib/errors/client-catcher';
 *   initGlobalCatcher({
 *     endpoint: '/api/error-report',
 *     siteId: import.meta.env.PUBLIC_SITE_ID || 'unknown',
 *     deployId: import.meta.env.PUBLIC_DEPLOY_ID || '',
 *     isDev: import.meta.env.DEV,
 *   });
 * </script>
 */
export function initGlobalCatcher(config: CatcherConfig): void {
  if (isInitialized) return;
  isInitialized = true;

  // FIX: Config értékek ÁTADÁSA a tracker modulnak.
  // Előző bug: a config megérkezett ide, de soha nem lett elmentve.
  // A trackError() kizárólag import.meta.env-ből próbált olvasni,
  // az endpoint pedig hardcoded '/api/error-report' volt.
  configureTracker({
    endpoint: config.endpoint,
    siteId: config.siteId,
    deployId: config.deployId,
  });

  // --- Uncaught sync errors ---
  window.onerror = (
    message: string | Event,
    source?: string,
    lineno?: number,
    colno?: number,
    error?: Error,
  ) => {
    // Error típus felismerés
    const code = detectErrorCode(error, String(message));
    const sourcePath = source
      ? safePathname(source)
      : 'unknown';

    trackError(code, error || message, {
      source: sourcePath,
      line: lineno || 0,
      col: colno || 0,
    }, `global:${sourcePath}`);

    return false; // Ne suppress-áljuk — DevTools-ban is látszódjon
  };

  // --- Unhandled promise rejections ---
  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    const reason = event.reason;
    const error = reason instanceof Error ? reason : new Error(String(reason));
    const code = detectErrorCode(error, error.message);

    trackError(
      code === 'JS-UNHANDLED-001' ? 'JS-PROMISE-001' : code,
      error,
      { type: typeof reason, message: error.message.substring(0, 200) },
      'global:promise',
    );
  });

  // --- Image load errors ---
  document.addEventListener('error', (event: Event) => {
    const target = event.target as HTMLElement;
    if (target instanceof HTMLImageElement) {
      trackError('IMG-LOAD-001', null, {
        src: target.src ? safePathname(target.src) : 'unknown',
        alt: (target.alt || 'no-alt').substring(0, 100),
        page: location.pathname,
      }, 'global:img');
    }
  }, true); // Capture phase

  // --- Offline detection ---
  window.addEventListener('offline', () => {
    trackError('NET-OFFLINE-001', null, {
      lastPage: location.pathname,
    }, 'global:network');
  });

  // --- Dev banner ---
  if (config.isDev) {
    console.log(
      '%c🔍 Error Tracking Active (DEV)%c\n' +
      'Errors → styled console output. No data sent to endpoint.\n' +
      'Missing requiredContext → warning.',
      'background:#2563eb;color:white;padding:4px 8px;border-radius:4px;font-weight:bold',
      'color:#666;font-size:11px',
    );
  }
}

/**
 * Error objektum alapján finomabb kód detektálás.
 * TypeError, ReferenceError, SyntaxError, RangeError → saját kód.
 */
function detectErrorCode(error: unknown, message: string): string {
  if (error instanceof TypeError) return 'JS-TYPE-001';
  if (error instanceof ReferenceError) return 'JS-REF-001';
  if (error instanceof SyntaxError) return 'JS-SYNTAX-001';
  if (error instanceof RangeError) return 'JS-RANGE-001';

  // Message-based fallback
  const msg = message.toLowerCase();
  if (msg.includes('is not defined') || msg.includes('is not a function')) return 'JS-TYPE-001';
  if (msg.includes('syntax')) return 'JS-SYNTAX-001';

  return 'JS-UNHANDLED-001';
}

/** URL-ből csak a pathname-t szedjük ki — nincs origin/query leak */
function safePathname(url: string): string {
  try {
    return new URL(url, location.origin).pathname;
  } catch {
    return url.substring(0, 100);
  }
}
