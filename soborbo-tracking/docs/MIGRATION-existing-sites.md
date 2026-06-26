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

1. Client: replace the old `lib/tracking` with `soborbo-tracking/lib` + `<Turnstile/>`.
   (The dataLayer/GTM names can stay as-is — the GTM tag provides the GA4 event name.)
2. Server: `server/generate-site.mjs` for the site config, **but omit the `ga4`
   block** → the gateway does NOT send GA4 MP (no GA4 double-counting alongside the
   existing browser GA4). Meta CAPI + Google Ads, however, run server-side.
3. Route + KV + Google Ads OAuth (see `server/SETUP-SERVER.md`).
4. Verification: Meta Test Events (dedup), Google Ads Conversions, GA4 unchanged.

Result: the legacy site gains the server-side Meta + Google Ads benefit
(adblock/ITP resilience, gclid upload) WITHOUT GA4 double-counting or renaming.

## Full unification (only if deliberately required)
If you want a unified canonical taxonomy across all sites (cross-site reporting):
1. "Deprecate, then add" (EVENTS.md): for 30 days, fire BOTH the old AND the new GA4 event name.
2. In GTM, run the tags in parallel; you can enable the gateway GA4 MP with the canonical name.
3. Switch reports to the new name, then stop the old one.
   You accept the re-segmentation — so only do this if the cross-site consistency is worth it.

## What not to do
- Don't enable the gateway GA4 MP on a site where the browser GA4 tag already fires
  the same event, unless you want to double-count (GA4 does not dedup).
- Don't rename live legacy GA4 events without a transitional dual-fire.
