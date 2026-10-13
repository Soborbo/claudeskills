import { describe, expect, it } from 'vitest';
import { type BoundsSpec, checkBounds, inputAttrs, parseStrictNumber } from '../src/bounds';

const spec: BoundsSpec = {
  qty: { min: 1, max: 20, integer: true, message: 'Adjon meg {min} és {max} közötti darabszámot.' },
  length_cm: { min: 10, max: 800, integer: true, message: 'A lemez hossza {min}–{max} cm lehet.' },
};

describe('parseStrictNumber', () => {
  it.each([['12', 12], ['12.5', 12.5], ['12,5', 12.5], [' 7 ', 7], [3, 3]])('accepts %s', (raw, n) => {
    expect(parseStrictNumber(raw)).toBe(n);
  });
  it.each(['', ' ', '1e3', '12abc', '0x10', 'NaN', null, undefined, Infinity, {}])('rejects %s', (raw) => {
    expect(parseStrictNumber(raw)).toBeNull();
  });
});

describe('checkBounds (invariant F)', () => {
  it('regression olcsokontenerhaz: qty above the server max is rejected with a localized message', () => {
    const r = checkBounds({ qty: '35', length_cm: '300' }, spec);
    expect(r.ok).toBe(false);
    expect(r.errors.qty).toBe('Adjon meg 1 és 20 közötti darabszámot.');
    expect(r.errors.qty).not.toMatch(/too big|number/i);
  });

  it('regression trapezlemezes: 900 cm sheet rejected; 800 accepted', () => {
    expect(checkBounds({ qty: 1, length_cm: 900 }, spec).ok).toBe(false);
    expect(checkBounds({ qty: 1, length_cm: 800 }, spec)).toEqual({ ok: true, values: { qty: 1, length_cm: 800 }, errors: {} });
  });

  it('regression femkeriteslec: 150.5 and 1e3 do not slip through integer fields', () => {
    expect(checkBounds({ qty: 1, length_cm: '150.5' }, spec).errors.length_cm).toBeDefined();
    expect(checkBounds({ qty: 1, length_cm: '1e3' }, spec).errors.length_cm).toBeDefined();
  });

  it('missing fields are errors, not silently dropped', () => {
    expect(Object.keys(checkBounds({}, spec).errors).sort()).toEqual(['length_cm', 'qty']);
  });

  it('client input attributes come from the same spec', () => {
    expect(inputAttrs(spec.qty)).toEqual({ min: '1', max: '20', step: '1', inputmode: 'numeric' });
  });
});
