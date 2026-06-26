# GTM container export — `container.json`

A ready-to-import Google Tag Manager **Web** container implementing the browser
side of this skill exactly as specified in [`../docs/gtm-setup.md`](../docs/gtm-setup.md)
and [`../docs/CANONICAL-EVENTS.md`](../docs/CANONICAL-EVENTS.md).

> This is the **browser channel** only (GTM → GA4 / Meta Pixel / Google Ads). The
> server channel (Meta CAPI + GA4 MP + Google Ads `uploadClickConversions`) is the
> event-gateway worker in `Soborbo/Serverside` — it is not configured in GTM.

## What's inside

| Kind | Items |
|---|---|
| **Base tags** | Conversion Linker, GA4 Configuration |
| **GA4 event tags** | `contact_form_submit`, `callback_conversion`, `phone_conversion`, `email_conversion`, `whatsapp_conversion`, `quote_calculator_conversion` (Key Events) + `calculator_start/step/option`, `form_abandon`, `scroll_depth` (engagement) — each emits the **canonical GA4 event name** |
| **Meta Pixel** | Base (PageView), Lead (`eventID` = `{{DLV - event_id}}`), Contact (`eventID` = `{{DLV - event_id}}`) → Pixel↔CAPI dedup |
| **Google Ads** | Conversion tag (orderId = `event_id`, value/currency, Enhanced Conversions via the side-channel) |
| **Triggers** | one Custom Event trigger per dataLayer event |
| **Variables** | PII-free DLVs (`event_id`, `value`, `currency`, `session_id`, `device`, …) + `CJS - User Provided Data` (reads the Task-2 side-channel) + constants |

Consent is enforced via per-tag **Additional Consent Checks** (`analytics_storage`
for GA4; `ad_storage` + `ad_user_data` for Meta/Ads), on top of the denied-by-default
consent state. **The Consent Mode v2 default is NOT in this container** — it is
declared inline in `<Tracking/>` (Tracking.astro), which runs *before* `gtm.js` loads
(the only correct place; a GTM tag on Consent Initialization fires too late and
duplicating it risks silent divergence). Keep that the single source of truth.

## Import

1. GTM → **Admin → Import Container**.
2. Choose `container.json`.
3. Workspace: **New** (or an empty one). Option: **Merge → Rename conflicting** for a
   first import; **Overwrite** only if you intend to replace existing tags.
4. **Preview** before publishing.

## Replace these placeholders

All live as **Constant** variables (Variables → *Const - …*) — edit them in one place,
not inside each tag:

| Constant variable | Placeholder | Replace with |
|---|---|---|
| `Const - GA4 Measurement ID` | `G-XXXXXXXXXX` | your GA4 Measurement ID |
| `Const - Meta Pixel ID` | `META_PIXEL_ID` | your Meta Pixel ID |
| `Const - Google Ads Conversion ID` | `AW-XXXXXXXXX` | your Google Ads conversion ID |
| `Const - Google Ads Conversion Label` | `CONVERSION_LABEL` | the conversion action's label |

The container's own public id shows as `GTM-XXXXXXX`; GTM assigns the real id of the
container you import **into**, so you don't edit that.

## Manual finishing steps (do after import)

1. **Google Ads — Enhanced Conversions.** The conversion tag references
   `{{CJS - User Provided Data}}` for user-provided data. Open **Google Ads -
   Conversion → User-Provided Data**, confirm the source is **Manual / a variable**
   and points to `{{CJS - User Provided Data}}`. Then in Google Ads → Conversions →
   Enhanced Conversions, turn it **ON** with method **Google Tag Manager**.
   (The variable returns `{ email, phone_number, first_name, last_name }` from
   `window.__sbUserData`, written by `setUserDataForEC()` — no PII in the dataLayer.)
2. **GA4 Key Events.** In GA4 mark `contact_form_submit`, `callback_conversion`,
   `phone_conversion`, `email_conversion`, `whatsapp_conversion`,
   `quote_calculator_conversion` as Key Events (see `CANONICAL-EVENTS.md`).
3. **GA4 custom dimensions.** Register `event_id`, `session_id`, `source`, `service`,
   `device`, `calculator_name`, `step_id` (event-scoped).
4. **GA4 double-counting.** This container fires GA4 **browser-side**. Keep the
   gateway GA4 MP **off** (omit the `ga4` block in the site KV) unless you deliberately
   accept the overlap — GA4 does not dedup. See `CANONICAL-EVENTS.md`.
5. **Verify.** GTM Preview + GA4 DebugView + Meta Test Events (dedup on the shared
   `event_id`).

## Regenerating

`container.json` is generated from [`gen-container.mjs`](./gen-container.mjs) in this
folder; if you change `docs/gtm-setup.md`, re-run the generator and re-import:

```sh
node gtm/gen-container.mjs gtm/container.json
```

The file is plain JSON — validate with `node -e "require('./gtm/container.json')"`.
A vitest case (`tests/gtm-container.test.ts`) also asserts it parses and that every
canonical GA4 event name is present.
