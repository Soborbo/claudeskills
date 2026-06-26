# examples/ — kész, másolható wiring

Nem kell generálni, csak másolni + 3 azonosítót kicserélni.

## Kliens (Astro site)
1. `components/` + `lib/` → a site `src/`-jébe (a `@/lib/tracking` aliasszal, vagy
   igazítsd az importokat).
2. `Layout.astro` → a site layoutjába (cseréld: `GTM_ID`, `COOKIEYES_ID`).
3. `.env.example` → `.env` (cseréld: `PUBLIC_TURNSTILE_SITE_KEY`).
4. `contact.astro` → minta oldal `<TrackedForm/>`-mal.
5. `astro.config`: `output: 'server'` + `@astrojs/cloudflare` adapter.

## Szerver (event-gateway, EGYSZER site-onként)
6. `wrangler-route.example.toml` mintájára a route a Serverside `wrangler.toml`-ba
   (vagy futtasd a `server/generate-site.mjs`-t → `routes.toml`).
7. KV site-config feltöltése (Meta/GA4/Ads ID-k + secretek) — `server/SETUP-SERVER.md`.

Ennyi. A consent (CookieYes), az attribúció (gclid/UTM/click ID) és a Turnstile
automatikus; a konverziók mind a 3 platformra mennek szerver-oldalon, dedupolva
a böngésző Pixel/tag-ekkel az azonos event_id-n.
