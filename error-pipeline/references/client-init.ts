// src/lib/errors/client-init.ts
//
// Wires window-level error handlers and configures the tracker. Safe to call
// multiple times. Init runs in requestIdleCallback so it never blocks the
// critical path.

import { configureTracker, trackError } from './tracker';

let _initialised = false;

interface InitConfig {
  siteId: string;
  endpoint: string;
}

export function initErrorTracker(config: InitConfig): void {
  if (_initialised) return;
  _initialised = true;

  configureTracker({ endpoint: config.endpoint, siteId: config.siteId });

  const setup = () => {
    // Uncaught synchronous errors
    window.addEventListener('error', (event: ErrorEvent) => {
      // Sub-resource errors (img, script) bubble here too — handle them
      // narrowly via target-type check so we don't double-report runtime errors.
      const target = event.target as Element | Window | null;
      if (target && target !== window && (target as Element).nodeName === 'IMG') {
        trackError(
          'IMG-LOAD-001',
          null,
          { src: ((target as HTMLImageElement).src || '').slice(0, 200) },
          'global:img',
        );
        return;
      }

      const err = event.error;
      const code = detectCode(err, event.message);
      trackError(code, err ?? event.message, {
        line: event.lineno || 0,
        col: event.colno || 0,
      }, `global:${event.filename || 'unknown'}`);
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const err = reason instanceof Error ? reason : new Error(String(reason));
      const code = detectCode(err, err.message);
      trackError(
        code === 'JS-UNHANDLED-001' ? 'JS-PROMISE-001' : code,
        err,
        { type: typeof reason },
        'global:promise',
      );
    });

    // Offline detection — pure observation, not an error itself but useful
    // signal when paired with subsequent fetch failures.
    window.addEventListener('offline', () => {
      trackError('NET-OFFLINE-001', null, { page: location.pathname }, 'global:network');
    });
  };

  // Run setup off the critical path — never block first paint.
  if ('requestIdleCallback' in window) {
    (window as Window & {
      requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => void;
    }).requestIdleCallback(setup, { timeout: 2000 });
  } else {
    setTimeout(setup, 0);
  }
}

/** Map JS Error subclasses → catalogue codes. */
function detectCode(error: unknown, message: string): string {
  if (error instanceof TypeError) return 'JS-TYPE-001';
  if (error instanceof ReferenceError) return 'JS-REF-001';
  if (error instanceof SyntaxError) return 'JS-SYNTAX-001';
  if (error instanceof RangeError) return 'JS-RANGE-001';

  const msg = (message || '').toLowerCase();
  if (msg.includes('is not defined') || msg.includes('is not a function')) return 'JS-TYPE-001';
  if (msg.includes('syntax')) return 'JS-SYNTAX-001';

  return 'JS-UNHANDLED-001';
}

// Re-export so callers can do manual reporting from anywhere.
export { trackError } from './tracker';
