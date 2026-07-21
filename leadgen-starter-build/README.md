# leadgen-starter — tracking & lead delivery

How a form submission turns into a stored lead **and** a deduplicated ad
conversion. Read this before wiring a new site's tracking.

## The two legs

A conversion has one shared `event_id`. It travels two ways:

```
                       ┌─ browser leg (metadata only) ─────────────────────────┐
form submit ──▶ /api/contact ──▶ backend validates, saves, forwards to CRM      │
                       │            │                                            │
                       │            └─ 200 { success, redirect, eventId, leadId }│
                       │                                                         ▼
                       │                                    dataLayer.push({ event, event_id })
                       │                                    (GTM → Pixel/GA4) — NO PII, ever
                       │
                       └─ server leg (matching) ───────────────────────────────┐
                                    │                                           │
              /api/webhooks/contact (signed) ──▶ CRM stores lead               │
                                    │              + writes initial_conversion  │
                                    │                outbox row (F3-C)          │
                                    ▼                                           │
                          CRM cron dispatch ──▶ event-gateway /conversion-server ─▶ Meta CAPI
```

- **Browser leg** (`src/lib/tracking/events.ts`): pushes **event metadata only**
  to the dataLayer — never PII, not even hashed (CLAUDE.md §15). It fires
  **only after** the backend confirms a real, saved, non-spam submission, using
  the `eventId` the server returns, so the Pixel event and the server CAPI event
  deduplicate.
- **Server leg** (`src/lib/forms/crm.ts`): signs and POSTs the lead to the CRM
  signed `contact` webhook. The CRM stores it and — because we pass the shared
  `event_id` — writes an `initial_conversion` row into its durable outbox, which
  the CRM cron delivers to the event-gateway (retried, off the request path).
  The starter never talks to the gateway directly.

Best-effort: an unconfigured or unreachable CRM **never fails a submission** —
the notification email is the fallback record of the lead.

## Consent

Ad tracking is gated on real consent, fail-closed:

```
CookieYes `marketing` ──▶ hidden `marketing_consent` field (set at submit)
   ──▶ crm.ts consent.marketing ──▶ CRM adAllowed ──▶ gateway
```

The privacy-policy checkbox is `consent.gdpr` (lawful basis to process the
lead); it does **not** imply ad consent. Without the CookieYes `marketing`
category the initial ad conversion is skipped.

## Wiring a new site

The server leg stays **dormant** until configured (submissions still work; only
the CRM/ad leg is off).

1. **CRM tenant.** The site delivers to a CRM deployment (its own D1 + Worker).
   Set its `SIGNED_WEBHOOK_SECRET`.
2. **Enable the module.** The signed webhook is gated behind the
   `painless_webhooks` module. Set it to `enabled` for that tenant
   (`module_settings`, via the CRM admin `POST /api/settings/modules`). Seeded
   `disabled` by default → until enabled the CRM returns 404 and no lead lands.
3. **KV namespace.** `wrangler kv namespace create RATE_LIMIT_KV` and paste the
   id into `wrangler.jsonc` (rate-limit + form dedupe store).
4. **Site config** — non-secret vars in `wrangler.jsonc`, secrets via
   `wrangler secret put`:

   | name | kind | purpose |
   |---|---|---|
   | `CRM_BASE_URL` | var | the CRM tenant base URL |
   | `CRM_COMPANY_ID` | var | tenant label (accepted, not authoritative) |
   | `CRM_WEBHOOK_SOURCE` | var | envelope `source` (default `website`) |
   | `CRM_WEBHOOK_SECRET` | secret | = the CRM tenant `SIGNED_WEBHOOK_SECRET` |
   | `RESEND_API_KEY` / `BREVO_API_KEY` | secret | transactional email |
   | `TURNSTILE_SECRET_KEY` | secret | form anti-spam (optional) |
   | `GOOGLE_SERVICE_ACCOUNT_EMAIL` / `GOOGLE_PRIVATE_KEY` / `GOOGLE_SHEET_ID` | secret | Sheets backup (optional) |

   See `.env.example` for the full list.

## The signed webhook contract

Mirror of the CRM verifier (`soborbo-crm` `signed/verify.ts`) and the painless
`signer.ts`. Do not drift from it — the CRM re-implements the exact same base.

- Signature base: `` `${timestamp}.${version}.${rawBody}` `` → HMAC-SHA256,
  lowercase hex, header prefixed `sha256=`.
- Headers: `x-webhook-signature`, `x-webhook-timestamp` (unix **seconds**),
  `x-webhook-version` (`1.0`).
- Serialize the envelope **once**; sign that exact string; send that string.
  Re-sign on every retry (fresh timestamp; the body — and thus `event_id` — is
  byte-identical, which is what makes redelivery idempotent).
- `contact` surface envelope: `{ event_id, source, company_id, customer:{
  full_name, email, phone, postcode? }, message?, attribution?, consent:{ gdpr,
  marketing } }`.
- Response `200 { ok, lead_id, duplicate, attached }`; `400`/`401` = do not retry
  (except `401` stale timestamp → re-sign + retry); `5xx`/network → retry.

## Tests

```
npm test          # vitest run — signer parity, retry/stale/leadId, dataLayer guards
```

The signer test cross-checks the HMAC against `node:crypto` over the CRM
canonical base, so a drift in either implementation fails loudly.
