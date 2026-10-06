# Perishable facts

Everything here can change without notice. Each line has the date it was checked
and its source. Review every six months (next: 2027-04) or when something here
contradicts what you see.

## Versions (checked 2026-10-05, `npm view`)

| Package | Latest | In leadgen-template-site |
|---|---|---|
| astro | 7.3.5 | ^7.3.3 |
| @astrojs/cloudflare | 14.3.3 | ^14.3.2 |
| zod | 4.6.5 | 4.6.5 (via `astro/zod`) |
| wrangler | 4.147.0 | ^4.135.0 |

Refresh with Context7 (`/withastro/docs`, `/colinhacks/zod`, `/websites/resend`)
or the official docs below before relying on API details.

## Astro / Cloudflare adapter (checked 2026-10-05)

- `Astro.locals.runtime` removed with Astro 6 / adapter v13; env via
  `import { env } from 'cloudflare:workers'`, execution context via
  `Astro.locals.cfContext`. Source: Astro Cloudflare integration guide,
  https://docs.astro.build/en/guides/integrations-guide/cloudflare/ (Context7 `/withastro/docs`).
- Astro recommends importing Zod from `astro/zod`. Source: Astro v6 upgrade guide,
  https://docs.astro.build/en/guides/upgrade-to/v6/

## Zod 4 (checked 2026-10-05)

- `z.email()` top level; `z.string().email()` deprecated; `message` param
  auto-migrated to `error`; custom `errorMap` dropped; `z.flattenError()`;
  `.default()` applies to output, `.prefault()` for the old behaviour.
  Source: https://zod.dev/v4/changelog , https://zod.dev/error-customization
- `errorMap` being silently ignored and `z.literal(true)` failing on `"on"`:
  tested with Zod 4.6.5 (review 06-urlap-kalkulator, 2026-10-02).

## Turnstile (checked 2026-10-05)

- Siteverify: `POST https://challenges.cloudflare.com/turnstile/v0/siteverify`,
  form or JSON; params `secret`, `response`, optional `remoteip`,
  `idempotency_key`. Token max 2048 characters, valid 300 s, single use;
  replay/expiry -> `timeout-or-duplicate`. Response has `hostname`, `action`,
  `cdata`, `challenge_ts`. Source:
  https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
  (page updated 2026-09-16).
- Dummy keys. Sitekeys: `1x00000000000000000000AA` pass (visible),
  `2x00000000000000000000AB` fail (visible), `1x00000000000000000000BB` pass
  (invisible), `2x00000000000000000000BB` fail (invisible),
  `3x00000000000000000000FF` forces interactive. Secrets:
  `1x0000000000000000000000000000000AA` pass, `2x0000000000000000000000000000000AA`
  fail, `3x0000000000000000000000000000000AA` "token already spent". Source:
  https://developers.cloudflare.com/turnstile/troubleshooting/testing/ (updated 2026-05-05).
- **Conflict:** the docs say the passing dummy secret returns `hostname: "localhost"`,
  `action: "test"`; leadgen-template-site PR #1 reports observing
  `hostname: "example.com"` and no action. Check before setting
  `TURNSTILE_HOSTNAMES` in `.dev.vars`.

## Workers Rate Limiting binding (checked 2026-10-05)

- GA since 2025-09-19. Config `ratelimits: [{ name, namespace_id, simple: { limit,
  period } }]`, `period` must be 10 or 60. `limit({ key })` -> `{ success }`.
  Counted per Cloudflare location; "permissive, eventually consistent", not an
  accounting system. Cloudflare advises against IP keys (shared addresses).
  Plan availability and pricing are not stated on the page.
  Sources: https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/
  (updated 2026-04-23); https://developers.cloudflare.com/changelog/post/2025-09-19-ratelimit-workers-ga/
- KV: about one write per second to the same key; minimum `expirationTtl` 60 s;
  cross-location visibility up to 60 s. Source:
  https://developers.cloudflare.com/kv/api/write-key-value-pairs/

## Resend (checked 2026-10-05)

- Free plan: 100 emails/day (UTC calendar day) and 3,000/month; **received mail
  counts too**; each To/CC/BCC recipient counts. Over quota -> 429
  `daily_quota_exceeded` / `monthly_quota_exceeded`. Paid plans have no daily cap
  (Pro from $20/month for 50,000). Source: https://resend.com/docs (account
  quotas, pricing; Context7 `/websites/resend`).
- Domain regions: `us-east-1` (default), `eu-west-1`, `sa-east-1`,
  `ap-northeast-1`; Return-Path subdomain defaults to `send`. DNS records issued:
  `send` MX `feedback-smtp.<region>.amazonses.com`, `send` TXT
  `v=spf1 include:amazonses.com ~all`, `resend._domainkey` TXT DKIM. Source:
  https://resend.com/docs/api-reference/domains/create-domain
- `Idempotency-Key` header: 1-256 characters, expires after 24 hours. Source:
  https://resend.com/docs/dashboard/emails/idempotency-keys

## postcodes.io (checked 2026-10-02)

- Free, keyless, ONS data updated quarterly, no published SLA or rate limit.
  Source: https://postcodes.io/docs/overview/

## GeoNames HU (checked 2026-10-05)

- `https://download.geonames.org/export/zip/HU.zip`: 3046 postcodes, 3571
  settlement rows, 335 postcodes with more than one settlement (counted from the
  file). Licence: CC-BY 4.0 (readme in the zip).

## Legal basis for enquiry forms (checked 2026-10-02)

- ICO: consent is not appropriate when you would process the data anyway; for a
  quote request the basis is steps before a contract / legitimate interest.
  Source: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/lawful-basis/consent/when-is-consent-appropriate/
- Hungarian (NAIH) practice on enquiry forms: **not verified**.

## Template divergences (leadgen-template-site, checked 2026-10-05)

State of `origin/main` 8595c8c plus PR #1 (`fix/turnstile-fail-closed`,
326c3e5). Each item is a template fix to make in that repo, not something to copy.

| # | Rule in this skill | What the template does |
|---|---|---|
| 1 | Turnstile fail-closed | Only on the PR #1 branch; `origin/main` still skips the check without a secret |
| 2 | Privacy notice, no required checkbox (I4) | Required `consent` checkbox (`schemas.ts` `z.literal('on')`, `ContactForm.astro`, `config.forms.consentText`) |
| 3 | Rate Limiting binding only (I3) | KV counter 5/hour as default; binding commented out in `wrangler.jsonc` (`RATE_LIMITER`, 20/60 s) |
| 4 | CRM first, emails in `waitUntil` | Admin email awaited first, then CRM; confirmation in `waitUntil` |
| 5 | No Google Sheets in the default path (I5) | Sheets leg still in `submit.ts`, dormant unless `GOOGLE_SHEET_ID` is set |
| 6 | Resend `Idempotency-Key` | Not sent (`email/resend.ts`) |
| 7 | Customer subjects without emoji | OK: only the internal admin subject has a coloured emoji, which is allowed (owner's choice, 2026-10-06) |
| 8 | HU postcode selector for shared codes | `public/postcodes.json` 3047 single-value entries, no selector, no GeoNames notice |
| 9 | Logging to Workers Logs (I13) | Reports go to a tail-consumer Worker that is being retired (`reportServerError`, `tail_consumers`); no `observability` block in `wrangler.jsonc` |
| 10 | Required env not masked | `contact.ts` copies env with `\|\| ''` (harmless for Turnstile after PR #1, still hides other gaps) |
| 11 | CookieYes `advertisement` | Code is correct (kit), but a comment in `schemas.ts` still says `marketing` |
