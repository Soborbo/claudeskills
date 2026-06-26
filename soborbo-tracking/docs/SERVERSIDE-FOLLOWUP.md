# Follow-up: forward Microsoft / TikTok / LinkedIn click IDs (Serverside repo)

> **This work lives in the separate `Soborbo/Serverside` repo (the event-gateway
> worker), not in this skill.** It is documented here because it is the natural
> server-side counterpart to the click IDs this skill already captures.

## What the client already does (this skill)

`lib/gateway.ts` (`collectAttribution`) already captures and forwards these click
IDs in the gateway POST body's `attribution` object (ad-consent gated):

- `msclkid`  — Microsoft Ads (Bing)
- `ttclid`   — TikTok
- `li_fat_id`— LinkedIn
- `twclid`   — X/Twitter

So the data already reaches the gateway. What's missing is the **server-side
fan-out** to those platforms' conversion APIs — today the gateway only forwards to
Meta CAPI, GA4 MP, and Google Ads.

## What to build in `Soborbo/Serverside`

Mirror the existing Meta/GA4/Google-Ads pattern. On its own branch + PR:

1. **Per-platform forwarder modules** (e.g. `src/forwarders/microsoft.ts`,
   `tiktok.ts`, `linkedin.ts`), each exposing the same shape as the existing
   forwarders (build payload from the normalized event + hashed user_data + the
   relevant click ID; POST to the platform API; return a result for the
   Queues/DLQ retry path).
   - Microsoft Ads — UET / offline conversions (Bing Ads API) keyed on `msclkid`.
   - TikTok — Events API (`/event/track/`) keyed on `ttclid`, hashed email/phone.
   - LinkedIn — Conversions API keyed on `li_fat_id`, hashed email (SHA-256).

2. **Per-site config fields** (KV `SiteConfig`): optional blocks
   `microsoft_ads`, `tiktok`, `linkedin` (each with API token + the conversion/
   pixel/event identifiers). Absent block → platform skipped (same as the GA4 MP
   opt-out today).

3. **Wire into the fan-out** alongside Meta/GA4/Google Ads, **gated on marketing
   consent** (the same `require_consent` / consent-signal checks), with the same
   **Cloudflare Queues + DLQ** durability the existing platforms use.

4. **Tests** following the existing platform test pattern (payload shape, consent
   gating, retry/DLQ on failure, click-ID presence/absence).

## If credentials are unavailable

Scaffold the modules + config fields + tests with the live API call clearly marked
`TODO` (and the integration point isolated behind a small `dispatch()` function),
rather than faking live calls. The Queues/DLQ wiring, consent gating, and config
plumbing can all land and be tested without real credentials; only the outbound
HTTP call is stubbed until tokens are provisioned.

## Allowed event names

No change needed on the client. These platforms consume the same canonical events
already mapped in `CANONICAL-EVENTS.md`; the gateway's `EVENT_NAME_MAP` gains
per-platform name mappings (e.g. TikTok `Contact`/`SubmitForm`, LinkedIn
conversion IDs) inside the new forwarders.
