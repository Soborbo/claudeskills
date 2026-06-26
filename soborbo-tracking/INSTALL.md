# INSTALL — agent runbook (start here)

This is the **single, ordered install playbook** for the `soborbo-tracking` skill.
If the user just says *"here is the skill, install the server-side tracking"*, an
agent follows THIS file top-to-bottom. The other docs are reference material; this
file is the spine that calls them in order.

> **Scope:** Astro.js site with `output: 'server'` on Cloudflare Workers. (Non-Astro
> sites are out of scope — stop and tell the user if the target is not Astro.)
>
> **Assumed already to exist** (the user provides them as inputs in Step 0; this
> runbook does NOT create them): a **Turnstile** site key, a **CookieYes** ID, and a
> **GTM** container ID. If any is missing, ask the user to create it first
> (Turnstile: Cloudflare dash → Turnstile; CookieYes: cookieyes.com; GTM:
> tagmanager.google.com), or run the `turnstile-spin` skill for Turnstile.

---

## Step 0 — Intake gate (ask ONCE, up front)

Before touching anything, gather everything in a **single** message to the user.
Split into "I'll fetch this myself" vs "you must give me this", so the user only
hands over what is genuinely un-fetchable.

### 0a. I (the agent) fetch these from the connected MCP connectors — don't ask
- **Meta `pixel_id`** — Meta Ads connector (`get_pixels`). Fallback: Events Manager.
- **GA4 `measurement_id` (`G-XXXX`)** — GA4 connector: the web data stream's
  Measurement ID. NOT the numeric property id.
- **Google Ads `customer_id`** — Ads connector (`list_google_ads_customers`),
  10 digits, no hyphens. `login_customer_id` only if under an MCC.
- **Google Ads `conversion_actions`** — Ads connector: action IDs, mapped to the
  allowed gateway event names (see SKILL.md "Gateway event names").

> If a connector is missing or returns nothing, fall back to asking the user for
> that specific id — but try the connector first.

### 0b. The user MUST provide these (un-fetchable by any API) — ask for all at once
1. **Meta CAPI `access_token`** — Events Manager → Conversions API → Generate. *Secret.*
2. **GA4 `api_secret`** — GA4 Admin → Data Streams → stream → Measurement Protocol
   API secrets → Create. *Secret.*
3. **CookieYes ID** — the CMP id used in `<Tracking cookieYesId="…" />`.
4. **GTM container id** — `GTM-XXXX`.
5. **Turnstile site key** — value for `PUBLIC_TURNSTILE_SITE_KEY`.
6. **Hostnames** — apex + www (e.g. `example.com`, `www.example.com`).
7. **`site_id`** — short slug (e.g. `trapezlemez`).
8. **Market** — `country_code` + `currency` (e.g. HU/HUF, GB/GBP).
9. **`require_consent`** — `true` for EEA markets (HU/EU/DE/FR/IT/ES…), else `false`.
10. **Greenfield or migration?** — is there ALREADY a live browser GA4 on this
    site? If yes → migration path (see Step 2, "omit the `ga4` block").
11. **OAuth consent** — confirm they'll approve the one-time Google Ads OAuth
    (Step 3) when prompted. Only needed if there is a `customer_id`.

