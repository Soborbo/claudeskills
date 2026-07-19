import { describe, it, expect, afterEach, vi } from 'vitest';
import { generateUUID } from '../lib/uuid';

const V4_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

afterEach(() => vi.unstubAllGlobals());

describe('generateUUID', () => {
  it('native crypto.randomUUID path produces v4 format, unique per call', () => {
    const a = generateUUID();
    const b = generateUUID();
    expect(a).toMatch(V4_RE);
    expect(a).not.toBe(b);
  });

  it('getRandomValues fallback produces a VALID v4 (version + variant bits set)', () => {
    // Emulate an older runtime: no randomUUID, but getRandomValues available.
    vi.stubGlobal('crypto', {
      getRandomValues: (arr: Uint8Array) => {
        // Deterministic worst-case bytes: all 0xff — the bit-masking must still
        // yield version 4 / variant 10.
        arr.fill(0xff);
        return arr;
      },
    });
    const id = generateUUID();
    expect(id).toMatch(V4_RE);
    expect(id[14]).toBe('4');           // version nibble
    expect('89ab').toContain(id[19]);   // variant nibble
  });

  it('all-zero randomness still yields structurally valid v4', () => {
    vi.stubGlobal('crypto', {
      getRandomValues: (arr: Uint8Array) => { arr.fill(0); return arr; },
    });
    expect(generateUUID()).toMatch(V4_RE);
  });

  it('THROWS without a secure context instead of a Math.random fallback (event_id is a cross-platform dedup key)', () => {
    vi.stubGlobal('crypto', undefined);
    expect(() => generateUUID()).toThrow(/secure context/i);
  });
});
