import { beforeEach, describe, expect, it, vi } from 'vitest';
import { __resetOnceMemory, createOnceGuard } from '../src/once-guard';

function memStorage() {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), m };
}

describe('createOnceGuard (invariant H)', () => {
  beforeEach(() => __resetOnceMemory());

  it('fires once per id across "tabs" sharing localStorage', () => {
    const local = memStorage();
    const fn = vi.fn();
    const tab1 = createOnceGuard({ storages: [() => local] });
    expect(tab1.fireOnce('quote-1', fn)).toBe(true);
    __resetOnceMemory(); // new tab: memory gone, localStorage shared
    const tab2 = createOnceGuard({ storages: [() => local] });
    expect(tab2.fireOnce('quote-1', fn)).toBe(false);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('different quotes fire independently (lomtalan: callback dedupe keyed by name only)', () => {
    const g = createOnceGuard({ storages: [() => memStorage()] });
    const fn = vi.fn();
    g.fireOnce('callback:q1', fn);
    g.fireOnce('callback:q2', fn);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('falls back to sessionStorage, then memory, when storages throw', () => {
    const session = memStorage();
    const g = createOnceGuard({ storages: [() => { throw new Error('blocked'); }, () => session] });
    const fn = vi.fn();
    g.fireOnce('x', fn);
    expect(session.m.get('once_x')).toBe('1');
    const g2 = createOnceGuard({ storages: [() => { throw new Error('blocked'); }] });
    g2.fireOnce('y', fn);
    expect(g2.fireOnce('y', fn)).toBe(false);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('does not mark when the callback throws, so a retry can fire', () => {
    const g = createOnceGuard({ storages: [() => memStorage()] });
    expect(() => g.fireOnce('z', () => { throw new Error('push failed'); })).toThrow();
    const fn = vi.fn();
    expect(g.fireOnce('z', fn)).toBe(true);
  });

  it('ignores empty ids', () => {
    const fn = vi.fn();
    expect(createOnceGuard({ storages: [] }).fireOnce('', fn)).toBe(false);
    expect(fn).not.toHaveBeenCalled();
  });

  it('review repro: a callback returning false (not sent: no consent / no dataLayer) does not mark, so a retry fires', () => {
    const g = createOnceGuard({ storages: [], prefix: 'review_' });
    expect(g.fireOnce('consent', () => false)).toBe(false);
    expect(g.seen('consent')).toBe(false);
    const fn = vi.fn();
    expect(g.fireOnce('consent', fn)).toBe(true);
    expect(fn).toHaveBeenCalledOnce();
    expect(g.seen('consent')).toBe(true);
  });

  it('true / undefined return count as sent', () => {
    const g = createOnceGuard({ storages: [] });
    expect(g.fireOnce('a', () => true)).toBe(true);
    expect(g.fireOnce('b', () => undefined)).toBe(true);
    expect(g.seen('a') && g.seen('b')).toBe(true);
  });

  it('sync fireOnce refuses an async callback instead of marking before it settles', async () => {
    const g = createOnceGuard({ storages: [] });
    const asyncFn = () => Promise.reject(new Error('push failed'));
    expect(() => g.fireOnce('p', asyncFn as unknown as () => void)).toThrow(TypeError);
    expect(g.seen('p')).toBe(false);
  });
});

describe('createOnceGuard.fireOnceAsync', () => {
  beforeEach(() => __resetOnceMemory());

  it('marks only after the promise resolves', async () => {
    const g = createOnceGuard({ storages: [] });
    let resolve!: () => void;
    const p = g.fireOnceAsync('q', () => new Promise<void>((r) => { resolve = r; }));
    expect(g.seen('q')).toBe(false);
    resolve();
    expect(await p).toBe(true);
    expect(g.seen('q')).toBe(true);
  });

  it('a rejected promise does not mark and rethrows; the retry fires', async () => {
    const g = createOnceGuard({ storages: [] });
    await expect(g.fireOnceAsync('r', async () => { throw new Error('beacon failed'); })).rejects.toThrow('beacon failed');
    expect(g.seen('r')).toBe(false);
    const fn = vi.fn(async () => {});
    expect(await g.fireOnceAsync('r', fn)).toBe(true);
    expect(fn).toHaveBeenCalledOnce();
  });

  it('resolving to false does not mark', async () => {
    const g = createOnceGuard({ storages: [] });
    expect(await g.fireOnceAsync('f', async () => false)).toBe(false);
    expect(g.seen('f')).toBe(false);
  });

  it('a concurrent call for the same id while the first is pending does not fire twice', async () => {
    const g = createOnceGuard({ storages: [] });
    let resolve!: () => void;
    const fn = vi.fn(() => new Promise<void>((r) => { resolve = r; }));
    const p1 = g.fireOnceAsync('c', fn);
    const sync = vi.fn();
    expect(await g.fireOnceAsync('c', fn)).toBe(false);
    expect(g.fireOnce('c', sync)).toBe(false);
    expect(sync).not.toHaveBeenCalled();
    resolve();
    expect(await p1).toBe(true);
    expect(fn).toHaveBeenCalledOnce();
  });
});
