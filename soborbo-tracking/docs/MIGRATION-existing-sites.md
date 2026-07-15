# Migration — already wired (legacy) sites

Legacy sites run on the old `tracking/` (Meta-only `/api/track`) or an earlier GA4/GTM
setup. Their browser GA4 events (via GTM) WORK — the change is on the SERVER side
(Meta-only → gateway: all 3 platforms). Don't break the existing GA4 history.

## Golden rule
**Do NOT rename a live GA4 event** — that re-segments the historical data.
Instead, add the gateway for the missing server-side pieces.

## Recommended path (low risk) — "bolt-on"
The legacy site's GA4 stays browser-side, and the gateway brings ONLY the missing
pieces (Meta CAPI + Google Ads server-side):

1. Client: replace the old `lib/tracking` with `soborbo-tracking/lib` (no
   Turnstile — the tracking path has no token gate). The dataLayer/GTM names can
   stay as-is — the GTM tag provides the GA4 event name.
2. Backend: wire the gated form conversions through
   `server/backend/gateway-dispatch.ts` (browser dispatch for them is 403'd) —
   audit EVERY call site in the repo first (INVARIANTS #24).
3. Server: `server/generate-site.mjs` for the site config (no `ga4` block — the
   gateway sends no GA4 at all). Meta CAPI + offline Google Ads run server-side.
4. Route + KV + token + Google Ads OAuth (see `server/SETUP-SERVER.md`).
5. Verification: smoke cron ledger row, Meta Test Events via the smoke lead
   (dedup), Google Ads Conversions, GA4 unchanged.

Result: the legacy site gains the server-side Meta + Google Ads benefit
(adblock/ITP resilience, gclid upload) WITHOUT GA4 double-counting or renaming.

## Full unification (only if deliberately required)
If you want a unified canonical taxonomy across all sites (cross-site reporting):
1. "Deprecate, then add" (EVENTS.md): for 30 days, fire BOTH the old AND the new GA4 event name.
2. In GTM, run the tags in parallel (browser-only — GA4 stays browser-owned).
3. Switch reports to the new name, then stop the old one.
   You accept the re-segmentation — so only do this if the cross-site consistency is worth it.

## What not to do
- Don't add ANY server-side GA4 send — the gateway has no GA4 leg and GA4 does not
  dedup; a server mirror double-counts by construction.
- Don't rename live legacy GA4 events without a transitional dual-fire.
- Don't wire form conversions to the browser gateway path "because the legacy site
  did" — the gateway 403s them now; the backend dispatch is the migration target.
