# Event taxonomy guide (v5)

> **`CANONICAL-EVENTS.md` is authoritative for event names** (the canonical
> browser↔GA4↔gateway↔Meta/Ads map, GA4 Key Events, custom dimensions, and the
> GA4 double-counting rule). This file is the **funnel-adaptation guide**: how to
> reshape the default lead-gen taxonomy for other funnels (e-commerce / SaaS /
> newsletter). When a name conflicts, CANONICAL-EVENTS.md wins.

The default taxonomy targets a **lead-generation funnel**. Conversions fire
**immediately** and dedup at the platform via the shared `event_id` (browser
Pixel ↔ server CAPI). There is no "upgrade window" / conversion-state machine in
v5 — that legacy machinery was removed.

## Two channels (recap)

- **Browser**: `events.ts` does `push({ event: 'X', ... })` → GTM → GA4 / Meta
  Pixel / Google Ads. Names: `lead_submit`, `contact_submit`, `phone_click`,
  `callback_click`, `email_click`, `whatsapp_click`, `calculator_*`,
  `form_abandon`, `scroll_depth`.
- **Server**: the conversion functions in `index.ts`
  (`trackLeadSubmit` / `trackPhoneConversion` / …) POST to the event-gateway
  worker with the SAME `event_id`. The gateway `event_name` must be in the
  worker's allowed set (`ALLOWED_EVENT_NAMES` + `EVENT_NAME_MAP`, in
  `Soborbo/Serverside`): `contact_form_submit`, `quote_calculator_conversion`,
  `callback_conversion`, `phone_conversion`, `email_conversion`,
  `whatsapp_conversion`, `quote_calculator_first_view`, `video_play`.

## Naming convention

- `snake_case`. GA4 lowercases everything anyway.
- Verb at the end for actions (`form_start`, `quote_complete`).
- Past tense for completions (`signup_completed`, not `signup_completing`).
- Keep names stable once events have fired for >1 week — renaming re-segments
  your historical data.
- **Never put raw PII in an event payload.** Conversion PII goes through
  `setUserDataForEC()` to the hidden side-channel, never a dataLayer push.

## Adapting to your funnel

### Lead-gen with calculator (moving quotes, insurance, loans)

Keep the default taxonomy. The calculator-complete browser event
(`calculator_complete`) maps to GA4 `quote_calculator_conversion` and gateway
`quote_calculator_conversion`. To rename for clarity in GA4, change the GA4 event
name in the GTM tag AND the gateway `event_name` together (so browser and server
report under the same name) — see CANONICAL-EVENTS.md "Adding a new conversion".

### E-commerce checkout

Replace the conversion events with the GA4 standard e-commerce names (they
auto-populate the e-commerce reports — use them verbatim):

| Browser event | When | GA4 / Meta |
| --- | --- | --- |
| `view_item` | Product page view | GA4 + Meta `ViewContent` |
| `add_to_cart` | Add-to-cart click | GA4 + Meta `AddToCart` |
| `begin_checkout` | Checkout start | GA4 + Meta `InitiateCheckout` |
| `purchase` | Order confirmation | GA4 + Google Ads + Meta `Purchase` |

For each one that should run server-side too, add it to the gateway's
`ALLOWED_EVENT_NAMES` + `EVENT_NAME_MAP` (Meta name) in `Soborbo/Serverside`.

### SaaS signup with free trial

Add `trial_started` / `paid_upgrade` browser events and corresponding gateway
names. Fire each as a direct conversion (no window). `value` is event-type aware —
send real value on the upgrade, omit it on the free trial start.

### Content site with newsletter signups

Keep `calculator_*` off; keep `form_abandon` / `scroll_depth`. Add a
`newsletter_subscribe` browser event (direct conversion). Drop `phone_click` /
`email_click` / `whatsapp_click` bindings if you don't surface those channels.

## Adding a new event

Three sides: code, GTM container, platforms.

### 1. Code

Push the browser event without PII (mirror the existing helpers in `events.ts`):

```ts
push({ event: 'your_new_event', event_id: eventId, value: 42, currency: 'EUR',
       session_id: getSessionId() });
```

For a server-side mirror, dispatch through the gateway with the same `event_id`
via `trackServerEvent('your_gateway_event', { eventId, value, currency, email, phone })`
(or add a dedicated wrapper in `index.ts`). The gateway hashes PII and adds
attribution/consent/Turnstile.

### 2. GTM container

- Add a **Custom Event** trigger with the exact dataLayer name.
- Add at least one **tag**: GA4 Event tag (canonical GA4 name + params),
  optional Google Ads Conversion tag, optional Meta Pixel tag (`eventID` =
  `{{DLV - event_id}}` for CAPI dedup).
- Add a **Data Layer Variable** for any new non-PII param.
- Re-run `npm run check:events` (code ↔ docs ↔ container must stay in sync).

### 3. Platforms

- **GA4**: register new event-scoped params (Admin → Custom Definitions); mark as
  Key Event if it's a conversion.
- **Google Ads**: add the conversion action + its ID in the site KV
  `conversion_actions`.
- **Meta**: extend `EVENT_NAME_MAP` in the gateway so CAPI accepts/maps it.

Validate with GTM Preview + GA4 DebugView + Meta Test Events before production.

## Renaming or removing an event

Renaming breaks historical attribution. Prefer "deprecate, then add":

1. Add the new name; fire both old and new for ~30 days.
2. Mirror the new event in GTM / GA4 / Ads / Meta side-by-side.
3. Cut reports over to the new event.
4. Stop firing the old event; leave its GTM trigger **paused** for another 30
   days (cached GTM libraries on user devices keep firing it for hours after
   publish).

For pure removal: stop the `push(...)` in code first, then delete the trigger +
tags in a follow-up — never same-day.
