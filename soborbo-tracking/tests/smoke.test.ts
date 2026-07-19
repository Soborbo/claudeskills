import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { runDailySmokeLead } from '../server/backend/smoke';
import type { GatewayEnv } from '../server/backend/gateway-dispatch';

// A napi szintetikus lead az egyetlen automatikus bizonyíték arra, hogy a
// TELJES szerver-lánc él (cron → binding → gateway → Meta TEST stream → D1).
// A legfontosabb kontraktus: teszt-markerek NÉLKÜL inkább nem fut, mint hogy a
// szintetikus esemény a PRODUKCIÓS Meta-streambe follyon.

const okResponse = () => new Response('{}', { status: 200 });

let logSpy: ReturnType<typeof vi.spyOn>;
let errSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

function envWith(overrides: Partial<GatewayEnv> = {}): GatewayEnv {
  return {
    TRACKING_GATEWAY_TOKEN: 'tok',
    SITE_URL: 'https://lomtalan.hu',
    TRACKING_TEST_LEAD_EMAIL: 'gateway-smoke-test@soborbo.co.uk',
    TRACKING_TEST_EVENT_CODE: 'TEST_SITE',
    ...overrides,
  };
}

describe('runDailySmokeLead', () => {
  it('REFUSES to run without the test markers — loud skip, no dispatch', async () => {
    const bindingFetch = vi.fn(() => Promise.resolve(okResponse()));
    await runDailySmokeLead(envWith({
      TRACKING_TEST_LEAD_EMAIL: undefined,
      TRACKING_TEST_EVENT_CODE: undefined,
      GATEWAY: { fetch: bindingFetch },
    }));
    expect(bindingFetch).not.toHaveBeenCalled();
    expect(errSpy).toHaveBeenCalledOnce();
    expect(String(errSpy.mock.calls[0][0])).toContain('[smoke] skipped');
  });

  it('dispatches the deterministic daily synthetic lead with the test_event_code + GRANTED consent', async () => {
    const bindingFetch = vi.fn(() => Promise.resolve(okResponse()));
    await runDailySmokeLead(envWith({ GATEWAY: { fetch: bindingFetch } }));

    expect(bindingFetch).toHaveBeenCalledTimes(1);
    const [url, init] = bindingFetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://lomtalan.hu/api/event/conversion-server');
    const body = JSON.parse(init.body as string);

    expect(body.event_name).toBe('contact_form_submitted');
    // Determinisztikus napi id → dupla cron-futást a gateway idempotencia elnyeli.
    expect(body.event_id).toMatch(/^smoke-.+-\d{8}$/);
    expect(body.lead_id).toBe(body.event_id);
    expect(body.source).toBe('daily_smoke');
    expect(body.test_event_code).toBe('TEST_SITE'); // PROD-stream védelem
    expect(body.user_data.email).toBe('gateway-smoke-test@soborbo.co.uk');
    expect(body.consent.ad_storage).toBe('GRANTED');
    expect(body.consent.analytics_storage).toBe('GRANTED');
    expect(body.event_source_url).toBe('https://lomtalan.hu/__smoke');

    expect(logSpy).toHaveBeenCalledOnce();
    expect(String(logSpy.mock.calls[0][0])).toContain('dispatched');
  });

  it('a rejected dispatch logs a structured FAILED error (the digest-visible trail)', async () => {
    const bindingFetch = vi.fn(() => Promise.resolve(new Response('{}', { status: 401 })));
    await runDailySmokeLead(envWith({ GATEWAY: { fetch: bindingFetch } }));
    expect(errSpy).toHaveBeenCalledOnce();
    const line = String(errSpy.mock.calls[0][0]);
    expect(line).toContain('FAILED');
    expect(line).toContain('gateway_rejected_401');
  });
});

describe('degraded environments', () => {
  it('markers present but gateway unconfigured (no SITE_URL) → structured FAILED log, no crash', async () => {
    await runDailySmokeLead(envWith({ SITE_URL: undefined, GATEWAY: undefined }));
    expect(errSpy).toHaveBeenCalledOnce();
    const line = String(errSpy.mock.calls[0][0]);
    expect(line).toContain('FAILED');
    expect(line).toContain('gateway_not_configured');
  });
});
