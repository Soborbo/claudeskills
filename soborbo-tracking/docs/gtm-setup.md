# GTM Setup

> For GA4 event names, **`CANONICAL-EVENTS.md`** is authoritative. The GTM tag emits
> the **canonical GA4 event name** (e.g. `contact_form_submitted`) from the browser
> dataLayer event (e.g. `quote_calculator_submitted`) — so the browser and (optionally) the gateway
> GA4 MP produce the SAME GA4 event. **GA4 does not dedup** → if you also use the
> gateway GA4 MP, don't fire twice (see CANONICAL-EVENTS.md "GA4 double-counting").

## Variables (Data Layer)

DLV: `event_id`, `value`, `currency`, `step_id`, `step_index`,
`calculator_name`, `scroll_percentage`, `session_id`, `device`, `form_id`,
`last_field`, `first_utm_source`, `first_utm_medium`, `last_utm_source`,
`last_utm_medium`.

> **No PII in the dataLayer.** Raw email/phone are deliberately NOT pushed to the
> dataLayer (GDPR / security — everything in the dataLayer is readable by every tag
> and any page script). `events.ts` writes the normalized user data to a hidden
> side-channel instead (`window.__sbUserData` + `#__sb_user_data__`), gated on
> marketing consent. The User-Provided Data variable below reads from THERE.

### User-Provided Data Variable (Google Ads Enhanced Conversions)

Use a **Custom JavaScript** variable that reads the side-channel (NOT a Data Layer
Variable). Name it `CJS - User Provided Data`:
```js
function () {
  try {
    // Written by setUserDataForEC() — keys: email, phone_number, first_name, last_name.
    return window.__sbUserData || {};
  } catch (e) {
    return {};
  }
}
```
Then in the Google Ads / GA4 tags set **User-Provided Data → Manual → Variable** to
`{{CJS - User Provided Data}}` (it already has `email` / `phone_number` /
`first_name` / `last_name` keys in the shape Google expects). The Custom JS variable
runs in the tag's context, so the PII never enters the dataLayer.

## Triggers (Custom Event)
One each for the dataLayer events: `quote_calculator_opened`, `quote_calculator_step_completed`,
`quote_calculator_option_selected`, `quote_calculator_submitted`, `quote_calculator_submitted`, `contact_form_submitted`,
`phone_number_clicked`, `callback_request_submitted`, `email_address_clicked`, `whatsapp_button_clicked`, `form_abandoned`,
`scroll_depth`.

## Tags — base
- **Consent Default** (Custom HTML, Consent Initialization) — CookieYes handles the update.
- **Conversion Linker** — ad_storage, Initialization. Without it, Google Ads does not
  attribute (gclid → _gcl_aw).
- **Google Tag (GA4)** — G-XXXXXXXXXX, analytics_storage, All Pages.

## GA4 Event tags — with the CANONICAL event name

| dataLayer trigger (CE) | **GA4 event name (emitted by the tag)** | Key Event? | Parameters |
|---|---|:--:|---|
| `quote_calculator_submitted` / `contact_form_submitted` | `contact_form_submitted` | ✅ | value, currency, event_id, session_id, device, source, service |
| `callback_request_submitted` | `callback_request_submitted` | ✅ | event_id, session_id, device |
| `phone_number_clicked` | `phone_number_clicked` | ✅ | event_id, session_id, device |
| `email_address_clicked` | `email_address_clicked` | ✅ | event_id, session_id |
| `whatsapp_button_clicked` | `whatsapp_button_clicked` | ✅ | event_id, session_id |
| `quote_calculator_submitted` | `quote_calculator_submitted` | ✅ | value, currency, event_id, calculator_name |
| `quote_calculator_opened/step/option` | `quote_calculator_opened` / `_step` / `_option` | ❌ | calculator_name, step_id, step_index |
| `form_abandoned` | `form_abandoned` | ❌ | form_id, last_field |
| `scroll_depth` | `scroll_depth` | ❌ | scroll_percentage |

> The "GA4 event name" column = the table in `CANONICAL-EVENTS.md`. (If you want to use
> a GA4 recommended name, e.g. `generate_lead`, then you must send that name on the
> gateway side too — otherwise the browser and server MP show up under different names.)

## Meta Pixel tags
- **Base** (Custom HTML): fbevents.js + `fbq('track','PageView')`. ad_storage + ad_user_data. All Pages.
- **Lead** (CE-`quote_calculator_submitted` / `callback_request_submitted` / `quote_calculator_submitted`):
  ```js
  var v = {{DLV - value}};
  var cd = (typeof v === 'number' && v > 0) ? { value: v, currency: '{{DLV - currency}}' } : {};
  fbq('track', 'Lead', cd, { eventID: '{{DLV - event_id}}' });
  ```
- **Contact** (CE-`contact_form_submitted` / `phone_number_clicked` / `email_address_clicked` / `whatsapp_button_clicked`):
  ```js
  fbq('track', 'Contact', {}, { eventID: '{{DLV - event_id}}' });
  ```
The `eventID` MUST match the server CAPI `event_id` (the gateway gets the same one
from index.ts) → Meta Pixel↔CAPI dedup.

## Google Ads Conversion tag
Conversion Value: {{DLV - value}}. Transaction ID: {{DLV - event_id}}.
User-provided data: {{CJS - User Provided Data}}. ad_storage + ad_user_data.
Trigger: the conversion CEs (quote_calculator_submitted/callback_request_submitted/phone_number_clicked/quote_calculator_submitted).
**Don't set a fixed value default of 1+currency** — it poisons the bidding (see INVARIANTS).

## Enhanced Conversions
Google Ads → Tools → Conversions → Enhanced Conversions: ON → Method: GTM.
Check Diagnostics after 24-48h. (Server-side, the gateway also uploads the hashed
user_data + gclid separately — they complement each other, dedup on orderId/event_id.)

## Validation
GTM Preview + GA4 DebugView (+ campaign_details if UTM) + Meta Test Events (dedup on
the same event_id). See `CANONICAL-EVENTS.md` GA4 admin tasks (Key Events + custom dimensions).
