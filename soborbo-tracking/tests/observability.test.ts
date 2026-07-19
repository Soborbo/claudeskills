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
    vi.spyOn(console, 'error').mockImplementation(() => {});
    for (let i = 0; i < 60; i++) report('GATEWAY_REJECTED');
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

describe('report() — remaining branches', () => {
  it('ring drops the OLDEST entries (newest last, bounded at 50)', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    for (let i = 0; i < 55; i++) report('GATEWAY_REJECTED', { i });
    const ring = getDiagnostics();
    expect(ring).toHaveLength(50);
    expect(ring[0].context?.i).toBe(5);      // 0..4 dropped
    expect(ring.at(-1)?.context?.i).toBe(54);
  });

  it('getDiagnostics returns a COPY — mutating it does not corrupt the ring', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    report('GATEWAY_REJECTED');
    const copy = getDiagnostics();
    copy.length = 0;
    expect(getDiagnostics()).toHaveLength(1);
  });

  it('a throwing CustomEvent dispatch is swallowed — the ring still records', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const orig = window.dispatchEvent.bind(window);
    (window as unknown as { dispatchEvent: unknown }).dispatchEvent = () => { throw new Error('CSP'); };
    try {
      const d = report('GATEWAY_NETWORK_FAIL');
      expect(d.code).toBe('TRK-1002');
      expect(getDiagnostics().at(-1)?.code).toBe('TRK-1002');
    } finally {
      (window as unknown as { dispatchEvent: unknown }).dispatchEvent = orig;
    }
  });

  it('warn severity → console.warn + pipeline CustomEvent (future-code contract)', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    let dispatched = 0;
    const handler = () => { dispatched++; };
    window.addEventListener('sb-tracking-diagnostic', handler);
    const codes = TRACKING_CODES as unknown as Record<string, { code: string; severity: string; message: string }>;
    codes.__TEST_WARN = { code: 'TRK-9999', severity: 'warn', message: 'synthetic warn' };
    try {
      const d = report('__TEST_WARN' as never);
      expect(d.severity).toBe('warn');
      expect(warnSpy).toHaveBeenCalledOnce();
      expect(dispatched).toBe(1);
    } finally {
      delete codes.__TEST_WARN;
      window.removeEventListener('sb-tracking-diagnostic', handler);
    }
  });

  // LAST on purpose: enableDiagDebug flips a module-level flag with no off-switch.
  it('enableDiagDebug turns info-level console logging on', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const { enableDiagDebug } = await import('../lib/observability');
    enableDiagDebug();
    report('GATEWAY_OK', { transport: 'beacon' });
    expect(logSpy).toHaveBeenCalledOnce();
  });
});
