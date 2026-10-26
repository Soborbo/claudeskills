import { describe, expect, it } from 'vitest';
import { hashString, keyFromPayload, stableStringify } from '../src/stable-key';

describe('stableStringify / keyFromPayload (invariant A)', () => {
  it('regression trapezlemezes: the replacer-array bug collapses different carts to one key', () => {
    const a = { email: 'x@y.hu', items: [{ color: 'RAL3009', len: 300 }] };
    const b = { email: 'x@y.hu', items: [{ color: 'RAL7016', len: 500 }] };
    const buggy = (p: Record<string, unknown>) => JSON.stringify(p, Object.keys(p).sort());
    expect(buggy(a)).toBe(buggy(b)); // documents the trap
    expect(keyFromPayload(a)).not.toBe(keyFromPayload(b));
  });

  it('is key-order independent at every depth', () => {
    expect(stableStringify({ b: 1, a: { d: [1, { y: 2, x: 1 }], c: 3 } })).toBe(
      stableStringify({ a: { c: 3, d: [1, { x: 1, y: 2 }] }, b: 1 }),
    );
  });

  it('distinguishes nested values, array order and types', () => {
    expect(keyFromPayload({ a: { b: 1 } })).not.toBe(keyFromPayload({ a: { b: 2 } }));
    expect(keyFromPayload({ a: [1, 2] })).not.toBe(keyFromPayload({ a: [2, 1] }));
    expect(keyFromPayload({ a: '1' })).not.toBe(keyFromPayload({ a: 1 }));
  });

  it('ignores undefined fields like JSON does', () => {
    expect(stableStringify({ a: 1, b: undefined })).toBe(stableStringify({ a: 1 }));
  });

  it('roof dimensions change the calculator key (usage + sizes must be hashed)', () => {
    const base = { usage: 'teto', roof_1_a: '500', roof_1_b: '400' };
    expect(keyFromPayload(base)).not.toBe(keyFromPayload({ ...base, roof_1_b: '450' }));
    expect(keyFromPayload(base)).not.toBe(keyFromPayload({ ...base, usage: 'teto_es_oldalfal' }));
  });

  it('produces a 128-bit (32 hex) digest, deterministic and synchronous', () => {
    const k = keyFromPayload({ a: 1 });
    expect(k).toMatch(/^idem_[0-9a-f]{32}$/);
    expect(keyFromPayload({ a: 1 })).toBe(k);
    expect(hashString('')).toMatch(/^[0-9a-f]{32}$/);
  });

  it('matches the published 64-bit FNV-1a test vector in its first lane', () => {
    // FNV-1a 64 of "a" = af63dc4c8601ec8c (Fowler/Noll/Vo reference vectors).
    expect(hashString('a').slice(0, 16)).toBe('af63dc4c8601ec8c');
  });

  it('separates a known FNV-1a 32-bit collision pair', () => {
    // "costarring" and "liquid" share the 32-bit FNV-1a value 0x5e4daa9d.
    const fnv32 = (s: string) => {
      let h = 0x811c9dc5;
      for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193);
      return h >>> 0;
    };
    expect(fnv32('costarring')).toBe(fnv32('liquid'));
    expect(hashString('costarring')).not.toBe(hashString('liquid'));
  });

  it('has no collisions across 50,000 distinct calculator payloads', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 50_000; i++) {
      seen.add(keyFromPayload({ usage: 'teto', roof_1_a: String(i % 1000), roof_1_b: String(Math.floor(i / 1000)) }));
    }
    expect(seen.size).toBe(50_000);
  });

  it('hashes non-ASCII text by its UTF-8 bytes', () => {
    expect(hashString('Győr')).not.toBe(hashString('Gyor'));
    expect(hashString('ő')).not.toBe(hashString('Å'));
  });
});
