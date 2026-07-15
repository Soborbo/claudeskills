/**
 * Daily synthetic-lead smoke test — proves the WHOLE server chain without a human:
 * site worker cron → service binding → gateway authenticated ingress
 * (/api/event/conversion-server) → hash → Meta CAPI (TEST stream) → D1 ledger.
 *
 * Copy into `src/lib/tracking/smoke.ts`, set SITE to the gateway `site_id`, and
 * export a `scheduled()` from the worker entry (see worker.ts next to this file).
 * Then register the site in the gateway's `SMOKE_SITES` var — the gateway's daily
 * digest alarms when an expected site has no fresh `smoke-*` ledger row, or when
 * Meta REJECTED the smoke event. That closes the loop: a dead cron, a broken
 * token, a wiped var, a Meta credential expiry — all surface within 24h.
 *
 * Safety guarantees:
 *  - REFUSES to run unless TRACKING_TEST_LEAD_EMAIL + TRACKING_TEST_EVENT_CODE are
 *    configured and resolvable — otherwise the synthetic event would land in the
 *    PRODUCTION Meta stream (the class of two past production Meta leaks). No
 *    code, no send: the skip is LOUD (console.error) and the digest's missing-row
 *    alarm still fires, so a misconfigured smoke cannot rot silently.
 *  - Deterministic daily event_id (`smoke-<site>-YYYYMMDD`): a double-fired cron
 *    is absorbed by the gateway's idempotency — no duplicate event.
 *  - lead_id reuses the smoke key → the ledger's lead-trail path is exercised,
 *    and smoke rows filter out of any audit via the `smoke-` prefix.
 */
import {
  sendGatewayConversion,
  resolveTestEventCode,
  type GatewayEnv,
} from './gateway-dispatch';

// The gateway `site_id` for this site (KV site-config). MUST match what the
// digest expects in SMOKE_SITES.
const SITE = 'REPLACE_ME_SITE_ID';

export async function runDailySmokeLead(env: GatewayEnv): Promise<void> {
  const email = env.TRACKING_TEST_LEAD_EMAIL;
  const testEventCode = resolveTestEventCode(env, email);
  if (!email || !testEventCode) {
    console.error(
      '[smoke] skipped — TRACKING_TEST_LEAD_EMAIL / TRACKING_TEST_EVENT_CODE not configured; ' +
        'refusing to send a synthetic event that would land in the PRODUCTION Meta stream',
    );
    return;
  }

  const day = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const eventId = `smoke-${SITE}-${day}`;

  const res = await sendGatewayConversion(env, {
    eventName: 'contact_form_submitted',
    eventId,
    leadId: eventId,
    source: 'daily_smoke',
    // Synthetic test persona (the keyed test address) — not real PII.
    userData: { email },
    // Explicit GRANTED: the gateway's require_consent gate would otherwise skip
    // the Meta leg and the smoke test would prove nothing.
    consent: {
      ad_user_data: 'GRANTED',
      ad_personalization: 'GRANTED',
      ad_storage: 'GRANTED',
      analytics_storage: 'GRANTED',
    },
    eventSourceUrl: `${env.SITE_URL || 'https://example.com'}/__smoke`,
    testEventCode,
  });

  if (res.ok) {
    console.log(JSON.stringify({ level: 'info', message: '[smoke] daily synthetic lead dispatched', event_id: eventId, status: res.status }));
  } else {
    console.error(JSON.stringify({ level: 'error', message: '[smoke] daily synthetic lead FAILED', event_id: eventId, status: res.status, error: res.error, attempts: res.attempts }));
  }
}
