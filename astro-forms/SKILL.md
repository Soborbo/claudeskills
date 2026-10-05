---
name: astro-forms
description: Lead-capture form backend for Soborbo's Astro + Cloudflare Workers lead-gen sites (UK and HU) - contact, callback and quote-request forms posting to an Astro API route, with Zod 4 validation, fail-closed Turnstile, honeypot, Rate Limiting binding, dedupe, forwarding to the Soborbo CRM signed webhook and Resend notification/confirmation emails. Use when adding, fixing or reviewing a website form that submits a lead, when submissions fail, get lost, double-count or let spam through, or when setting up Resend or postcode autofill for a form. Not for the multi-step quote calculator UI (lead-gen-calculator), not for dataLayer/ad-conversion events (soborbo-tracking), and not for Zod schemas unrelated to a form submission.
---

# Astro forms (lead capture)

A lead form on a Soborbo site has one job: get a real enquiry from a visitor into
the CRM and in front of the business, every time, without letting bots through.
This skill holds the rules and the reasons behind them. The code lives elsewhere.

## Where the code is

The canonical implementation is **`Soborbo/leadgen-template-site`** (local clone:
`~/dev/leadgen`, read `origin/main` after `git fetch`). Copy or adapt from there,
never from this skill. Files that make up the form pipeline:

| Concern | File |
|---|---|
| Endpoint (origin check, size/content-type limits, status codes, `cfContext`) | `src/pages/api/contact.ts` |
| Pipeline (honeypot, Zod, Turnstile, rate limit, dedupe, CRM, email) | `src/lib/forms/submit.ts` |
| Turnstile siteverify (fail-closed) / browser reset | `src/lib/forms/turnstile.ts`, `src/lib/forms/turnstile-widget.ts` |
| Rate limit, dedupe | `src/lib/forms/rate-limit.ts`, `src/lib/forms/dedupe.ts` |
| CRM signed webhook (HMAC, idempotent on `event_id`) | `src/lib/forms/crm.ts`, `src/lib/forms/conversion-map.ts` |
| Schema, sanitising, email typos | `src/lib/forms/schemas.ts`, `sanitize.ts`, `email-typos.ts` |
| Resend + templates | `src/lib/forms/email/resend.ts`, `email/send.ts`, `email-templates.ts` |
| Postcode autofill | `src/lib/forms/postcode-lookup.ts`, `public/postcodes.json` |
| Form UI | `src/components/sections/ContactForm.astro` |
| Bindings, vars, secrets list | `wrangler.jsonc` |
| Tests | `test/submit.test.ts`, `test/turnstile.test.ts`, `test/crm.test.ts`, `test/rate-limit.test.ts` |

The fail-closed Turnstile behaviour described below is in leadgen-template-site
**PR #1** (branch `fix/turnstile-fail-closed`). Until it is merged, `origin/main`
still has the old fail-open check: read the PR branch, not main, for Turnstile.

The template does not yet match every rule here. The dated list of known gaps is
in `references/perishable-facts.md` ("Template divergences"). When the template and
this skill disagree, the rule here is the decision; fix the template in its own
repo (separate PR) rather than copying the gap into a client site.

Do not build on `claudeskills/leadgen-starter-build`: it is an older snapshot and
has drifted (it still reads `locals.runtime.ctx`, which throws on Astro 6+).

## The one rule: a verified lead is never lost

Every design choice below follows from this. A lead that passed validation and the
bot check must end up somewhere durable, even if half the infrastructure is down,
and the visitor must not be told "error" for something that was in fact saved.

Order of the pipeline and why:

1. **Honeypot** - before anything else, before Zod. Filled = answer exactly like a
   success (200, no `eventId`), store nothing, send nothing. A distinct error would
   teach the bot which field is the trap.
2. **Zod validation** - 400 with the first field message. Client-side checks are
   UX only; the server owns the rules.
