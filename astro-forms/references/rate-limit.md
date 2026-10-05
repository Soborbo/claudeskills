# Rate limiting form submissions

Decision I3: the Cloudflare Workers Rate Limiting binding, on the endpoints that
write to the CRM or send email. No KV counter.

## Why not KV

A KV counter is read, incremented and written back. Two concurrent requests both
read the same count, and KV allows about one write per second to the same key, so
a burst slips through. It is also eventually consistent across locations. It looks
like a limit and does not behave like one.

## Config

`wrangler.jsonc`:

```jsonc
"ratelimits": [
  {
    "name": "FORM_LIMITER",
    "namespace_id": "1001",          // unique per limiter within the account
    "simple": { "limit": 5, "period": 60 }  // period must be 10 or 60
  }
]
```

Run `npm run cf-typegen` (`wrangler types`) afterwards so `env.FORM_LIMITER` is
typed. Call it after Turnstile, before the CRM/email legs:

```ts
const { success } = await env.FORM_LIMITER.limit({ key });
```

Reference implementation: `src/lib/forms/rate-limit.ts` (`checkRateLimit`, the
binding branch). Respond `429` with the translated "too many requests" message and
the `HTTP-429-001` log code.

## Key

There is no logged-in user on a lead form, so the key is the client IP
(`CF-Connecting-IP`), hashed, optionally combined with the `formId`. Cloudflare
recommends against IP keys because mobile carriers and offices share addresses
(CGNAT). That is why the limit must be generous: it exists to stop a burst from one
source, not to meter normal visitors. A family submitting a quote and a callback
from one phone must still get through.

## The 10-minute problem

The agreed target is about 5 submissions per IP per 10 minutes. The binding only
counts per 10 s or 60 s window, and counts per Cloudflare location, "permissive and
eventually consistent". So:

- `limit: 5, period: 60` is the closest honest setting: it stops floods and
  scripted bursts, which is the real risk (including confirmation-email abuse).
- A slow attacker (one request a minute) is not stopped by the binding. Turnstile
  is what stops automated slow abuse; the limiter is a burst guard.
- A strict per-10-minute count needs a Durable Object. Not worth it at our volume
  unless abuse actually shows up in the logs.

## Fail-open

If `limit()` throws, log it and let the request through. A limiter outage must not
show every visitor "too many requests"; the lead matters more than the counter.
This is the opposite of Turnstile, on purpose: Turnstile is the security control,
the limiter is a cost and abuse guard.

## Where not to use it

Not on the postcode lookup, not on page views, not on the error-log endpoint. Only
where a submission costs something (CRM row, sent email).

Local dev: the binding does not share state with production; test the 429 branch
with a mock (`test/rate-limit.test.ts`).
