# Calculator audit checklist

Read-only first. Verify every HIGH finding at file:line (and live with curl
where possible) before reporting. Never submit real leads to production.

## Code greps

| Invariant | Grep / look for |
|---|---|
| A | `JSON.stringify\([^)]*Object.keys` ; idempotency keys built from a subset of fields |
| B | `length === 0` / `else if` between quote branches; "both" options in the UI |
| C | branch-selecting handlers (product/service/mode/gateway click) that only *set* the new value; payload built from the whole state; hidden inputs inside hidden sections |
| D | `rows.length` / `entries.length` used as new index; remove handlers touching DOM only |
| E | `addEventListener` inside click/open handlers; submit buttons never disabled |
| F | compare HTML `min/max`, client JS checks, server schema for each numeric/text field; library-default error messages reaching the UI |
| G | reset/start-over handler vs every dynamic UI piece |
| H | `dataLayer.push` of conversions: before or after the server's explicit acceptance (not just a 2xx)? guard storage = sessionStorage only? fires on page load of a result/thank-you page? once-flag written before the push succeeded (or when the push is skipped for consent)? |
| I | attribution fields per form payload; `a.gclid \|\| b.gclid` merges; `localStorage` without try/catch; consent gating that drops click ids |
| J | where `step_completed` fires (render vs forward); `opened`/step flag set before the push succeeded; `value:` with strings; GTM tag param list vs pushed keys |
| K | does the API recompute price? order of dedupe write vs delivery; what returns 4xx/5xx when one sink fails |
| L | `.catch(()=>{})`, `.catch(function(){})`; result shown before fetch resolves; `res.ok` treated as success without checking `success`/`ok`/`deferred`/`pending`; tracking code inside the same `try` as the fetch (a tracking throw shown as a send error); stored lead answered 5xx because the e-mail failed; middleware allowlists without path normalisation |

## Tracking checks (GTM / GA4 APIs)

1. Live HTML contains the GTM container id (head + noscript) and a CMP.
2. Live container version has a GA4 event tag + trigger for every calculator event and forwards `step_id`, `option_value`, `calculator_name`, `event_id`.
3. GA4 property has those params as event-scoped custom dimensions; currency/timezone match the market.
4. 30-day event counts are plausible: `opened` users ≥ `step_completed` users ≥ `submitted` users; conversions ≈ server leads.
5. GA4 custom dimensions usually need a human with edit rights — list them as owner actions.

## Report format

Per site: table A–L (ÉRINTETT / RÉSZBEN / NEM ÉRINTETT / N/A, one line, file:line),
then "Egyéb hibák" by severity with repro, then a tracking section.
