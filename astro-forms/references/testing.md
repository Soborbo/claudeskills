# Checking that a form works

The principle: **a success page with no lead in the CRM is a bug**, however green
everything else looks. A test that stops at "redirected to /thank-you/" proves
only that the browser got a 200.

## Automated (in leadgen-template-site)

`npm test` covers the pipeline with mocks (`test/submit.test.ts`,
`test/turnstile.test.ts`, `test/crm.test.ts`, `test/rate-limit.test.ts`): missing
secret -> config error, missing/spent token -> rejection, wrong hostname/action ->
rejection, siteverify timeout/5xx, honeypot silent success, duplicate -> same
`eventId`, Resend down but CRM up -> lead delivered, both down -> refused, CRM
transient failure -> `waitUntil` retry, `O'Brien` stored raw and escaped once.
Run `npm run check` and `npm run build` too.
When you change pipeline behaviour, change the tests in the same PR.

## Local end to end

`npm run build` then `npx wrangler dev` (the Workers runtime, not `astro dev`, so
bindings and `cloudflare:workers` behave as in production). Use the Turnstile
dummy keys (perishable facts) and the matching `TURNSTILE_HOSTNAMES` in
`.dev.vars`.

| Check | Expected |
|---|---|
| Valid submission | 200 JSON with `eventId`; lead in the CRM (dev/staging company); notification and confirmation received |
| Same form twice within 60 s | One CRM lead, one notification; second response has the first `eventId` |
| Honeypot filled (devtools) | 200 without `eventId`; nothing stored, no email |
| No token (remove the widget) | 403 `TURN-TOKEN-001`, nothing stored |
| Replay a used token (curl) | 403 `TURN-VERIFY-002` |
| Secret unset | 500 `CFG-ENV-004`, nothing stored |
| Error then retry in the browser | Widget resets; retry succeeds |
| Burst over the limit (script) | 429 `HTTP-429-001` |
| CRM URL pointed at a dead host | Visitor sees success; notification email arrived; log `CRM-WEBHOOK-*` |
| Resend key invalid, CRM up | Visitor sees success; lead in CRM; log `EMAIL-*` |
| Both down | Visitor sees the error with the phone number; nothing claims success |

## After deploy (production)

Submit one real test lead on the live domain (use the site's designated test
email) and confirm, by looking, not by status codes:

1. The lead is in the CRM with the right company, surface (contact/quote/callback)
   and `marketing_consent` value.
2. The business notification arrived, Reply-To is the test address.
3. The customer confirmation arrived in the test inbox (not Spam), plain-text part
   present, links carry `utm_source=email`.
4. Workers Logs show the request id with no error codes.
5. Delete or mark the test lead in the CRM so it does not pollute reporting.

Conversion events (GA4/Ads/Meta) are verified with the soborbo-tracking skill,
not here.
