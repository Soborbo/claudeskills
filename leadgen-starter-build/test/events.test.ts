import { describe, it, expect, beforeEach } from 'vitest';
import { pushLeadConversion, pushContactConversion } from '../src/lib/tracking/events';

// events.ts only touches `window` at call time, so a per-test stub is enough —
// no jsdom. Default consent = marketing granted; individual tests override it.
type TestWindow = {
  dataLayer: Record<string, unknown>[];
  CookieYes: { getConsent: () => Record<string, boolean> };
};

function setup(marketing = true): Record<string, unknown>[] {
  const layer: Record<string, unknown>[] = [];
  (globalThis as unknown as { window: TestWindow }).window = {
    dataLayer: layer,
    CookieYes: { getConsent: () => ({ marketing, analytics: true }) },
  };
  return layer;
}

beforeEach(() => setup());

describe('pushLeadConversion', () => {
  it('omits value AND currency entirely when there is no positive value (CLAUDE.md §3)', () => {
    const layer = setup();
    pushLeadConversion({ eventId: 'e1', formId: 'contact' });
    expect(layer).toHaveLength(1);
    expect(layer[0]).toEqual({ event: 'generate_lead', event_id: 'e1', form_id: 'contact' });
    expect('value' in layer[0]).toBe(false);
    expect('currency' in layer[0]).toBe(false);
  });

  it('NEVER pushes value:0 even when a zero value is passed', () => {
    const layer = setup();
    pushLeadConversion({ eventId: 'e1', formId: 'contact', value: 0, currency: 'GBP' });
    expect('value' in layer[0]).toBe(false);
    expect('currency' in layer[0]).toBe(false);
  });

  it('includes value + the caller-provided currency when value > 0 (never hardcoded GBP)', () => {
    const layer = setup();
    pushLeadConversion({ eventId: 'e1', formId: 'contact', value: 250, currency: 'HUF' });
    expect(layer[0]).toMatchObject({ value: 250, currency: 'HUF' });
  });

  it('drops value when a positive amount has no currency (currency is mandatory with value)', () => {
    const layer = setup();
    pushLeadConversion({ eventId: 'e1', formId: 'contact', value: 250 });
    expect('value' in layer[0]).toBe(false);
  });

  it('NEVER puts PII (hashed or raw) on the dataLayer (CLAUDE.md §15)', () => {
    const layer = setup();
    pushLeadConversion({ eventId: 'e1', formId: 'contact', value: 250, currency: 'GBP' });
    const json = JSON.stringify(layer[0]);
    expect(json).not.toContain('user_data');
    expect(json).not.toContain('sha256');
  });

  it('pushes nothing without marketing consent', () => {
    const layer = setup(false);
    pushLeadConversion({ eventId: 'e1', formId: 'contact' });
    expect(layer).toHaveLength(0);
  });
});

describe('pushContactConversion', () => {
  it('pushes metadata only — no user_data / sha256', () => {
    const layer = setup();
    pushContactConversion({ eventId: 'e2', formId: 'contact' });
    expect(layer[0]).toEqual({ event: 'contact', event_id: 'e2', form_id: 'contact' });
  });

  it('pushes nothing without marketing consent', () => {
    const layer = setup(false);
    pushContactConversion({ eventId: 'e2', formId: 'contact' });
    expect(layer).toHaveLength(0);
  });
});
