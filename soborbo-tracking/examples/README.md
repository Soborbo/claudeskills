# examples/ — ready-to-use, copyable wiring

No need to generate anything, just copy + swap 3 identifiers.

## Client (Astro site)
1. `components/` + `lib/` → into the site's `src/` as **siblings** (`src/components/` +
   `src/lib/`). The components import the library via a relative path (`../lib`), so
   **no alias setup is needed** — it just works with that layout. (Your own page/form
   code can import from wherever you copied `lib/`, e.g. `@/lib` if you use the `@→src`
   alias, or a relative path.)
2. `Layout.astro` → into the site layout (swap: `GTM_ID`, `COOKIEYES_ID`).
3. `.env.example` → `.env` (market vars; backend vars go to the Worker settings).
4. `contact.astro` → a sample page with `<TrackedForm/>`.
5. `astro.config`: `output: 'server'` + `@astrojs/cloudflare` adapter.

## Server (event-gateway, ONCE per site)
6. Following the `wrangler-route.example.toml` example, add the route to the Serverside
   `wrangler.toml` (or run `server/generate-site.mjs` → `routes.toml`).
7. Upload the KV site-config (Meta/Ads IDs + secrets, `crm_token_sha256`) —
   `server/SETUP-SERVER.md`.
8. Backend leg: `server/backend/` → `src/lib/tracking/` + `src/worker.ts` (service
   binding + per-site token + daily smoke cron) — `server/backend/README.md`.

That's it. Consent (CookieYes) and attribution (gclid/UTM/click ID) are automatic;
click conversions go server-side from the browser path, form conversions from the
site backend — all deduplicated against the browser Pixel/tags on the same event_id.
(No Turnstile anywhere in tracking.)
