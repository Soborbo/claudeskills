import { afterEach, beforeEach, vi } from 'vitest';

// jsdom complains when an anchor click would navigate. Our global-listener
// tests do exactly that on purpose — silence the noise so test logs stay
// useful.
const originalConsoleError = console.error;
console.error = (...args: unknown[]) => {
  const first = args[0];
  if (typeof first === 'string' && first.includes('Not implemented: navigation')) return;
  if (first instanceof Error && first.message.includes('Not implemented: navigation')) return;
  originalConsoleError(...args);
};

/**
 * jsdom's Blob predates the modern `.text()` / `.arrayBuffer()` methods.
 * FileReader works but is async via setTimeout, which fake timers freeze.
 * Patch both to be usable with sync-ish flow.
 *
 * We capture the original parts on construction via a WeakMap so even
 * blobs created inside the kit (sendBeacon payloads, mirror payloads)
 * can be read back in tests without driving the timer loop.
 */
if (typeof Blob !== 'undefined' && typeof Blob.prototype.text !== 'function') {
  const partsMap = new WeakMap<Blob, BlobPart[]>();
  const OriginalBlob = Blob;
  // Patch the constructor so we remember the parts.
  function PatchedBlob(this: Blob, parts?: BlobPart[], opts?: BlobPropertyBag) {
    const inst = new OriginalBlob(parts || [], opts);
    if (parts) partsMap.set(inst, parts);
    Object.setPrototypeOf(inst, PatchedBlob.prototype);
    return inst;
  }
  PatchedBlob.prototype = Object.create(OriginalBlob.prototype);
  PatchedBlob.prototype.constructor = PatchedBlob;
  PatchedBlob.prototype.text = function text(this: Blob): Promise<string> {
    const parts = partsMap.get(this) || [];
    const out = parts
      .map((p) => (typeof p === 'string' ? p : String(p)))
      .join('');
    return Promise.resolve(out);
  };
  PatchedBlob.prototype.arrayBuffer = function arrayBuffer(this: Blob): Promise<ArrayBuffer> {
    const parts = partsMap.get(this) || [];
    const str = parts.map((p) => (typeof p === 'string' ? p : String(p))).join('');
    const buf = new TextEncoder().encode(str).buffer;
    return Promise.resolve(buf);
  };
  // Replace the global so kit code that does `new Blob(...)` uses the
  // patched constructor and `text()` is available.
  (globalThis as { Blob: typeof Blob }).Blob = PatchedBlob as unknown as typeof Blob;
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();

  document.body.innerHTML = '';
  document.cookie.split(';').forEach((cookie) => {
    const name = cookie.split('=')[0]?.trim();
    if (name) {
      document.cookie = `${name}=; Max-Age=0; path=/`;
    }
  });

  Object.defineProperty(window, 'dataLayer', {
    value: [],
    writable: true,
    configurable: true,
  });

  Object.defineProperty(window, 'google_tag_data', {
    value: {
      ics: {
        entries: {
          ad_storage: { default: 'denied' },
          ad_user_data: { default: 'denied' },
          ad_personalization: { default: 'denied' },
          analytics_storage: { default: 'denied' },
        },
      },
    },
    writable: true,
    configurable: true,
  });

  Object.defineProperty(navigator, 'sendBeacon', {
    value: vi.fn(() => true),
    writable: true,
    configurable: true,
  });

  Object.defineProperty(window, 'BroadcastChannel', {
    value: class {
      name: string;
      onmessage: ((ev: MessageEvent) => void) | null = null;
      constructor(name: string) {
        this.name = name;
      }
      postMessage(_data: unknown): void {
        /* no-op in tests */
      }
      close(): void {
        /* no-op */
      }
      addEventListener(): void {
        /* no-op */
      }
      removeEventListener(): void {
        /* no-op */
      }
      dispatchEvent(): boolean {
        return true;
      }
    },
    writable: true,
    configurable: true,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

export function grantConsent(): void {
  Object.defineProperty(window, 'google_tag_data', {
    value: {
      ics: {
        entries: {
          ad_storage: { update: 'granted' },
          ad_user_data: { update: 'granted' },
          ad_personalization: { update: 'granted' },
          analytics_storage: { update: 'granted' },
        },
      },
    },
    writable: true,
    configurable: true,
  });
}

export function denyConsent(): void {
  Object.defineProperty(window, 'google_tag_data', {
    value: {
      ics: {
        entries: {
          ad_storage: { update: 'denied' },
          ad_user_data: { update: 'denied' },
          ad_personalization: { update: 'denied' },
          analytics_storage: { update: 'denied' },
        },
      },
    },
    writable: true,
    configurable: true,
  });
}

export function partialConsent(overrides: Record<string, 'granted' | 'denied'>): void {
  const entries: Record<string, { update: 'granted' | 'denied' }> = {
    ad_storage: { update: 'denied' },
    ad_user_data: { update: 'denied' },
    ad_personalization: { update: 'denied' },
    analytics_storage: { update: 'denied' },
  };
  for (const [k, v] of Object.entries(overrides)) {
    entries[k] = { update: v };
  }
  Object.defineProperty(window, 'google_tag_data', {
    value: { ics: { entries } },
    writable: true,
    configurable: true,
  });
}
