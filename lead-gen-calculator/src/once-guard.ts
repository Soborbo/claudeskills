/**
 * Fire-once guard for conversion / view events.
 *
 * Invariant H: a conversion or "quote viewed" event fires once per entity
 * (quote id / event id), not once per tab. sessionStorage alone re-fires when
 * the quote link is opened from an e-mail the next day or in a new tab
 * (trapezlemezes ~2.4× GA4 overcount, olcsokontenerhaz quote_view,
 * beautyflow calculator_result_view, lomtalan /koszonjuk form_submit).
 *
 * Order: localStorage → sessionStorage → in-memory. Any storage may throw.
 *
 * The id is marked only AFTER the event was actually sent:
 *  - the callback throws            → not marked (error propagates), retry fires;
 *  - the callback returns `false`   → "not sent" (no consent yet, no dataLayer,
 *                                     beacon refused) → not marked, returns false;
 *  - `undefined` / `true`           → sent → marked, returns true.
 *
 * Async callbacks: `fireOnce` is synchronous and REFUSES a callback that returns
 * a Promise/thenable (TypeError, not marked) — marking before it settles would
 * re-create the "marked but never sent" bug. Use `fireOnceAsync`, which marks
 * only after the promise resolves (to anything but `false`), does not mark on
 * rejection (rethrows), and suppresses concurrent calls for the same id while
 * the first one is pending.
 */

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

export interface OnceGuardOptions {
  storages?: Array<() => StorageLike | null | undefined>;
  prefix?: string;
}

export type OnceResult = void | boolean;

const memory = new Set<string>();
/** Ids whose async send is in progress (shared by every guard in this tab). */
const pending = new Set<string>();

function isThenable(v: unknown): v is PromiseLike<unknown> {
  return v != null && (typeof v === 'object' || typeof v === 'function') && typeof (v as { then?: unknown }).then === 'function';
}

function defaultStorages(): Array<() => StorageLike | null | undefined> {
  return [
    () => (typeof window !== 'undefined' ? window.localStorage : null),
    () => (typeof window !== 'undefined' ? window.sessionStorage : null),
  ];
}

export function createOnceGuard(opts: OnceGuardOptions = {}) {
  const storages = opts.storages ?? defaultStorages();
  const prefix = opts.prefix ?? 'once_';

  function seen(id: string): boolean {
    const k = prefix + id;
    if (memory.has(k)) return true;
    for (const get of storages) {
      try {
        if (get()?.getItem(k)) return true;
      } catch {
        /* blocked storage: try the next one */
      }
    }
    return false;
  }

  function mark(id: string): void {
    const k = prefix + id;
    memory.add(k);
    for (const get of storages) {
      try {
        const s = get();
        if (s) {
          s.setItem(k, '1');
          return;
        }
      } catch {
        /* try the next one */
      }
    }
  }

  /**
   * Runs `fn` until it succeeds once for `id`. Marks only after `fn` returned
   * without throwing and without returning `false`. Synchronous callbacks only.
   */
  function fireOnce(id: string, fn: () => OnceResult): boolean {
    if (!id || seen(id) || pending.has(prefix + id)) return false;
    const r: unknown = fn();
    if (isThenable(r)) {
      // Do not leave an unhandled rejection behind; the caller gets the TypeError.
      Promise.resolve(r).catch(() => {});
      throw new TypeError('createOnceGuard.fireOnce: callback returned a Promise — use fireOnceAsync so the id is marked only after it resolves');
    }
    if (r === false) return false;
    mark(id);
    return true;
  }

  /**
   * Async variant: marks only after the returned promise resolves to anything
   * but `false`. A rejection is rethrown and leaves the id unmarked. While a
   * send for `id` is pending, further calls return false without calling `fn`.
   */
  async function fireOnceAsync(id: string, fn: () => OnceResult | PromiseLike<OnceResult>): Promise<boolean> {
    const k = prefix + id;
    if (!id || seen(id) || pending.has(k)) return false;
    pending.add(k);
    try {
      const r = await fn();
      if (r === false) return false;
      mark(id);
      return true;
    } finally {
      pending.delete(k);
    }
  }

  return { seen, mark, fireOnce, fireOnceAsync };
}

/** Test helper: forget the in-memory layer. */
export function __resetOnceMemory(): void {
  memory.clear();
  pending.clear();
}
