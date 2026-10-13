import { describe, expect, it } from 'vitest';
import { keyFromPayload, stableStringify } from '../src/stable-key';

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
});