> **Guardrail:** secrets (#1, #2) go ONLY into Cloudflare KV, **never** into git or
> any file committed to a repo. Build the generator input in a temp dir.

Do not proceed past Step 0 until every applicable item above is in hand.

---

## Step 1 — Client install (the Astro site)

Reference: `examples/README.md`, `docs/cloudflare-setup.md`.

1. Copy `components/` + `lib/` into the site's `src/` as **siblings**
   (`src/components/` + `src/lib/`). Components import the lib via `../lib`, so no
   path alias is needed.
2. **Layout** (`src/layouts/…`): in `<head>` add
   `<Tracking gtmId="GTM-XXXX" cookieYesId="<CookieYes id>" />`; at the top of
   `<body>` add `<TrackingNoscript gtmId="GTM-XXXX" />` and `<Turnstile />`.
   (Copy from `examples/Layout.astro`.)
3. **Env** (`.env` / Worker vars): `PUBLIC_TURNSTILE_SITE_KEY`, and the market vars
   `PUBLIC_TRACKING_COUNTRY` / `PUBLIC_TRACKING_CURRENCY` / `PUBLIC_TRACKING_LOCALE`
   (keep in sync with the gateway KV `country_code`/`currency`). See
   `examples/.env.example`.
4. **Astro config**: `output: 'server'` + `@astrojs/cloudflare` adapter. Enable
   Google Tag Gateway (`docs/cloudflare-setup.md`).
5. **Conversion call sites**: wrap forms in `<TrackedForm …>`; use `<PhoneLink/>` /
   `<CallbackButton/>` for tel/callback. Custom points: `trackServerEvent(...)`.
   (See SKILL.md "Usage" + `examples/contact.astro`.)
6. **GTM**: import `gtm/container.json` into the user's GTM container and wire the
   GA4 event names per `docs/CANONICAL-EVENTS.md` (`docs/gtm-setup.md`).
7. **Verify locally**: `npm test` + `npm run typecheck` pass; load a page with
   `?debugTracking=1` and confirm the dataLayer pushes + a `/api/event/conversion`
   POST fire with the SAME `event_id`.

---

## Step 2 — Server binding (event-gateway worker)

Reference: `server/SETUP-SERVER.md`. The server side is the `Soborbo/Serverside`
worker; binding a site = KV config + route + (if Ads) OAuth. **Always run the
generator — never hand-write the config JSON.**

1. **Build the input JSON in a temp dir** (NOT the repo), filling Step 0's values:
   ```json
   {
     "site_id": "<slug>",
     "hostnames": ["example.com", "www.example.com"],
     "country_code": "HU", "currency": "HUF", "require_consent": true,
     "meta": { "pixel_id": "…", "access_token": "…" },
     "ga4":  { "measurement_id": "G-XXXX", "api_secret": "…" },
     "gads": { "customer_id": "1234567890", "login_customer_id": null,
               "conversion_actions": { "callback_conversion": "…", "phone_conversion": "…" } }
   }
   ```
   **Migration path:** if Step 0 #10 was "yes, live browser GA4 exists", **omit the
   `ga4` block** so the gateway does NOT double-count GA4 MP alongside the existing
   browser GA4 (`docs/MIGRATION-existing-sites.md`).
2. **Generate:**
   ```bash
   node server/generate-site.mjs --input /tmp/<site>.json --out /tmp/<site>-out
   ```
   The script validates (bad id → exit 1; fix the input, not the script) and emits
   `site-config.json`, `routes.toml`, `kv-put.sh`, `INTEGRATION.md`.
3. **Upload KV** — one entry per hostname, into SITE_CONFIG
   (`edd34e28eee847c09c26f9d9e3ea04ab`): run the `kv-put.sh` commands (wrangler) or
   use the Cloudflare MCP `kv_put`.
4. **Route + deploy** — add the `routes.toml` block to the `Soborbo/Serverside`
   `wrangler.toml` (mirror the commented rollout section), open a **branch + PR**
   (never push to `main`); the user lands it and runs `wrangler deploy`. This makes
   `https://<host>/api/event/*` resolve to the gateway worker (same-origin).

---

## Step 3 — Google Ads OAuth (once per `customer_id`, only if Ads is configured)

`GET /api/event/oauth-init` with the admin token (`X-Admin-Token`) → populates the
OAUTH_TOKENS KV. Without it, Google Ads uploads fail. Prompt the user to complete
the one-time consent (Step 0 #11).

---

## Step 4 — Verification (within 24h)

Follow the generated `INTEGRATION.md` "Verification" section and `docs/CHECKLIST.md`
"Post-deploy":
- Health endpoint OK.
- Meta Test Events: same `event_id` on Pixel + CAPI, marked "Browser AND Server".
- GA4 DebugView: events with `event_id` / `value` / `currency`; server-side MP under
  the real source/medium (not `(not set)`).
- Google Ads conversion actions reach "Recording conversions".
- Cloudflare Workers logs clean for 24h.

---

## Critical guardrails (do not skip)

- **Secrets never in git** — CAPI token + GA4 api_secret go only to KV (temp input
  file in `/tmp`, deleted after).
- **`test_event_code` MUST be removed** from the production gateway KV before go-live
  — otherwise every real conversion lands in Meta Test Events, out of optimization
  (the generator warns about this).
- **EEA → `require_consent: true`** + CookieYes wired.
- **Migration:** if a live browser GA4 already fires, omit the gateway `ga4` block;
  don't rename live GA4 events; run paths in parallel ≥7 days
  (`docs/MIGRATION-existing-sites.md`, `docs/CHECKLIST.md`).
- **One generator, one source of truth** — for the config format always run
  `server/generate-site.mjs`; never improvise the JSON.
