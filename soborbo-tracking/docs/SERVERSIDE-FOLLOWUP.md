# Follow-up log — Serverside (engine) work items

> Historical tracker for engine-side work this skill depends on. The engine repo
> (`Soborbo/Serverside`) is the source of truth for current state; check its
> README / `docs/HANDOVER-run6.md` before acting on anything here.

## ✅ DONE — Microsoft / TikTok / LinkedIn click-ID forwarders

Shipped in the engine. The gateway forwards on-site conversions to the
TikTok/LinkedIn/Microsoft conversion APIs when the matching click ID
(`ttclid` / `li_fat_id` / `msclkid`) is present — same event_id-dedup model as
Meta CAPI, per-site config blocks (`tiktok` / `linkedin` / `microsoft_ads` in the
KV site-config; absent block → clean `skipped`). The client side of this
(`collectAttribution` capturing the click IDs) is in `lib/gateway.ts`.

## ✅ DONE — Run 6 correctness set (2026-07)

Three-state ledger honesty (TRK-950-004), high-value browser-path gate
(TRK-400-017, `server_ingress_only`), DLQ persistence guarantee (TRK-900-007),
real error statuses on server-to-server routes, quote-state Durable Object
DELETED, offline GA4 leg DISABLED, per-site server-ingress token
(`crm_token_sha256`), daily smoke-lead guard (`SMOKE_SITES` digest check).
This skill (v6) is written against that contract.

## Open (engine-side, operator action)

- **Cloudflare Queues activation**: `wrangler queues create event-gateway-dlq`
  + `event-gateway-dlq-dead`, then uncomment the three wrangler.toml blocks.
  Until then the DLQ runs on R2 + hourly cron retry (works, just slower).