3. **Turnstile** - fail-closed (next section). No verified token, no lead.
4. **Rate limit** - 429 when over the limit. If the limiter itself errors, let the
   request through: a broken limiter must not turn into "too many requests" for
   every visitor.
5. **Dedupe** - same email (or phone when there is no email) + `formId` within 60 s
   that was already *delivered* = silent success with the **first** submission's
   `eventId`. The visitor sees the thank-you page, the browser conversion
   deduplicates instead of counting twice.
6. **CRM webhook** - the lead's primary record. HMAC-signed, idempotent on
   `event_id`, so retries cannot create duplicates. One quick inline attempt; on a
   transient failure, a bounded retry in `waitUntil`.
7. **Emails** - when the CRM accepted the lead, the business notification and the
   customer confirmation go in `waitUntil`: they never hold the response or fail
   the lead. When the CRM did *not* accept it, the notification is the fallback
   record, so await it before answering.
8. **Success** - when something durable accepted the lead (CRM, or the awaited
   notification email). Only if *both* failed is the visitor asked to call instead.
9. **Mark dedupe** - write the fingerprint *after* delivery. Writing it at check
   time locks the visitor out of retrying after a failed attempt, and that lead is
   gone.

The response is JSON `{ success, redirect, eventId, leadId, code }`, not a 302:
the browser fires the conversion only after a real success, with the server's
`eventId` (shared with the CRM and gateway legs so all three deduplicate). The
event names and the dataLayer side belong to **soborbo-tracking**; this skill only
guarantees the `eventId` contract.

Abandoned or partial forms are not saved as leads (decision I20). Abandonment may
be tracked as an analytics event, nothing more.

## Spam and abuse layers

| Layer | Rule | Why |
|---|---|---|
| Turnstile | Required, fail-closed | The only layer a bot cannot simply skip |
| Honeypot | Hidden `website` field, checked before Zod, silent 200 | Free; stops naive bots before a siteverify call |
| Rate limit | Cloudflare Rate Limiting binding, only on endpoints that send email or write to the CRM | Stops bursts and stops the confirmation email being used to spam third parties |
| Dedupe | 60 s, KV, silent success | Double clicks and lost responses |
| Origin check | Same origin or canonical host (www-agnostic); missing header is allowed | CSRF; privacy tools strip headers, and Turnstile stands behind it |

There is **no time-trap** (minimum fill time). The timestamp comes from the
client, so a bot sets it; Turnstile already covers what it was meant to catch.

### Turnstile: fail-closed

For widget setup, rendering modes and the generic siteverify recipe, load the
official **`turnstile-spin`** skill. What is specific to Soborbo sites:

- **Missing secret = server error (500), not a skipped check.** The old "if the
  secret is set, verify" pattern let every bot through on any site where the
  secret was forgotten. Missing token = 403. Siteverify unreachable or timed out
  = 503 (retryable). None of these lets the lead through.
- **Check the claims, not just `success`.** The returned `hostname` must be in the
  allowlist (`TURNSTILE_HOSTNAMES`, or the canonical host + the request's own
  host, www-agnostic). Each form sets `data-action` (`contact`, `quote`,
  `callback`, `exit-callback`) and the server rejects a token minted for another
  action. A success without a hostname cannot be tied to this site: reject.
- **Bounded:** token longer than 2048 characters is rejected without calling
  siteverify; the call has an `AbortSignal.timeout`.
- **Reset after every failed POST.** Tokens are single-use and siteverify consumes
  them even when a later stage fails, so a retry with the same token always gets
  `timeout-or-duplicate`. The browser calls `turnstile.reset()` on any error.
- **The site key is build-time.** `PUBLIC_TURNSTILE_SITE_KEY` (or the config value)
  is baked into the HTML. Set it in the Workers Builds *build* variables too, not
  only at runtime, or the widget never renders.

Details, status/code table and test keys: `references/turnstile.md`.

### Rate limit

