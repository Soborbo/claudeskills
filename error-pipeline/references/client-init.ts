// src/lib/errors/client-init.ts
//
// Wires window-level error handlers and configures the tracker. Safe to call
// multiple times.
//
// Listeners are attached SYNCHRONOUSLY so we never miss errors thrown during
// hydration / early script execution. The actual report send is fire-and-
// forget via sendBeacon, which is itself non-blocking (~microseconds).

import { configureTracker, trackError } from './tracker';

let _initialised = false;

interface InitConfig {
  siteId: string;
  endpoint: string;
}

// Resource-element types whose load failures should be reported as resource
// errors rather than runtime JS errors. The 'error' event bubbles to window
// for these even though they don't cross the runtime boundary.
const RESOURCE_NODES = new Set(['IMG', 'SCRIPT', 'LINK', 'SOURCE', 'VIDEO', 'AUDIO']);

export function initErrorTracker(config: InitConfig): void {
  if (_initialised) return;
  _initialised = true;

  configureTracker({ endpoint: config.endpoint, siteId: config.siteId });

  // Uncaught synchronous errors AND sub-resource load failures.
  // Both bubble through the same listener; distinguish via event.target.
  window.addEventListener('error', (event: ErrorEvent) => {
    const target = event.target as (Element & { src?: string; href?: string }) | Window | null;

    if (target && target !== window) {
      const node = (target as Element).nodeName;
      if (node && RESOURCE_NODES.has(node)) {
        const src =
          (target as HTMLImageElement | HTMLScriptElement).src ||
          (target as HTMLLinkElement).href ||
          '';
        const code = node === 'IMG' ? 'IMG-LOAD-001' : 'NET-RESOURCE-001';
        trackError(
          code,
          null,
          { src: String(src).slice(0, 200), tag: node },
          `global:${node.toLowerCase()}`,
        );
        return;
      }
    }

    const err = event.error;
    const code = detectCode(err, event.message);
    trackError(
      code,
      err ?? event.message,
      {
        line: event.lineno || 0,
        col: event.colno || 0,
      },
      `global:${event.filename || 'unknown'}`,
    );
  });

  // Unhandled promise rejections. Pass the ORIGINAL reason to detectCode so
  // TypeError/ReferenceError prototypes survive — wrapping in
  // `new Error(String(reason))` would collapse every rejection to JS-PROMISE.
  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    const reason = event.reason;
    const reasonMessage =
      reason instanceof Error
        ? reason.message
        : typeof reason === 'string'
          ? reason
          : '';
    const code = detectCode(reason, reasonMessage);
    trackError(
      code === 'JS-UNHANDLED-001' ? 'JS-PROMISE-001' : code,
      reason instanceof Error ? reason : new Error(reasonMessage || 'Unhandled rejection'),
      { type: typeof reason },
      'global:promise',
    );
  });

  // Offline detection — pure observation, not an error itself but useful
  // signal when paired with subsequent fetch failures.
  window.addEventListener('offline', () => {
    trackError('NET-OFFLINE-001', null, { page: location.pathname }, 'global:network');
  });
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
