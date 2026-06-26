# GTM Setup

> A GA4 event-nevekre a **`CANONICAL-EVENTS.md`** a mérvadó. A GTM-tag a böngésző
> dataLayer-eseményről (pl. `lead_submit`) a **kanonikus GA4 event-nevet** emittálja
> (pl. `contact_form_submit`) — így a böngésző és (opcionálisan) a gateway GA4 MP
> UGYANAZT a GA4 eventet adja. **GA4 nem dedupol** → ha a gateway GA4 MP-t is
> használod, ne tüzelj duplán (lásd CANONICAL-EVENTS.md „GA4-duplázás").

## Variables (Data Layer)

DLV: `event_id`, `user_provided_data`, `value`, `currency`, `step_id`, `step_index`,
`calculator_name`, `scroll_percentage`, `session_id`, `device`, `form_id`,
`last_field`, `first_utm_source`, `first_utm_medium`, `last_utm_source`,
`last_utm_medium`.

### User-Provided Data Variable (Google Ads Enhanced Conversions)
```
Type: User-Provided Data → Manual
Email: {{DLV - user_provided_data}}.email
Phone: {{DLV - user_provided_data}}.phone_number
Name:  UPD - User Data
```

## Triggers (Custom Event)
Egy-egy a dataLayer-eseményekre: `calculator_start`, `calculator_step`,
`calculator_option`, `calculator_complete`, `lead_submit`, `contact_submit`,
`phone_click`, `callback_click`, `email_click`, `whatsapp_click`, `form_abandon`,
`scroll_depth`.

## Tags — alap
- **Consent Default** (Custom HTML, Consent Initialization) — CookieYes kezeli az update-et.
- **Conversion Linker** — ad_storage, Initialization. Enélkül a Google Ads nem
  attribútál (gclid → _gcl_aw).
- **Google Tag (GA4)** — G-XXXXXXXXXX, analytics_storage, All Pages.

## GA4 Event tag-ek — a KANONIKUS event-névvel

| dataLayer trigger (CE) | **GA4 event-név (a tag emittálja)** | Key Event? | Paraméterek |
|---|---|:--:|---|
| `lead_submit` / `contact_submit` | `contact_form_submit` | ✅ | value, currency, event_id, session_id, device, source, service |
| `callback_click` | `callback_conversion` | ✅ | event_id, session_id, device |
| `phone_click` | `phone_conversion` | ✅ | event_id, session_id, device |
| `email_click` | `email_conversion` | ✅ | event_id, session_id |
| `whatsapp_click` | `whatsapp_conversion` | ✅ | event_id, session_id |
| `calculator_complete` | `quote_calculator_conversion` | ✅ | value, currency, event_id, calculator_name |
| `calculator_start/step/option` | `calculator_start` / `_step` / `_option` | ❌ | calculator_name, step_id, step_index |
| `form_abandon` | `form_abandon` | ❌ | form_id, last_field |
| `scroll_depth` | `scroll_depth` | ❌ | scroll_percentage |

> A „GA4 event-név" oszlop = a `CANONICAL-EVENTS.md` táblázata. (Ha GA4 ajánlott
> nevet akarsz használni, pl. `generate_lead`, akkor a gateway oldalon is azt a
> nevet kell küldeni — különben a böngésző és a szerver MP eltérő néven jelenik meg.)

## Meta Pixel tag-ek
- **Base** (Custom HTML): fbevents.js + `fbq('track','PageView')`. ad_storage + ad_user_data. All Pages.
- **Lead** (CE-`lead_submit` / `callback_click` / `calculator_complete`):
  ```js
  var v = {{DLV - value}};
  var cd = (typeof v === 'number' && v > 0) ? { value: v, currency: '{{DLV - currency}}' } : {};
  fbq('track', 'Lead', cd, { eventID: '{{DLV - event_id}}' });
  ```
- **Contact** (CE-`contact_submit` / `phone_click` / `email_click` / `whatsapp_click`):
  ```js
  fbq('track', 'Contact', {}, { eventID: '{{DLV - event_id}}' });
  ```
A `eventID` KÖTELEZŐEN egyezik a szerver CAPI `event_id`-vel (a gateway ugyanazt
kapja az index.ts-ből) → Meta Pixel↔CAPI dedup.

## Google Ads Conversion tag
Conversion Value: {{DLV - value}}. Transaction ID: {{DLV - event_id}}.
User-provided data: {{UPD - User Data}}. ad_storage + ad_user_data.
Trigger: a konverziós CE-k (lead_submit/callback_click/phone_click/calculator_complete).
**Ne tegyél fix value default-ot 1+devizát** — fertőzi a biddinget (lásd INVARIANTS).

## Enhanced Conversions
Google Ads → Tools → Conversions → Enhanced Conversions: ON → Method: GTM.
Diagnostics ellenőrzés 24-48h múlva. (Szerver-oldalon a gateway külön is feltölti
a hashelt user_data-t + gclid-et — kiegészítik egymást, dedup orderId/event_id-n.)

## Validáció
GTM Preview + GA4 DebugView (+ campaign_details ha UTM) + Meta Test Events (dedup
azonos event_id). Lásd `CANONICAL-EVENTS.md` GA4-admin teendők (Key Events + custom dimensions).
