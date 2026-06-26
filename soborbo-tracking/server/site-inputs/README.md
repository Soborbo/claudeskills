# Site inputs — pre-filled generator inputs

These are ready-to-use inputs for `../generate-site.mjs`, with the **non-secret IDs
already gathered** (Meta pixel_id, Google Ads customer_id + conversion action IDs,
GA4 property known). They salvage the work from the old Serverside PR #2 (now closed)
so you don't have to re-gather the IDs.

## How to use

1. Fill the `REPLACE_ME_*` fields per site (these are secrets / data-stream values
   that cannot be read from any API):
   - `meta.access_token` — Meta Events Manager → Conversions API → System User token.
   - `ga4.measurement_id` — GA4 Admin → Data Streams → <web stream> → Measurement ID (`G-XXXX`).
   - `ga4.api_secret` — same stream → Measurement Protocol API secrets → Create.
   - `beautyflow.json` also: `meta.pixel_id` (see the note below).
2. Run the generator:
   ```bash
   node ../generate-site.mjs --input beautyflow.json --out /tmp/beautyflow-out
   ```
   It validates and emits `site-config.json`, `routes.toml`, `kv-put.sh`, `INTEGRATION.md`
   for **all hostnames** (apex + www). See `../SETUP-SERVER.md` for the full flow.
3. **Do NOT commit the filled-in secrets.** Fill a copy outside git, or pass via the
   generator at run time.

## Per-site notes

- **painless.json** (GB) — pixel + Google Ads (4 actions) ready. GB site, no
  `require_consent`.
- **trapezlemezes.json** (HU) — pixel + Google Ads (4 actions) ready. EEA →
  `require_consent: true`.
- **beautyflow.json** (HU) — Google Ads ready (2 actions: contact_form_submit,
  phone_conversion). **`meta.pixel_id` is REPLACE_ME** — the Beautyflow pixel was
  not visible under any connected Meta ad account (likely a different Business
  Manager); copy it from Meta Events Manager. EEA → `require_consent: true`.

## Rollout testing (optional)

To verify in Meta Test Events before go-live, add a `test_event_code` to the
`meta` block (e.g. `"test_event_code": "TEST_TRAPEZ"`). **Remove it before
production** — otherwise every real conversion goes to the Test stream and never
appears in Ads Manager reports. The generator warns if it is still present.

## Conversion-action caveats (from the original ID gathering)

- `phone_conversion` maps to a CLICK_TO_CALL action on some accounts — the
  `uploadClickConversions` API may reject those; verify or create a WEBPAGE-type action.
- `email_conversion` / `whatsapp_conversion` actions did not exist (enabled) on the
  Painless/Beautyflow accounts and are omitted — the worker silently skips unmapped
  events (MISSING_CONVERSION_ACTION warning). Create them in Google Ads if needed.
