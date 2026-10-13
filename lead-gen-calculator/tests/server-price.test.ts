import { describe, expect, it } from 'vitest';
import { reconcilePrice } from '../src/server-price';

describe('reconcilePrice (invariant K)', () => {
  it('uses the server value even when the client sent another', () => {
    expect(reconcilePrice(120_000, 99_999_999)).toEqual({ value: 120_000, mismatch: true, clientValue: 99_999_999 });
  });
  it('tolerates rounding drift', () => {
    expect(reconcilePrice(120_000, 120_500).mismatch).toBe(false);
    expect(reconcilePrice(100, 100.4).mismatch).toBe(false);
  });
  it('unpriceable server result → no value (never fall back to the client total)', () => {
    expect(reconcilePrice(null, 50_000)).toEqual({ value: null, mismatch: true, clientValue: 50_000 });
    expect(reconcilePrice(Number.NaN, undefined)).toEqual({ value: null, mismatch: false, clientValue: null });
  });
  it('caps absurd server values', () => {
    expect(reconcilePrice(5e9, undefined, { max: 1e8 }).value).toBeNull();
  });
});
