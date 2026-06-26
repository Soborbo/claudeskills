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

## Codes

| Code | Severity | When | Likely cause if it spikes after a deploy |
|------|----------|------|------------------------------------------|
| `TRK-1000` | info | Gateway dispatch sent (ring/heartbeat) | — |
| `TRK-1001` | warn | Gateway dispatch skipped: **no Turnstile token** | Turnstile broke (script blocked / CSP / sitekey), or `<Turnstile/>` removed |
| `TRK-1002` | error | **Gateway POST failed** (network/transport) | Gateway route/worker down, CORS, DNS, bad `/api/event/*` binding |
| `TRK-1003` | info | `sendBeacon` unavailable/failed → used `fetch` keepalive | Usually benign (browser/UA), watch if it becomes constant |
| `TRK-1004` | warn | Gateway dispatch sent **token-less** (degraded: phone/email/whatsapp click) | Turnstile is failing (script blocked / CSP / slow). The money signal is still delivered via the gateway's degraded mode — but fix Turnstile; usually co-occurs with `TRK-2xxx`. |
| `TRK-2001` | warn | Turnstile script not loaded | `api.js` blocked / not included / slow |
| `TRK-2002` | warn | Turnstile container `#cf-turnstile-invisible` missing | `<Turnstile/>` not rendered in the layout |
| `TRK-2003` | warn | Turnstile challenge timed out | Turnstile service issue / interactive challenge on an invisible widget |
| `TRK-2004` | error | `PUBLIC_TURNSTILE_SITE_KEY` is empty → every server-side dispatch is skipped | The sitekey env var is missing from the build |
| `TRK-3001` | error | **PII-shaped key blocked from a dataLayer push** | A code change started pushing raw PII — a GDPR regression. Fix the push; route PII via `setUserDataForEC()` |

> `TRK-1xxx` = worker connection, `TRK-2xxx` = Turnstile, `TRK-3xxx` = data integrity.
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
- `TRK-1002` at all → the gateway is unreachable. Page/lead conversions are not
  reaching Meta CAPI / Google Ads server-side.
- `TRK-1001` / `TRK-2xxx` sustained → Turnstile is down → **every** server-side
  dispatch is being skipped.
- `TRK-3001` ever → a PII regression shipped; the key is stripped (no leak) but fix
  the source immediately and check Meta Blocked Parameters (INVARIANTS #16).

## API

```ts
import { report, getDiagnostics, clearDiagnostics, TRACKING_CODES } from '@/lib';
report('GATEWAY_NETWORK_FAIL', { event_name });  // emit a coded diagnostic
getDiagnostics();   // TrackingDiagnostic[] (the ring, newest last)
clearDiagnostics(); // reset the ring
```

The codes are exercised by `tests/observability.test.ts`, `tests/gateway-contract.test.ts`
(connection failures surface the right codes), and `tests/flow.test.ts` (the lead is
never blocked by a slow/failed worker).
