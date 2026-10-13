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
});
