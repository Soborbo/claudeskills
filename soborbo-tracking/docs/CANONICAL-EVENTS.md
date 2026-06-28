# Canonical event map (source of truth for names)

This file is **authoritative** for browser event names in this skill. The deeper
source of truth is the engine's `events.json` (vendored at `../events.json`); the
generators read it and `server/check-event-contract.mjs` guards drift. (`EVENTS.md`
is the funnel-adaptation guide; in a name conflict THIS file wins.)

**One canonical name per event, across all layers** — the browser dataLayer event,
the GA4 event name, and the gateway `event_name` are now the SAME string. The old
`lead_submit`(dataLayer)→`contact_form_submit`(GA4) duality is gone.

## The two channels and GA4 double-counting (Model 2)

- **Meta** deduplicates by `event_id` (browser Pixel ↔ server CAPI) → fire on both.
- **GA4 does NOT deduplicate** → on-site GA4 is **browser-only** (the GTM Google tag).
  The gateway sends GA4 MP **only offline** (CRM lead-status augment), never on-site.
- **Google Ads** on-site is **browser-only** too (AWCT + Enhanced Conversions). The
  server sends Google Ads **only offline** (Enhanced Conversions for Leads via the
  Data Manager API). This is **Model 2** — it kills the GA4/Ads on-site double-count
  and the fragile conversion-action matching.
- **TikTok / LinkedIn / Microsoft** server forwarders stay on-site (event_id dedup,
  like Meta) when a click ID is present.

## Canonical conversion table

One name flows through `events.ts` (dataLayer) → GTM trigger → GA4 event → gateway.

| Conversion | Canonical event name | Meta | GA4 Key Event? |
|---|---|---|:--:|
| Quote / lead form (the calculator IS the ajánlatkérő) | `quote_calculator_submitted` | **Lead** | ✅ |
| Contact form | `contact_form_submitted` | Contact | ✅ |
| Callback request | `callback_request_submitted` | **Lead** | ✅ |
| Phone click (`tel:`) | `phone_number_clicked` | Contact | ✅ |
| Email click (`mailto:`) | `email_address_clicked` | Contact | ✅ |
| WhatsApp click | `whatsapp_button_clicked` | Contact | ✅ |

> **§2.1 change:** the lead/quote form now fires **Meta Lead** (was Contact). The
> calculator completion and the lead-form submit share `quote_calculator_submitted`
> — wire ONE of them as your quote conversion per site (the conversion-grade emission
> with `event_id` + value + PII side-channel + gateway comes from `trackLeadSubmit`
> / `trackServerEvent`; `trackCalculatorComplete` is the funnel signal that shares
> the name).

## Engagement (NOT a conversion, NOT a Key Event)

| Canonical event name | Purpose | Meta |
|---|---|---|
| `quote_calculator_opened` | calculator opened / started | ViewContent |
| `quote_calculator_step_completed` | step finished (`step_index`) | — |
| `quote_calculator_option_selected` | option chosen | — |
| `form_abandoned` | form abandonment (`form_id`) | — |
| `scroll_depth` (25/50/75/100) | scroll milestone (≠ GA4 reserved `scroll`) | — |

## Offline (server-only, CRM `/api/event/lead-status`)

`lead_validated`, `lead_qualified`, `quote_sent`, `booking_confirmed`,
`job_completed`, `revenue_confirmed`, `lead_disqualified`. Uploaded to Google Ads
(Data Manager API) + GA4 MP (offline augment). The bid-optimization target is
`lead_qualified` (a real lead), not the raw click.

## GA4 admin tasks (once per property)

1. **Key Events (Admin → Events → Mark as key event):**
   `quote_calculator_submitted`, `contact_form_submitted`, `callback_request_submitted`,
   `phone_number_clicked`, `email_address_clicked`, `whatsapp_button_clicked`.
2. **Custom dimensions (event-scoped):** `event_id`, `session_id`, `source`, `service`,
   `device`, `calculator_name`, `step_id`, `lead_provenance`. (Campaign params flow
   natively with the `campaign_details` event.)
3. **Measurement check:** GA4 DebugView + Meta Test Events + GTM Preview.

## Adding a new conversion
1. Add it to the engine `events.json` (canonical source) and re-vendor.
2. In `events.ts`, push the canonical dataLayer event (without PII).
3. GTM: Custom Event trigger + GA4 tag (same canonical name) + optionally a Meta
   Pixel tag (`eventID` = DLV event_id) + Google Ads tag (browser owns on-site Ads).
4. Gateway: `events.json` already drives `ALLOWED_EVENT_NAMES` + `EVENT_NAME_MAP`;
   add the offline Google Ads action ID in the site KV `conversion_actions`.
5. GA4: mark as Key Event + register custom dimension as needed.
