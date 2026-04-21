---
name: astro-forms
description: Form infrastructure for Astro projects. Contact forms, booking forms, quote requests. Zod validation, email delivery (Resend/Brevo), rate limiting, Google Sheets, postcode lookup, spam protection.
---

# Astro Forms Skill

Server-side form handling for lead generation sites on Cloudflare Workers.

## Scope

This skill covers the **backend pipeline**: validation → spam check → storage → email → redirect → analytics. For form UI components, field layout, and styling see the project's frontend patterns. The one exception is `modifiers.md` which documents common form layout variants for reference.

## Implementation Sequence

When building a form, follow this order:

1. **Define the schema** — `references/schemas.md` → copy + adapt Zod schema
2. **Copy boilerplate** — `assets/boilerplate/lib/` → into `src/lib/forms/`
3. **Configure Worker** — `wrangler.toml` with KV binding, `wrangler secret put` for all secrets
4. **Set up Google Sheet** — create service account, share sheet, add column headers (row 1)
5. **Wire frontend** — form posts to `/api/submit`, includes Turnstile + honeypot + hidden fields
6. **Test locally** — `wrangler dev`, submit form, check email + Sheets
7. **Deploy** — `wrangler deploy`
8. **Audit** — run through Conversion Verdict below

## Required Policy (non-negotiable)

These apply regardless of tech stack choice:

