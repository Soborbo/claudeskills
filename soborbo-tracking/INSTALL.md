# INSTALL — agent runbook (start here)

This is the **single, ordered install playbook** for the `soborbo-tracking` skill.
If the user just says *"here is the skill, install the server-side tracking"*, an
agent follows THIS file top-to-bottom. The other docs are reference material; this
file is the spine that calls them in order.

> **Scope:** Astro.js site with `output: 'server'` on Cloudflare Workers. (Non-Astro
> sites are out of scope — stop and tell the user if the target is not Astro.)
>
> **Assumed already to exist** (the user provides them as inputs in Step 0; this
> runbook does NOT create them): a **CookieYes** ID and a **GTM** container ID. If
> either is missing, ask the user to create it first (CookieYes: cookieyes.com;
> GTM: tagmanager.google.com).
>
> **There is NO Turnstile in the tracking path.** The gateway does not validate
> tokens; a client-side token gate once silently dropped two weeks of click
> conversions in production. If you find yourself adding one, stop.

## The five hard rules (violating any of these has already cost real money)

1. **Server-ingress-only events never leave the browser.** `quote_calculator_submitted`,
   `callback_request_submitted`, `contact_form_submitted`, `order_request_submitted`,
   `purchase` get **403 (TRK-400-017)** on the browser path. Their gateway leg is
   sent by the site BACKEND (`server/backend/gateway-dispatch.ts`) with the
   browser's `event_id` (hidden field). The client lib blocks them too (TRK-1005).
2. **`lead_id` is the CRM's id or absent** — from the CRM webhook RESPONSE. Never a
   site-minted fallback (event_id/hash/timestamp): unjoinable-but-populated is
   worse than NULL.
3. **`test_event_code` never goes into KV.** The edge-cached site-config has twice
   routed real conversions into Meta's Test stream. Per-request only, keyed on
   `TRACKING_TEST_LEAD_EMAIL` (the generator hard-errors on a KV test code).
4. **No live-pixel browser testing.** Synthetic proof = the authenticated server
   ingress + per-request test code (the daily smoke cron IS that test).
5. **Verify claims against the repo, not the deployed bundle.** Client-side call
   sites are NOT in the worker bundle; audits of "what dispatches what" happen on
   the repository source.

---

## Step 0 — Intake gate (ask ONCE, up front)

Before touching anything, gather everything in a **single** message to the user.
Split into "I'll fetch this myself" vs "you must give me this", so the user only
hands over what is genuinely un-fetchable.

### 0a. I (the agent) fetch these from the connected MCP connectors — don't ask
- **Meta `pixel_id`** — Meta Ads connector (`get_pixels`). Fallback: Events Manager.
- **Google Ads `customer_id`** — Ads connector (`list_google_ads_customers`),
  10 digits, no hyphens. `login_customer_id` only if under an MCC.
- **Google Ads `conversion_actions`** — Ads connector: OFFLINE conversion action IDs
  for the CRM lifecycle events (Model 2: the server does Google Ads **only offline**,
  via the Data Manager API), e.g. `lead_qualified`, `booking_confirmed`,
  `revenue_confirmed`. On-site Google Ads is browser-owned (AWCT + EC).
  Keys must be **canonical** event names — the generator rejects legacy aliases.

> If a connector is missing or returns nothing, fall back to asking the user for
> that specific id — but try the connector first.

### 0b. The user MUST provide these (un-fetchable by any API) — ask for all at once
1. **Meta CAPI `access_token`** — Events Manager → Conversions API → Generate. *Secret.*
2. **Meta Test Events code** — Events Manager → Test Events tab (for the smoke
   cron's `TRACKING_TEST_EVENT_CODE`; per-request use only, never KV).
3. **CookieYes ID** — the CMP id used in `<Tracking cookieYesId="…" />`.
4. **GTM container id** — `GTM-XXXX`.
5. **Hostnames** — apex + www (e.g. `example.com`, `www.example.com`).
6. **`site_id`** — short slug (e.g. `trapezlemez`).
7. **Market** — `country_code` + `currency` (e.g. HU/HUF, GB/GBP).
8. **`require_consent`** — `true` for EEA markets (HU/EU/DE/FR/IT/ES…), else `false`.
9. **CRM webhook details** — does the site backend forward leads to a CRM, and does
   the CRM response carry the record id (`{success, id}`)? That id becomes `lead_id`.
10. **Greenfield or migration?** — is there ALREADY a live browser GA4 on this site?
    NOTE (Model 2): the gateway sends **no GA4 at all** (browser owns on-site GA4;
    the offline GA4 leg is disabled) → a live browser GA4 can never double-count.
11. **OAuth consent** — confirm they'll approve the one-time Google Ads OAuth (Step 4,
    `datamanager` scope) when prompted. Only needed if there is a `customer_id`.
12. **Checkout flow (e-commerce sites only)** — `lead-gen` (forms only) /
    `lead-style checkout (A)` (order request, price may change → Meta Lead, never
    purchase) / `real payment (B)` (fixed price → `purchase`, value-optimizable).

