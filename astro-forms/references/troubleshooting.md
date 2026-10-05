# Troubleshooting: symptom -> likely cause

Read Workers Logs first (Cloudflare dashboard -> Workers -> the site -> Logs, or
`npx wrangler tail`). Every pipeline failure logs a stable code and a request id.

| Symptom | Likely cause | Fix |
|---|---|---|
| Every submission returns 500, bare body | `locals.runtime.env` or `locals.runtime.ctx` read on Astro 6+ (throws) | `import { env } from 'cloudflare:workers'`; `locals.cfContext` |
| 500 with no useful log line | No top-level try/catch in the API route | Wrap the handler, log a code |
| Every submission 500, log `CFG-ENV-004` | `TURNSTILE_SECRET_KEY` secret missing on this Worker | `wrangler secret put TURNSTILE_SECRET_KEY` |
| Every submission 500, log `TURN-KEY-002` | Wrong secret (other widget, test secret in prod) or no hostname allowlist | Match secret to the widget's site key |
| Every submission 403 `TURN-TOKEN-001` | Widget never rendered, so no token is sent | See the next three rows |
| No widget in the HTML at all | Site key not available at **build** time (only set at runtime), or still a placeholder | Add it to Workers Builds build variables / site config, rebuild |
| Widget area empty, console `TurnstileError: 110200` | Domain not in the widget's hostname list in the Turnstile dashboard | Add every domain incl. `www.` and the `workers.dev` preview |
| Widget visible, still `TURN-TOKEN-001` | Widget inside a hidden container, or the form posts before the challenge finished | Render visibly; disable submit until a token exists |
| First retry after an error always 403 `TURN-VERIFY-002` | No `turnstile.reset()` after a failed POST; spent token replayed | Reset in the error path |
| 403 `TURN-VERIFY-001`, log says `hostname-mismatch` | Request from a host not in `TURNSTILE_HOSTNAMES` / canonical host | Fix the var; never add `localhost` in production |
| 403 `TURN-VERIFY-001`, `action-mismatch` | New form without its action in the server map, or test key returning `test` | Add the action to `TURNSTILE_ACTIONS` |
| 503 `TURN-VERIFY-003` | Siteverify timeout / Cloudflare-side issue | Transient; visitor retries |
| 404 on POST | Missing trailing slash with `trailingSlash: 'always'` | `/api/contact/` |
| POST arrives as GET / body lost | A canonicalising redirect hit `/api/*` | Exempt `/api` from redirects in middleware |
| 403 `Forbidden`, log `FORM-CORS-001` | Form posted from another origin (iframe, old domain) | Post from the canonical or same origin |
| 429 for ordinary visitors | Limiter too tight for shared IPs | Raise the limit; key choice in `rate-limit.md` |
| Plain vars reset after deploy | Deploy without `--keep-vars`, placeholders in `wrangler.jsonc` `vars` | Add `--keep-vars` to deploy and version commands |
| Success page, lead not in CRM | CRM vars/secret missing (CRM leg dormant) or CRM 4xx | Check `CRM_*` config; logs `CRM-WEBHOOK-*` |
| Success page, no notification email | Resend key missing, domain unverified, quota hit (`daily_quota_exceeded`) | Check Resend dashboard and logs `EMAIL-*` |
| Hungarian validation messages show in English | Zod 3 `errorMap` (ignored in Zod 4) | `{ error: '...' }` |
| Checkbox field always invalid | `z.literal(true)`; the browser posts `"on"` | `z.literal('on').optional()` |
| `O&#39;Brien` in the CRM, `&amp;` in emails | Escaping on input | Store raw, escape at HTML output |
| Same lead twice in the CRM | Different `event_id` per attempt (client minted a new one) | Reuse the server-returned `eventId` |
| Ad conversions 0 although leads arrive | Consent snapshot read the CookieYes `marketing` key | Use `advertisement` (or the kit's `hasMarketingConsent()`) |
| HU postcode fills the wrong village | Single-value map for a shared postcode | Selector per `postcode.md` |
