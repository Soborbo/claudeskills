import { describe, expect, it } from 'vitest';
import { attributionFromSearch, mergeAttribution, readStoredAttribution } from '../src/attribution';

const DAY = 86_400_000;

describe('mergeAttribution (invariant I)', () => {
  it('emits at most one Google click id', () => {
    const out = mergeAttribution({ gclid: 'G', gbraid: 'B', wbraid: 'W' });
    expect(out).toEqual({ gclid: 'G' });
  });

  it('regression beautyflow: fresh URL gbraid is not mixed with a stale stored gclid', () => {
    const url = { gbraid: 'fresh-B', utm_source: 'google' };
    const stored = { gclid: 'stale-G', utm_campaign: 'spring' };
    const out = mergeAttribution(url, stored);
    expect(out.gbraid).toBe('fresh-B');
    expect(out.gclid).toBeUndefined();
    expect(out.utm_source).toBe('google');
    expect(out.utm_campaign).toBe('spring'); // non-Google fields still fall back
  });

  it('falls back to the stored Google id when the URL has none', () => {
    expect(mergeAttribution({ utm_source: 'x' }, { wbraid: 'W' })).toEqual({ utm_source: 'x', wbraid: 'W' });
  });

  it('keeps fbclid and msclkid, trims and caps length, ignores non-strings', () => {
    const out = mergeAttribution({ fbclid: '  F  ', msclkid: 'M', utm_term: 42 as unknown as string, gclid: 'x'.repeat(900) });
    expect(out.fbclid).toBe('F');
    expect(out.msclkid).toBe('M');
    expect(out.utm_term).toBeUndefined();
    expect(out.gclid?.length).toBe(500);
  });

  it('tolerates null sources', () => {
    expect(mergeAttribution(null, undefined, { gclid: 'G' })).toEqual({ gclid: 'G' });
  });
});

describe('attributionFromSearch', () => {
  it('reads every tracked field from the query', () => {
    expect(attributionFromSearch('?gclid=G&utm_source=s&foo=bar&msclkid=M')).toEqual({ gclid: 'G', utm_source: 's', msclkid: 'M' });
  });
});

describe('readStoredAttribution', () => {
  const now = 1_000 * DAY;
  const store = (v: string | null) => ({ getItem: () => v });

  it('returns unexpired values only', () => {
    const raw = JSON.stringify({ gclid: { value: 'G', savedAt: now - 10 * DAY }, utm_source: { value: 's', savedAt: now - 100 * DAY } });
    expect(readStoredAttribution(() => store(raw), 'k', 90 * DAY, now)).toEqual({ gclid: 'G' });
  });

  it('never throws: blocked storage, bad JSON, wrong shapes', () => {
    expect(readStoredAttribution(() => { throw new Error('SecurityError'); }, 'k', DAY, now)).toEqual({});
    expect(readStoredAttribution(() => store('{oops'), 'k', DAY, now)).toEqual({});
    expect(readStoredAttribution(() => store('[1,2]'), 'k', DAY, now)).toEqual({});
    expect(readStoredAttribution(() => ({ getItem: () => { throw new Error('x'); } }), 'k', DAY, now)).toEqual({});
    expect(readStoredAttribution(() => null, 'k', DAY, now)).toEqual({});
  });
});