Use the Workers Rate Limiting binding (`ratelimits` in `wrangler.jsonc`,
`env.FORM_LIMITER.limit({ key })`), not a KV counter: KV read-then-write is not
atomic and allows one write per second per key, so it neither counts nor blocks
reliably. Apply it only where a submission costs something (CRM write, email
send); the postcode lookup or a page view do not need it.

The binding's window is only 10 or 60 seconds, so the agreed "5 per IP per
10 minutes" cannot be expressed directly. Config, key choice and the trade-off:
`references/rate-limit.md`.

## Validation (Zod 4, en-GB / hu-HU)

Import from `astro/zod` (same Zod instance Astro uses). Zod 4 changes that bite in
form code, each tested to fail silently when written the Zod 3 way:

- `z.email()`, not `z.string().email()` (deprecated).
- Messages go in `{ error: '...' }`. `errorMap` no longer exists and is **silently
  ignored**: the translated Hungarian message never shows, the generic English one
  does.
- An HTML checkbox sends the string `"on"` (or nothing), never `true`.
  `z.literal(true)` therefore always fails. Use `z.literal('on').optional()` and map
  to a boolean.
- `.default()` applies to the output type after transforms; `.prefault()` is the
  old behaviour.

Phones are **normalised, not rejected**: pasted formats (`+44 (0)117 ...`,
`0044...`, `06 30 ...`, non-breaking spaces, dashes) are cleaned to E.164 by a
transform and then matched against the national pattern. A stricter client rule
than the server's only costs leads. Patterns and messages: `references/validation.md`.

Store the raw value. Escape at the output boundary (HTML email), never on input:
escaping on input puts `O&#39;Brien` into the CRM and double-escapes the email.

## Privacy notice, not a consent checkbox

A quote or callback request is processed to take steps before a contract (or
legitimate interest), not on consent. A mandatory "I agree / I consent to being
contacted" checkbox misstates the legal basis and blocks leads (ICO guidance, see
`references/perishable-facts.md`). So:

- Every form shows a short **privacy notice sentence with a link** to the privacy
  page, next to the submit button. No required checkbox.
- A **separate, unticked marketing opt-in** only if the site actually sends a
  newsletter or marketing email. It maps to its own field and is never required.
- The **submission timestamp is set on the server**, never taken from the client.
- `marketing_consent` (hidden field) is a snapshot of the cookie banner's
  advertising category at submit time, forwarded to the CRM so the ad conversion
  is gated on real consent. With CookieYes the category key is **`advertisement`**,
  not `marketing`; reading `marketing` silently sends 0 conversions. On sites
  running the own CMP, use the soborbo-tracking kit's `hasMarketingConsent()`.

## Email (Resend only)

Resend is the only provider; there is no Brevo fallback. Two emails per lead:

| Email | To | Reply-To | On failure |
|---|---|---|---|
| Business notification | `config.forms.notificationEmail` | the customer | Logged as critical; lead is still in the CRM |
| Customer confirmation | the visitor | the business | Logged; lead unaffected |

The customer confirmation is on by default (decision I7). It sends mail to an
address the visitor typed, so it can be abused to send mail to strangers. That is
why the rate limit and Turnstile sit in front of it, and why the confirmation
echoes only the name: never the free-text message or anything that could carry a
link. Skip it for callback requests where the visitor already has the quote email.

Rules that matter for deliverability and correctness:

- Always send a **plain-text part** as well as HTML.
- **Subject lines without emoji**, plain text (strip control characters; do not
  HTML-escape a subject, it would show `&amp;`).
- Send with an **`Idempotency-Key`** derived from `eventId` + template name, so a
  retried request cannot send the same email twice.
- From `noreply@<client domain>`, domain verified in Resend in the **EU region**.
- DNS: add exactly the records Resend issues - MX + SPF TXT on the **`send`
  subdomain**, DKIM at `resend._domainkey`. **Never edit the root SPF**: Soborbo
  domains receive mail via MXroute, and a second root SPF record is a permerror
  that breaks all mail for the domain. Do not add a second DMARC either.

Template structure (EN/HU), quote email layout, test matrix: `references/email.md`.

