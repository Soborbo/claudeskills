# Canonical event map (source of truth for names)

This file is **authoritative** for event names in this skill. (`EVENTS.md` is the
funnel-adaptation guide; in case of a name conflict, THIS file wins.)

## The two channels and the GA4 double-counting (IMPORTANT)

- **Meta** deduplicates by `event_id` (browser Pixel ↔ server CAPI) → it can safely
  fire on both channels.
- **GA4 does NOT deduplicate.** If the browser GTM GA4 tag AND the gateway GA4 MP both
  fire for the same event → it **double-counts**. So for GA4, pick **one channel**:
  - **Default (recommended): GA4 = browser (GTM)**, with the gateway GA4 MP **skipped**.
    How: in the site KV config **omit the `ga4` block** → the gateway does not send
    GA4 MP. This way Meta CAPI + Google Ads run server-side, while GA4 stays browser-side.
  - **Or: GA4 = server MP backstop** (for adblock/JS-blocked users), in which case
    the browser GA4 tag must be handled carefully. Only do this if you deliberately
    accept the overlap. For most lead-gen sites the default is the right choice.

## Canonical conversion table

| Conversion | Browser dataLayer (events.ts) | **GA4 event name** (emitted by GTM tag) | Gateway `event_name` | Meta | Google Ads (conversion_actions key) | GA4 Key Event? |
|---|---|---|---|---|---|:--:|
| Quote/lead form | `lead_submit` | `contact_form_submit` | `contact_form_submit` | Contact | `contact_form_submit` | ✅ |
| Contact form | `contact_submit` | `contact_form_submit` | `contact_form_submit` | Contact | `contact_form_submit` | ✅ |
| Callback | `callback_click` | `callback_conversion` | `callback_conversion` | Lead | `callback_conversion` | ✅ |
| Phone click | `phone_click` | `phone_conversion` | `phone_conversion` | Contact | `phone_conversion` | ✅ |
| Email click | `email_click` | `email_conversion` | `email_conversion` | Contact | — | ✅ |
| WhatsApp click | `whatsapp_click` | `whatsapp_conversion` | `whatsapp_conversion` | Contact | — | ✅ |
| Calculator complete (quote) | `calculator_complete` | `quote_calculator_conversion` | `quote_calculator_conversion` | Lead | `quote_calculator_conversion` | ✅ |
| Calculator first view | — | `quote_calculator_first_view` | `quote_calculator_first_view` | ViewContent | — | ❌ |

**The "GA4 event name" column is the key:** in GTM the browser tag emits THIS name
(e.g. the GA4 tag firing on the `lead_submit` dataLayer event has GA4 event name
`contact_form_submit`). If you also use the gateway GA4 MP, it sends the SAME name —
so reporting stays unified (but see the double-counting warning above).

## Engagement (NOT a conversion, does NOT go to the gateway, NOT a Key Event)

| dataLayer event | Purpose | GA4 |
|---|---|---|
| `calculator_start` / `calculator_step` / `calculator_option` | funnel | regular event |
| `form_abandon` | form abandonment | regular event |
| `scroll_depth` (25/50/75/100) | scroll | regular event |

## GA4 admin tasks (once per property)

1. **Key Events (Admin → Events → Mark as key event):**
   `contact_form_submit`, `callback_conversion`, `phone_conversion`,
   `email_conversion`, `whatsapp_conversion`, `quote_calculator_conversion`.
2. **Custom dimensions (Admin → Custom definitions → event-scoped):**
   `event_id`, `session_id`, `source`, `service`, `device`,
   `calculator_name`, `step_id`. (The campaign parameters — source/medium/campaign —
   flow natively with the `campaign_details` event, no custom dimension needed.)
3. **Measurement check:** GA4 DebugView + Meta Test Events + GTM Preview.

## Adding a new conversion
1. In `events.ts`, push to the browser dataLayer event (without PII).
2. GTM: Custom Event trigger + GA4 tag (with the canonical GA4 event name) + optionally
   a Meta Pixel tag (`eventID` = DLV event_id) + Google Ads tag.
3. Gateway: extend `ALLOWED_EVENT_NAMES` + `EVENT_NAME_MAP` (Meta) in the Serverside repo,
   and add the Google Ads action ID in the site KV `conversion_actions`.
4. GA4: mark as Key Event + register custom dimension as needed.
