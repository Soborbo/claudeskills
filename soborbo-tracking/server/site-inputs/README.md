# Site inputs — pre-filled generator inputs

Ready-to-fill inputs for `../generate-site.mjs`, with the **non-secret IDs already
gathered**.

> **⚠️ LIVE SITES ARE NOT HERE, ON PURPOSE.** `painless`, `beautyflow`, and
> `lomtalan` are wired and in production. Re-running the generator for a live site
> mints a NEW per-site token and a new `crm_token_sha256` — uploading that KV
> config **breaks the live site's backend dispatch and CRM loop** until every
> deploy's secret is rotated to match. Never regenerate a live site's config
> unless you are deliberately rotating its token; always
> `wrangler kv key get` + diff the live entry first.

## How to use (for a NEW / unwired site)

1. Copy the input, fill the `REPLACE_ME_*` fields **outside git**:
   - `meta.access_token` — Meta Events Manager → Conversions API → System User token.
2. Run the generator:
   ```bash
   node ../generate-site.mjs --input /tmp/trapezlemezes.json --out /tmp/trapez-out
   ```
   It validates and emits `site-config.json`, `routes.toml`, `kv-put.sh`,
   `crm-secret.env` (SAVE THE TOKEN — the KV stores only its hash), and
   `INTEGRATION.md` for **all hostnames** (apex + www). See `../SETUP-SERVER.md`.
3. **Do NOT commit the filled-in secrets.**

## Rules the generator enforces (do not fight them)

- **No `test_event_code` in the input.** The KV config is edge-cached; a test code
  in it has twice routed real production conversions into Meta's Test stream. The
  sanctioned test mechanism is the PER-REQUEST code keyed on
  `TRACKING_TEST_LEAD_EMAIL` (see `../backend/`). Pre-launch opt-in:
  `--allow-test-event-code`, removed before go-live.
- **`conversion_actions` keys are canonical event names only** — and under
  Model 2 they should be the OFFLINE CRM events (`lead_qualified`,
  `booking_confirmed`, `revenue_confirmed`, …). The legacy on-site action IDs
  (phone_conversion & co.) are browser-owned (AWCT) and don't belong in the
  gateway config. Create the offline actions in Google Ads first.
- **No `ga4` block for new sites** — the gateway sends no GA4 at all.