## Postcode autofill

- **UK:** postcodes.io (free, keyless), outward-code lookup, tidy the admin name
  ("Bristol, City of" -> "Bristol"). Optional convenience: failure is silent.
- **HU:** full GeoNames HU list (CC-BY 4.0, attribution required). Several
  settlements share one postcode, so a lookup can return a choice, not a single
  value. Load lazily (static JSON on first focus, or an `/api` endpoint).
- Never overwrite a city the visitor typed.

Data build, counts and the multi-settlement selector: `references/postcode.md`.

## Astro 6+/Workers pitfalls

Each of these has broken a live site:

- **Env:** `import { env } from 'cloudflare:workers'`. `Astro.locals.runtime.env`
  was removed in Astro 6 and throws. Type `env` with `wrangler types`
  (`npm run cf-typegen`), not a hand-written interface.
- **Execution context:** `Astro.locals.cfContext.waitUntil(...)`. Reading
  `locals.runtime.ctx` throws, and inside the try block it turned every submission
  into a 500. Do not destructure `waitUntil` off the context; bind it.
- **Never `import.meta.env` for secrets.** On Workers runtime secrets are not
  there (empty string -> the old Turnstile check skipped itself), and if they are
  present at build time they end up in the bundle.
- **Trailing slash:** the template uses `trailingSlash: 'always'`, so the form
  action and any `fetch` must be `/api/contact/`. The unslashed path 404s, and a
  redirect would turn the POST into a GET and drop the lead. Middleware must
  exempt `/api` from canonicalising redirects.
- **Top-level try/catch** in every API route, logging a stable code. An uncaught
  exception is a bare 500 with no stack in the logs.
- **Deploy with `--keep-vars`** (Workers Builds deploy and version commands), or
  every deploy resets dashboard plaintext vars to the `wrangler.jsonc` values.
- **Missing config must be loud.** Do not copy env into an object with `|| ''`
  for required values; a missing secret should fail the request (Turnstile) or
  the build (site key), not quietly degrade.

Symptom -> cause table: `references/troubleshooting.md`.

## Logging

Failures are logged as structured JSON (`console.error`) with a stable code
(`TURN-*`, `HTTP-429-001`, `CRM-WEBHOOK-*`, `EMAIL-*`, `FORM-*`) and the request
id, and read in **Workers Logs** (`"observability": { "enabled": true }` in
`wrangler.jsonc`). No PII in logs: no email, phone or full IP (mask or hash).

## Form markup essentials

Every lead form carries: a hidden `formId` / `request_type`, `source_page`,
the honeypot (`website`, visually hidden, `tabindex="-1"`, `autocomplete="off"`),
the hidden tracking fields filled by soborbo-tracking (`event_id`, UTM, click
ids, `marketing_consent`), the Turnstile widget with its `data-action`, the
privacy notice line, and a submit button that says what happens ("Request a
callback", not "Submit"). A status region with `aria-live` and focus on error, so
a failure is not rendered off-screen on a phone. No lead form on the thank-you
page or the 404.

## Checking that it works

A form is done when a real lead arrives, not when the success page shows. The
core test: **success page shown but the lead is not in the CRM = bug.** Also
confirm the customer confirmation actually arrived. Full list (Turnstile test
keys, replay, double click, CRM down, Resend down, missing secret, rate limit):
`references/testing.md`.

## References

| File | Open when |
|---|---|
| `references/turnstile.md` | Wiring or debugging the bot check; status codes; test keys |
| `references/rate-limit.md` | Adding the limiter binding; choosing the key and limit |
| `references/validation.md` | Writing the schema; phone/postcode patterns; HU/EN messages |
| `references/email.md` | Resend setup, templates, quote email, deliverability tests |
| `references/postcode.md` | UK lookup or HU GeoNames autofill |
| `references/troubleshooting.md` | A form fails in production |
| `references/testing.md` | Before calling a form done |
| `references/perishable-facts.md` | Versions, limits, prices, template divergences (dated) |