> **Guardrail:** secrets (#1) go ONLY into Cloudflare KV / worker secrets, **never**
> into git or any file committed to a repo. Build the generator input in a temp dir.

Do not proceed past Step 0 until every applicable item above is in hand.

---

## Step 1 — Repo & branch verification (2 minutes that prevent a lost deploy)

Run these BEFORE any edit, in both the site repo and `Soborbo/Serverside`:

```bash
git remote show origin | grep "HEAD branch"   # the default branch is NOT always main
```

- Record the default branch and confirm in the Cloudflare dashboard **which branch
  Workers Builds deploys** (a merge to the wrong one is a silent no-op — this
  happened: a PR merged to `main` while production deployed `master`).
- All work goes on a feature branch → PR into the DEPLOYED branch.

---

## Step 2 — Client install (the Astro site, browser leg)

Reference: `examples/README.md`, `docs/cloudflare-setup.md`.

1. Copy `components/` + `lib/` into the site's `src/` as **siblings**
   (`src/components/` + `src/lib/`). Components import the lib via `../lib`, so no
   path alias is needed.
2. **Layout** (`src/layouts/…`): in `<head>` add
   `<Tracking gtmId="GTM-XXXX" cookieYesId="<CookieYes id>" />`; at the top of
   `<body>` add `<TrackingNoscript gtmId="GTM-XXXX" />`.
   (Copy from `examples/Layout.astro`. No Turnstile component — it's gone.)
3. **Env** (`.env` / Worker vars): the market vars `PUBLIC_TRACKING_COUNTRY` /
   `PUBLIC_TRACKING_CURRENCY` / `PUBLIC_TRACKING_LOCALE` (keep in sync with the
   gateway KV `country_code`/`currency`). See `examples/.env.example`.
4. **Astro config**: `output: 'server'` + `@astrojs/cloudflare` adapter. Enable
   Google Tag Gateway (`docs/cloudflare-setup.md`).
5. **Conversion call sites**:
   - Forms: wrap in `<TrackedForm …>` (browser leg + hidden `event_id` for Step 3).
   - Clicks: `<PhoneLink/>`, `<CallbackButton/>` (dataLayer-only by design),
     `<RevealContact type="email|phone" …/>`.
   - Custom browser-path points: `trackServerEvent('<name>')` — ONLY the
     browser-allowed names (`lib/event-contract.ts`); server-only names are
     blocked with TRK-1005.
6. **GTM**: import `gtm/container.json` into the user's GTM container and wire the
   GA4 event names per `docs/CANONICAL-EVENTS.md` (`docs/gtm-setup.md`).
7. **Verify locally**: `npm test` + `npm run typecheck` +
   `node server/check-event-contract.mjs` pass; with `?debugTracking=1` confirm the
   dataLayer pushes, and that form submits do NOT POST `/api/event/conversion`
   (only low-risk clicks do).

---

## Step 3 — Backend dispatch (the server leg of form conversions)

Reference: `server/backend/README.md` — this step is NOT optional; without it the
site's form conversions have NO server leg at all.

1. Copy `server/backend/gateway-dispatch.ts` + `smoke.ts` into the site's
   `src/lib/tracking/`, `server/backend/worker.ts` to `src/worker.ts`. Set `SITE`
   in smoke.ts to the `site_id`.
2. Site wrangler config: `main = "./src/worker.ts"`,
   `[[services]] binding = "GATEWAY" service = "event-gateway"`,
   `[triggers] crons = ["4X 4 * * *"]` (pick a distinct minute per site).
   **TOML footgun:** top-level keys (`keep_vars = true`) must sit ABOVE every
   `[table]` — otherwise they parse as the last table's sub-key and a deploy wipes
   the dashboard vars. **After the first build, inspect the generated
   `dist/server/wrangler.json`** and confirm `main`, `triggers.crons`, and
   `keep_vars` all landed.
3. In every API route that receives a gated form POST: bot-guard first
   (silent-drop → NO tracking), forward to the CRM, then `sendGatewayConversion`
   with the browser `event_id` (hidden field) and the CRM's id as `lead_id` —
   the exact pattern in `server/backend/README.md`.
4. Set worker vars/secrets: `TRACKING_GATEWAY_TOKEN` (from Step 4's
   `crm-secret.env`), `SITE_URL`, `TRACKING_TEST_LEAD_EMAIL`,
   `TRACKING_TEST_EVENT_CODE`.
5. **Call-site audit (repo-wide, mandatory):** grep the SITE REPO for every
   conversion dispatch and confirm no server-only event is sent from browser code,
   and no flow relies on a browser-only leg for its money conversion. The deployed
   worker bundle does NOT contain client scripts — auditing it proves nothing.

---

## Step 4 — Server binding (event-gateway worker)

Reference: `server/SETUP-SERVER.md`. Binding a site = KV config + route + token +
(if Ads) OAuth. **Always run the generator — never hand-write the config JSON.**

1. **Build the input JSON in a temp dir** (NOT the repo), filling Step 0's values:
   ```json
   {
     "site_id": "<slug>",
     "hostnames": ["example.com", "www.example.com"],
     "country_code": "HU", "currency": "HUF", "require_consent": true,
     "meta": { "pixel_id": "…", "access_token": "…" },
     "gads": { "customer_id": "1234567890", "login_customer_id": null,
               "conversion_actions": { "lead_qualified": "…", "booking_confirmed": "…" } }
   }
   ```
   No `ga4` block for new sites (the gateway sends no GA4). No `test_event_code`
   (the generator hard-errors). `gads.conversion_actions` keys are the **offline
   CRM events**, canonical names only.
2. **Generate:**
   ```bash
   node server/generate-site.mjs --input /tmp/<site>.json --out /tmp/<site>-out
   ```
   Validates (bad input → exit 1; fix the input, not the script) and emits
   `site-config.json`, `routes.toml`, `kv-put.sh`, `crm-secret.env`, `INTEGRATION.md`.
   Save the generated token from `crm-secret.env` immediately.
3. **Upload KV** — one entry per hostname, into SITE_CONFIG
   (`edd34e28eee847c09c26f9d9e3ea04ab`): run the `kv-put.sh` commands (wrangler) or
   use the Cloudflare MCP `kv_put`.
4. **Route + deploy** — add the `routes.toml` block to the `Soborbo/Serverside`
   `wrangler.toml`, open a **branch + PR into the deployed branch** (Step 1); the
   user lands it. This makes `https://<host>/api/event/*` resolve to the gateway.
5. **Register the smoke guard** — add the `site_id` to the gateway's `SMOKE_SITES`
   var (wrangler.toml `[vars]`), same PR.

---

## Step 5 — Google Ads OAuth (once per `customer_id`, only if Ads is configured)

`GET /api/event/oauth-init` with the admin token (`X-Admin-Token`) → populates the
OAUTH_TOKENS KV. The OAuth scope MUST include **`datamanager`** — the offline Google
Ads leg uploads via the **Data Manager API** (the legacy `uploadClickConversions` is
closed to new adopters; no developer token needed). Without OAuth, Google Ads
uploads fail. Prompt the user to complete the one-time consent (Step 0 #11).
Tip: run the gateway with `DATAMANAGER_VALIDATE_ONLY=1` first to dry-run the ingest.

---

## Step 6 — Verification (within 24h) — every check is observable, not vibes

Run `server/smoke-test.sh https://<host>` (gate behavior: health 200, browser-path
403s for missing Origin and gated events, 401 for tokenless server ingress), then:

- [ ] First smoke cron run (next 04:4x UTC) books a D1 ledger row:
      `SELECT platform,status,http_status,lead_id FROM deliveries WHERE event_id LIKE 'smoke-<site>-%'`
      → `meta | accepted | 200` (or `skipped` for a meta-less site). **`accepted`
      with NULL http_status is a bug (TRK-950-004), not a success.**
- [ ] Gateway daily digest (08:00 UTC) shows the site under "Synthetic smoke leads"
      with no alarm. (The FIRST digest after wiring may false-alarm if it runs
      before the first cron — expected one-time noise.)
- [ ] Meta Events Manager → Test Events: the smoke event appears (server source),
      and for a REAL lead the browser + server events share one `event_id`
      ("Browser AND Server").
- [ ] Google Ads conversion actions reach "Recording conversions" (after the first
      real offline upload).
- [ ] Cloudflare Workers logs clean for 24h (no TRK-4xx/9xx codes;
      `docs/error-codes.md` in the engine repo is the runbook).
- [ ] Client diagnostics clean: no TRK-1005 (a wiring bug pushing gated events from
      the browser) and no TRK-1006 (gateway rejecting the browser path) in
      `window.__sbTrackingDiag` on a real page view.

---

## Critical guardrails (do not skip — each one is a past incident)

- **Secrets never in git** — CAPI token + per-site token only in KV/worker secrets.
- **`test_event_code` never in KV** — generator hard-errors; per-request only.
- **EEA → `require_consent: true`** + CookieYes wired.
- **Default branch ≠ always main** — verify before merging (Step 1).
- **TOML top-level keys above tables**; inspect the generated wrangler.json.
- **Repo call-site audit** before enforcing/changing any gate (Step 3.5).
- **No live-pixel testing**; the smoke cron is the sanctioned synthetic proof.
- **Migration:** don't rename live GA4 events mid-stream — use the per-site
  `event-aliases.json` + `cutover_date`; run paths in parallel ≥7 days
  (`docs/MIGRATION-existing-sites.md`, `docs/EVENT-MIGRATION.md`).
- **One generator, one source of truth** — always run `server/generate-site.mjs`;
  never improvise the JSON. events.json is vendored from the engine; check drift
  with `node server/check-event-contract.mjs --engine <Serverside>/src/events.json`.
