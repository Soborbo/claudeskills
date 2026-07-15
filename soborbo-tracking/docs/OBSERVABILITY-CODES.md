# Client diagnostic codes (observability)

Tracking fails silently and expensively — a broken dispatch or a leaked PII key is
invisible until conversions quietly drop days later. So every notable condition is
reported by `lib/observability.ts` with a **stable code**, three ways:

1. **console** — `error`/`warn` always; `info` only under diag-debug
   (`?debugTracking=1`). Format: `[tracking] TRK-NNNN <message> {context}`.
2. **ring buffer** at `window.__sbTrackingDiag` (last 50) — read it from a synthetic
   probe / E2E test / a quick console check.
3. **DOM CustomEvent** `sb-tracking-diagnostic` — forward to your error pipeline.
   Only `warn`/`error` are dispatched (info is a throughput heartbeat, not a problem).

> These TRK-1xxx/3xxx codes are the CLIENT vocabulary. The GATEWAY has its own
> TRK-NNN-NNN codes (runbook: `Serverside/docs/error-codes.md`) — notably
> TRK-400-017 (server-only event rejected on the browser path), TRK-900-007
> (retry-record could not be persisted → manual resend), TRK-950-004 (delivery
> claimed `accepted` without a vendor HTTP status). Don't confuse the two spaces.

## Codes

| Code | Severity | When | Likely cause if it spikes after a deploy |
|------|----------|------|------------------------------------------|
| `TRK-1000` | info | Gateway dispatch sent (ring/heartbeat) | — |
| `TRK-1002` | error | **Gateway POST failed** (network/transport) | Gateway route/worker down, DNS, bad `/api/event/*` binding |
| `TRK-1003` | info | `sendBeacon` unavailable/failed → used `fetch` keepalive | Usually benign (browser/UA), watch if it becomes constant |
| `TRK-1005` | error | **Server-ingress-only event blocked from browser dispatch** | A wiring bug: form/lead/purchase conversions must be dispatched by the SITE BACKEND (`server/backend/`). The block prevented a guaranteed gateway 403 — fix the call site, don't bypass the guard |
| `TRK-1006` | error | **Gateway rejected the dispatch** (non-2xx on the fetch fallback) | 403 = Origin not allow-listed / gated event; 429 = rate limit; 404 = hostname missing from SITE_CONFIG KV. The conversion did NOT land |
| `TRK-3001` | error | **PII-shaped key blocked from a dataLayer push** | A code change started pushing raw PII — a GDPR regression. Fix the push; route PII via `setUserDataForEC()` |

> `TRK-1xxx` = worker connection, `TRK-3xxx` = data integrity.
> `TRK-1001`, `TRK-1004`, and the whole `TRK-2xxx` block (Turnstile) are RETIRED —
> the gateway no longer validates Turnstile and the client never gates a dispatch
> on a token. Do not reuse the numbers.
> The codes are a contract — alert/dashboard on them; don't renumber casually.

## Wiring it to alerts

```ts
// Forward every problem to the error-pipeline skill (Tail Worker → throttled email).
window.addEventListener('sb-tracking-diagnostic', (e) => {
  const d = (e as CustomEvent).detail; // { code, severity, message, context, ts }
  // reportClientError(d)  // your existing error-pipeline client
});
```

Or scrape the ring buffer from an uptime probe:

```js
const problems = (window.__sbTrackingDiag || []).filter(d => d.severity !== 'info');
```

Suggested alerts (any of these firing across many sessions = act):
- `TRK-1002` at all → the gateway is unreachable. Click conversions are not
  reaching Meta CAPI server-side.
- `TRK-1005` at all → a deploy wired a gated event to the browser path; its server
  leg is missing until the call site moves to the backend.
- `TRK-1006` sustained → the gateway is rejecting the browser path (Origin
  allow-list / KV config / rate limit) — the click-conversion leg is down.
- `TRK-3001` ever → a PII regression shipped; the key is stripped (no leak) but fix
  the source immediately and check Meta Blocked Parameters (INVARIANTS #16).

## API

```ts
import { report, getDiagnostics, clearDiagnostics, TRACKING_CODES } from '@/lib';
report('GATEWAY_NETWORK_FAIL', { event_name });  // emit a coded diagnostic
getDiagnostics();   // TrackingDiagnostic[] (the ring, newest last)
clearDiagnostics(); // reset the ring
```

The codes are exercised by `tests/observability.test.ts`, `tests/gateway.test.ts`,
and `tests/gateway-contract.test.ts` (the ingress-split guard surfaces TRK-1005;
connection failures surface TRK-1002/1006).
