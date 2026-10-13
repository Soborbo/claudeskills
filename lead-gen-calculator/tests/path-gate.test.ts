import { describe, expect, it } from 'vitest';
import { gateRequest, normalizePath } from '../src/path-gate';

const allow = new Set(['/', '/arkalkulator/', '/ajanlat/', '/kapcsolat/']);
const u = (s: string) => new URL(s, 'https://lomtalan.hu');

describe('normalizePath', () => {
  it.each([['/ajanlat', '/ajanlat/'], ['/Ajanlat/', '/ajanlat/'], ['//ajanlat', '/ajanlat/'], ['/robots.txt', '/robots.txt'], ['', '/']])('%s → %s', (i, o) => {
    expect(normalizePath(i)).toBe(o);
  });
});

describe('gateRequest', () => {
  it('regression lomtalan: allowlisted page without slash → 301 to slashed URL, query kept', () => {
    expect(gateRequest(u('/arkalkulator?property=haz&gclid=G'), allow)).toEqual({
      action: 'redirect', location: '/arkalkulator/?property=haz&gclid=G', status: 301,
    });
  });
  it('passes the canonical path', () => {
    expect(gateRequest(u('/ajanlat/?q=1'), allow)).toEqual({ action: 'pass' });
  });
  it('blocked pages go to the fallback but keep attribution params', () => {
    expect(gateRequest(u('/draft?gclid=G'), allow)).toEqual({ action: 'redirect', location: '/?gclid=G', status: 302 });
  });
  it('bypass prefixes are never gated', () => {
    expect(gateRequest(u('/api/contact'), allow, { bypassPrefixes: ['/api/'] })).toEqual({ action: 'pass' });
  });
});
