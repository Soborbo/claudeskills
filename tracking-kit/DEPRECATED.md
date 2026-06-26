# DEPRECATED → soborbo-tracking

This kit is obsolete. The canonical tracking solution is **`soborbo-tracking/`**.

## Why
`tracking-kit`'s server side did Meta CAPI + GA4 MP in in-app routes, **without
server-side Google Ads upload**, with an in-memory rate limit and no durability.
In the canonical solution the server side is the **`Soborbo/Serverside`
event-gateway worker**: Meta CAPI + GA4 MP + **Google Ads uploadClickConversions**,
Cloudflare Queues retry, consent gating, universal attribution (gclid/gbraid/
wbraid/fbclid + UTM).

## What moved into soborbo-tracking
- `INVARIANTS.md`, `CHECKLIST.md`, `EVENTS.md`, `MONITORING.md` → `soborbo-tracking/docs/`
- `src/watchdog/index.ts` → `soborbo-tracking/monitoring/watchdog.ts`
- `scripts/check-event-contract.mjs` → `soborbo-tracking/server/check-event-contract.mjs`

## What did NOT move (on purpose)
`src/lib/tracking/server.ts` (sendGA4MP/sendMetaCapi) and the in-app API routes —
the gateway does these better and adds Google Ads. Don't use them.
