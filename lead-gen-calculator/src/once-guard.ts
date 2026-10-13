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
 */

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

export interface OnceGuardOptions {
  storages?: Array<() => StorageLike | null | undefined>;
  prefix?: string;
}

const memory = new Set<string>();

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

  /** Runs `fn` only the first time `id` is seen. Marks AFTER fn succeeds. */
  function fireOnce(id: string, fn: () => void): boolean {
    if (!id || seen(id)) return false;
    fn();
    mark(id);
    return true;
  }

  return { seen, mark, fireOnce };
}

/** Test helper: forget the in-memory layer. */
export function __resetOnceMemory(): void {
  memory.clear();
}