| Policy | Rule |
|--------|------|
| Server-side validation | All input validated on server. Client validation is UX only. |
| Cookie consent | Handled by CookieYes banner (not per-form). |
| Spam protection | Minimum 2 layers required (e.g. honeypot + Turnstile). |
| Storage | Every valid submission persisted (Sheets, DB, or equivalent). |
| Confirmation email | Sent to customer. Failure = log + continue (don't lose the lead). |
| Business notification | Sent to business owner. Failure = alert. |
| Thank-you state | Redirect to `/thank-you` or show confirmation UI. |
| Analytics event | GTM `form_submit` event fired. |
| Input sanitisation | User input HTML-escaped before use in email templates. |
| Duplicate protection | Dedupe within 60s window on same email + formId. |

## Recommended Stack

| Concern | Tool | Notes |
|---------|------|-------|
| Validation | Zod | Server-side, type-safe |
| CAPTCHA | Cloudflare Turnstile | Invisible mode |
| Email (primary) | Resend | 3,000/month free tier |
| Email (fallback) | Brevo | Auto-switch on Resend failure |
| Rate limiting | Cloudflare KV | Eventually consistent — fine for form spam control |
| Storage | Google Sheets API | Service account auth, direct API. No webhook. |
| Runtime | Cloudflare Workers | `export default { fetch }` entry point |

## Canonical Submission Schema

One naming convention everywhere: **camelCase** in TypeScript, maps to storage columns.

```typescript
type FormSubmission = {
  leadId: string;          // Generated UUID
  formId: string;          // e.g. "contact-form"
  sourcePage: string;      // URL path where submitted
  submittedAt: string;     // ISO 8601 datetime
  name: string;
  email: string;
  phone?: string;
  message?: string;
  ipHash: string;          // SHA-256 of IP + daily salt, never raw IP
  userAgent?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referrer?: string;
};
```

All boilerplate, schemas, and references use these field names.

## Primary Conversion Declaration

**One form per page is THE conversion.**

```yaml
primary_conversion:
  type: form
  id: "contact-form"
  page: "/contact"
```

All other forms on the page are secondary (newsletter, etc.).

| Page Type | Forms Allowed |
|-----------|---------------|
| landing | Primary only |
| service | Primary only |
| contact | Primary only |
| calculator | Contact capture as final step only (calculator logic lives in lead-gen-calculator skill) |
| thank-you | Forbidden |
| 404 | Forbidden |

## Progressive Disclosure

Personal data only AFTER value is established.

| Step | Can Ask |
|------|---------|
| 1 | Service type, location, non-personal choices |
| 2 | Details, preferences |
| 3+ | Name, email, phone |

Asking email on step 1 is acceptable on high-intent pages (e.g. `/contact`) but should be avoided on exploratory pages. Use judgement, not a blanket rule.

## Spam Protection

All four layers recommended. Minimum two required.

| Layer | Implementation | Required |
|-------|---------------|----------|
| Honeypot | Hidden empty field, reject if filled | Yes |
| Time check | Reject if submitted < 3s after page load. Checked in handler, NOT in Zod schema. | Yes |
| Turnstile | Cloudflare invisible CAPTCHA | Recommended |
| Rate limit | 5 submissions per hour per IP via KV | Recommended |

## Failure Policy

What happens when part of the pipeline fails:

| Component | On Failure | Rationale |
|-----------|-----------|-----------|
| Zod validation | Return 400 + field errors | Normal flow |
| Turnstile | Return 400 | Likely bot |
| Rate limit | Return 429 | Protect system |
| Duplicate detected | Return 200 (silent OK) | Don't confuse user |
| Google Sheets API save | Log error, **continue** | Don't lose the lead over storage |
| Customer confirmation email | Log warning, **continue** | Lead is already captured |
| Business notification email | Log error + **alert** | Business must know about leads |
| Analytics/GTM | Log warning, **continue** | Client-side, can't guarantee |

**Core principle: never lose a valid lead because a secondary system failed.** Email and Sheets failures are logged and alerted, but the user sees success and the lead data is preserved in logs at minimum.

**Log failures with `console.error`, never `logger.debug`.** Cloudflare Workers production logs (wrangler tail, dashboard) only surface `console.log/warn/error`. A silent-catch that uses `logger.debug` is invisible in prod — you will burn hours on a "Sheets doesn't work" ghost. Every fire-and-forget `.catch(...)` in `submit.ts` / `sheets.ts` / email senders must call `console.error('[scope] ...', err)`.

## Google Sheets: `values:append` range rule

Google Sheets' `values:append` with a too-wide range (e.g. `SheetName!A:Z`) auto-detects the "table" by scanning right; if any right-side column has data (a status column, a formula, an old header), new rows are appended **starting from that column**, shifting everything. Symptom: the submission works, but in the sheet the data lands in column E, F, G… instead of A, B, C…

Rules:
1. The range must span **exactly** the columns you write: `` `${sheetName}!A:${columnLetter(headers.length)}` ``. The boilerplate in `assets/boilerplate/lib/sheets.ts` already does this — do not widen it.
2. Always pass `insertDataOption=INSERT_ROWS` (not the default `OVERWRITE`). This inserts new rows instead of filling blank cells wherever they happen to exist.
3. If a project adds a new column, update both the sheet headers (row 1) AND the column count in the append range — they must match.

## Conversion Verdict

| Condition | Verdict |
|-----------|---------|
| Form on forbidden page (thank-you, 404) | **FAIL** |
| CookieYes not configured | **FAIL** |
| No server-side validation | **FAIL** |
| No confirmation email configured | **FAIL** |
| No business notification configured | **FAIL** |
| No thank-you redirect/state | **FAIL** |
| No GTM event | **FAIL** |
| No input sanitisation in email templates | **FAIL** |
| Fewer than 2 spam protection layers | **WARN** |
| No duplicate protection | **WARN** |
| Personal data on step 1 (non-contact page) | **WARN** |
| Rate limiting not configured | **WARN** |
| All checks pass | **PASS** |

## Locale Support

The skill supports both `en-GB` and `hu-HU` locales. Locale affects:

- Zod validation error messages
- Phone number regex pattern
- Email template language
- Postcode format and lookup endpoint

Default locale is `en-GB` (UK service businesses). See `references/schemas.md` for locale-specific validation.

## Environment Variables

```env
RESEND_API_KEY=re_xxxxx
BREVO_API_KEY=xkeysib-xxxxx
GOOGLE_SERVICE_ACCOUNT_EMAIL=forms@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEET_ID=1aBcDeFgHiJkLmNoPqRsTuVwXyZ
TURNSTILE_SITE_KEY=0x...       # Frontend only
TURNSTILE_SECRET_KEY=0x...     # Backend only
IP_HASH_SALT=random-daily-salt
SITE_URL=https://example.com
```

**Critical: all backend env vars are accessed via the `env` parameter (Workers binding), NOT `import.meta.env`.** The `submit.ts` handler receives `env` from the Workers `fetch(request, env, ctx)` signature. Every boilerplate helper accepts `env` as a parameter.

For Google Sheets: create a service account in Google Cloud Console, download the JSON key, share the target spreadsheet with the service account email address, then set `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`, and `GOOGLE_SHEET_ID` as secrets.

## References

- [schemas.md](references/schemas.md) — Zod schemas (EN/HU), canonical types
- [email.md](references/email.md) — Email templates and delivery rules
- [resend-setup.md](references/resend-setup.md) — Resend DNS + account setup guide
- [cloudflare-setup.md](references/cloudflare-setup.md) — Turnstile, KV, Workers
- [modifiers.md](references/modifiers.md) — Form layout variants (UI reference)
- [schema-cta.md](references/schema-cta.md) — CTA structure and tracking

## Integration with Tracking Skill

This skill handles the **server-side pipeline** (validation, storage, email). The **soborbo-tracking** skill handles **client-side conversion tracking** (dataLayer, Meta CAPI beacon). They work together:

```
User clicks Submit
  → <TrackedForm> intercepts (tracking skill)
  → trackLeadSubmit() fires:
      • pushes lead_submit to dataLayer (GTM → GA4, Google Ads)
      • sends beacon to /api/track (Meta CAPI)
      • populates hidden fields (event_id, gclid, UTM)
  → form.submit() fires (native POST)
  → /api/submit receives the POST (this skill)
      • validates, dedup, Sheets, email
      • event_id links the two systems
```

**Key integration point:** The `event_id` hidden field connects the client-side conversion event with the server-side lead record. Both the Meta CAPI event and the Google Sheets row contain the same `event_id`, enabling deduplication and attribution reconciliation.

**What goes where:**
- `<TrackedForm>` wraps the HTML form (tracking skill component)
- `/api/track` receives the Meta CAPI beacon (tracking skill endpoint)
- `/api/submit` receives the form POST (this skill's endpoint)

## Boilerplate

Copy `assets/boilerplate/lib/` → `src/lib/forms/`. The key file is `submit.ts` which exports a Workers-compatible `fetch` handler and wires together all other modules. Use `ctx.waitUntil()` for non-blocking Sheets saves.

## Definition of Done

- [ ] Schema defined with correct locale
- [ ] `submit.ts` handler wired up
- [ ] Env vars configured (local + production)
- [ ] CookieYes consent banner configured
- [ ] Spam protection: minimum 2 layers active
- [ ] Duplicate protection active
- [ ] Customer confirmation email sends
- [ ] Business notification email sends
- [ ] Thank-you redirect works
- [ ] GTM event fires
- [ ] User input escaped in email HTML
- [ ] conversion_verdict = PASS
