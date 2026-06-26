# DEPRECATED → soborbo-tracking

Ez a kit elavult. A kanonikus tracking-megoldás: **`soborbo-tracking/`**.

## Miért
A `tracking-kit` szerver-oldala in-app route-okban csinált Meta CAPI + GA4 MP-t,
**Google Ads szerver-oldali upload nélkül**, in-memory rate limittel, durability
nélkül. A kanonikus megoldásban a szerver-oldal a **`Soborbo/Serverside`
event-gateway worker**: Meta CAPI + GA4 MP + **Google Ads uploadClickConversions**,
Cloudflare Queues retry, consent-gating, univerzális attribúció (gclid/gbraid/
wbraid/fbclid + UTM).

## Mi került át a soborbo-tracking-be
- `INVARIANTS.md`, `CHECKLIST.md`, `EVENTS.md`, `MONITORING.md` → `soborbo-tracking/docs/`
- `src/watchdog/index.ts` → `soborbo-tracking/monitoring/watchdog.ts`
- `scripts/check-event-contract.mjs` → `soborbo-tracking/server/check-event-contract.mjs`

## Mi NEM került át (szándékosan)
A `src/lib/tracking/server.ts` (sendGA4MP/sendMetaCapi) és az in-app API route-ok —
ezeket a gateway jobban és Google Ads-szal csinálja. Ne ezeket használd.
