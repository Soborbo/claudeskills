import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { sendToWorker } from '../lib/gateway';
import { getDiagnostics } from '../lib/observability';
import { resetAll } from './helpers';

// Token-less degraded dispatch (server-side TASK 2).
//
// This file NEVER stubs window.turnstile, so getTurnstileToken() always resolves
// undefined (TRK-2001, no token). Because vitest isolates the module registry per
// FILE, the module-level Turnstile token cache stays empty here — making the
// no-token path deterministic regardless of the other gateway tests.

function stubFetch() {
  const fetchMock = vi.fn((..._args: unknown[]) =>
    Promise.resolve(new Response(null, { status: 204 })),
  );
  vi.stubGlobal('fetch', fetchMock);
  // Force the fetch path (not sendBeacon) so we can inspect the POST body.
  Object.defineProperty(navigator, 'sendBeacon', { configurable: true, value: () => false });
  return fetchMock;
}

function codes(): string[] {
  return getDiagnostics().map((d) => d.code);
}

beforeEach(() => resetAll());
afterEach(() => vi.unstubAllGlobals());

describe('sendToWorker — token-less degraded low-risk dispatch', () => {
  for (const event of ['phone_number_clicked', 'email_address_clicked', 'whatsapp_button_clicked']) {
    it(`${event}: dispatches token-less when no Turnstile token (degraded)`, async () => {
      const fetchMock = stubFetch();
      const ok = await sendToWorker({ event_name: event, event_id: 'E', event_time: 1_700_000_000 });

      expect(ok).toBe(true);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const body = JSON.parse((fetchMock.mock.calls[0][1] as { body: string }).body);
      // The whole point: the body carries NO turnstile_token, so the worker sees
      // `missing_token` and accepts via the degraded path.
      expect('turnstile_token' in body).toBe(false);
      expect(body.event_name).toBe(event);
      // Degraded dispatch is surfaced (TRK-1004), NOT the skip code (TRK-1001).
      expect(codes()).toContain('TRK-1004');
      expect(codes()).not.toContain('TRK-1001');
    });
  }
});

describe('sendToWorker — higher-risk events still skipped without a token', () => {
  // callback_request_submitted is deliberately EXCLUDED from the low-risk set (parity with
  // the worker's DEGRADED_LOW_RISK_EVENTS) — a form/callback is a spam surface.
  for (const event of ['contact_form_submitted', 'callback_request_submitted', 'quote_calculator_submitted']) {
    it(`${event}: skips (no dispatch) and reports TRK-1001`, async () => {
      const fetchMock = stubFetch();
      const ok = await sendToWorker({ event_name: event, event_id: 'E', event_time: 1_700_000_000 });

      expect(ok).toBe(false);
      expect(fetchMock).not.toHaveBeenCalled();
      expect(codes()).toContain('TRK-1001');
      expect(codes()).not.toContain('TRK-1004');
    });
  }
});
