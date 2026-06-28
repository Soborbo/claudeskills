import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  report, getDiagnostics, clearDiagnostics, redactPii, TRACKING_CODES,
  type TrackingDiagnostic,
} from '../lib/observability';
import { resetAll } from './helpers';

beforeEach(() => { resetAll(); clearDiagnostics(); });
afterEach(() => vi.restoreAllMocks());

describe('diagnostic codes are stable + unique', () => {
  it('every code is TRK-NNNN and unique (a contract for dashboards/alerts)', () => {
    const codes = Object.values(TRACKING_CODES).map((c) => c.code);
    for (const c of codes) expect(c).toMatch(/^TRK-\d{4}$/);
    expect(new Set(codes).size).toBe(codes.length);
  });
});

describe('report()', () => {
  it('error → console.error + ring buffer + CustomEvent', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const events: TrackingDiagnostic[] = [];
    const handler = (e: Event) => events.push((e as CustomEvent).detail);
    window.addEventListener('sb-tracking-diagnostic', handler);

    const d = report('GATEWAY_NETWORK_FAIL', { event_name: 'phone_number_clicked' });
    expect(d.code).toBe('TRK-1002');
    expect(d.severity).toBe('error');
    expect(spy).toHaveBeenCalledOnce();
    expect(getDiagnostics().at(-1)?.code).toBe('TRK-1002');
    expect(events).toHaveLength(1);
    expect(events[0].code).toBe('TRK-1002');
    expect(events[0].context?.event_name).toBe('phone_number_clicked');

    window.removeEventListener('sb-tracking-diagnostic', handler);
  });

  it('info (GATEWAY_OK) → rings but does NOT spam the error pipeline (no CustomEvent, no console)', () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    let dispatched = 0;
    const handler = () => { dispatched++; };
    window.addEventListener('sb-tracking-diagnostic', handler);

    report('GATEWAY_OK', { transport: 'beacon' });
    expect(getDiagnostics().at(-1)?.code).toBe('TRK-1000');
    expect(dispatched).toBe(0);            // info is not forwarded to the pipeline
    expect(errSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
    expect(logSpy).not.toHaveBeenCalled(); // info silent unless diag-debug

    window.removeEventListener('sb-tracking-diagnostic', handler);
  });

  it('ring buffer is bounded (no unbounded memory growth)', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    for (let i = 0; i < 60; i++) report('TURNSTILE_TIMEOUT');
    expect(getDiagnostics().length).toBeLessThanOrEqual(50);
  });
});

describe('redactPii — dataLayer PII guard', () => {
  it('strips PII-shaped keys in place and returns their names', () => {
    const data: Record<string, unknown> = {
      event: 'quote_calculator_submitted', value: 380, currency: 'GBP',
      email: 'a@b.com', phone_number: '+447…', user_provided_data: {}, em: 'hash',
    };
    const leaked = redactPii(data);
    expect(new Set(leaked)).toEqual(new Set(['email', 'phone_number', 'user_provided_data', 'em']));
    expect(data.email).toBeUndefined();
    expect(data.phone_number).toBeUndefined();
    // non-PII survives
    expect(data.value).toBe(380);
    expect(data.currency).toBe('GBP');
    expect(data.event).toBe('quote_calculator_submitted');
  });

  it('leaves clean payloads untouched', () => {
    const data = { event: 'phone_number_clicked', event_id: 'E1', session_id: 's', device: 'mobile' };
    expect(redactPii(data)).toEqual([]);
  });
});
