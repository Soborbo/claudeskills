# Backend dispatch — the server leg of high-value conversions

The gateway rejects `server_ingress_only` events on the browser path (403,
TRK-400-017): `quote_calculator_submitted`, `callback_request_submitted`,
`contact_form_submitted`, `order_request_submitted`, `purchase`. Their gateway
leg is sent by the **site backend** — the API route that receives the form POST —
using the modules in this directory:

| file | copy to | what it is |
|---|---|---|
| `gateway-dispatch.ts` | `src/lib/tracking/gateway-dispatch.ts` | authenticated server-to-server dispatch (service binding + per-site token) |
| `smoke.ts` | `src/lib/tracking/smoke.ts` | daily synthetic-lead cron body (set `SITE`) |
| `worker.ts` | `src/worker.ts` | custom Worker entry exporting `scheduled()` |

These are verbatim from the production sites (lomtalan.hu, painlessremovals.com,
beautyflow.hu) — do not "simplify" them; every odd-looking line is a fixed incident.

## Wiring checklist (per site)

1. **Service binding** in the site's wrangler config (fetch to your own zone is
   short-circuited by Cloudflare loop protection — a plain fetch never arrives):
   ```toml
   [[services]]
   binding = "GATEWAY"
   service = "event-gateway"
   ```
2. **Per-site token**: `generate-site.mjs` puts `crm_token_sha256` into the KV
   site-config and the plaintext into `crm-secret.env`. Set the plaintext as the
   site worker's `TRACKING_GATEWAY_TOKEN` secret.
3. **Smoke cron**: `main = "./src/worker.ts"`, `[triggers] crons = ["43 4 * * *"]`,
   `TRACKING_TEST_LEAD_EMAIL` + `TRACKING_TEST_EVENT_CODE` vars, and add the
   `site_id` to the gateway's `SMOKE_SITES` var.

## The API-route pattern (contact/lead form)

```ts
// src/pages/api/contact.ts (Astro API route) — the shape that runs in production
import type { APIRoute } from 'astro';
import { sendGatewayConversion, readConsentFromCookie } from '../../lib/tracking/gateway-dispatch';

export const POST: APIRoute = async ({ request, locals }) => {
  const env = locals.runtime.env;
  const form = await request.formData();

  // 1) BOT GUARD FIRST. Honeypot filled or submitted faster than a human types →
  //    fake-succeed to the bot, but mark it silent and SKIP ALL TRACKING. A bot
  //    "lead" that books a Meta conversion poisons optimization.
  if (String(form.get('website') || '') !== '' /* honeypot */) {
    return Response.json({ success: true }); // silent drop — no CRM, no tracking
  }

  // 2) Forward the lead to the CRM. The CRM webhook RESPONSE carries the CRM's
  //    own record id — that, and ONLY that, is the gateway `lead_id`. If the CRM
  //    call failed or returned no id, send the conversion WITHOUT lead_id.
  const crm = await forwardToCrm(env, form);          // -> { success, id? }
  const leadId = crm.success && crm.id ? String(crm.id) : undefined;

  // 3) Dispatch the gateway conversion — REUSING the browser's event_id from the
  //    hidden field (populateHiddenFields wrote it). Fresh id = double-counted lead.
  const eventId = String(form.get('event_id') || '') || crypto.randomUUID();
  const result = await sendGatewayConversion(env, {
    eventName: 'contact_form_submitted',
    eventId,
    leadId,
    userData: {
      email: String(form.get('email') || '') || undefined,
      phone_number: String(form.get('phone') || '') || undefined,
    },
    attribution: {
      gclid: String(form.get('gclid') || '') || undefined,
      fbclid: String(form.get('fbclid') || '') || undefined,
      utm_source: String(form.get('utm_source') || '') || undefined,
      utm_medium: String(form.get('utm_medium') || '') || undefined,
      utm_campaign: String(form.get('utm_campaign') || '') || undefined,
    },
    // Same CookieYes cookie the browser reads → the two legs cannot disagree.
    consent: readConsentFromCookie(request.headers.get('cookie')),
    eventSourceUrl: request.headers.get('referer') || undefined,
    // The REAL visitor's IP/UA — not the Worker's egress.
    clientIpAddress: request.headers.get('cf-connecting-ip') || undefined,
    clientUserAgent: request.headers.get('user-agent') || undefined,
  });

  // 4) The lead flow NEVER fails because tracking failed. Log and move on.
  if (!result.ok) {
    console.error(JSON.stringify({ level: 'error', message: 'gateway dispatch failed',
      event_id: eventId, status: result.status, error: result.error }));
  }

  return Response.json({ success: true });
};
```

## What NOT to do (each of these is a past incident)

- **Do not** dispatch these events from the browser lib — the gateway 403s them
  and the loss is silent until the volume audit.
- **Do not** put `lead_id: eventId` (or any site-minted value) — a joinable-looking
  but unjoinable lead_id is worse than NULL.
- **Do not** treat a gateway 400/401/403/404 as retriable — it's your config.
- **Do not** put a Meta `test_event_code` in the gateway KV site-config — the
  edge cache (300s) has twice routed real production conversions into Meta's Test
  stream. The ONLY sanctioned mechanism is the per-request code keyed on
  `TRACKING_TEST_LEAD_EMAIL` (see `resolveTestEventCode`).
- **Do not** test with a live browser pixel — synthetic proof goes through the
  authenticated server ingress with the per-request test code (the smoke cron is
  exactly that).
