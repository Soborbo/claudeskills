# Email: Resend setup, templates, deliverability

Resend is the only provider (no Brevo). Code: `src/lib/forms/email/resend.ts`,
`email/send.ts`, `email-templates.ts` in leadgen-template-site. Current limits and
prices are in `perishable-facts.md`.

## Domain setup

1. Add the client's domain in Resend with **region `eu-west-1`** (EU). The default
   is `us-east-1`; UK/HU personal data has no reason to leave the EU/UK path. The
   region is chosen per domain at creation.
2. Add **exactly the records Resend shows** for that domain. Today they are:
   - `send` MX -> `feedback-smtp.<region>.amazonses.com` (bounce/complaint return path)
   - `send` TXT -> `v=spf1 include:amazonses.com ~all`
   - `resend._domainkey` TXT -> the DKIM key
3. **Do not touch the root SPF or root MX.** Soborbo domains receive mail on
   MXroute; the Resend SPF lives on `send.<domain>` and does not conflict. Adding
   a second `v=spf1` record at the root is a permerror and breaks SPF for all mail
   on the domain. The older instruction "TXT @ v=spf1 include:_spf.resend.com" was
   wrong for us.
4. DMARC: if the domain already has `_dmarc`, leave it. DKIM on the client domain
   aligns, so Resend mail passes the existing policy.
5. Verify in Resend, then send one test from the dashboard before wiring code.

Secrets: `RESEND_API_KEY` via `wrangler secret put`, never in `wrangler.jsonc`,
`.env` committed files or any `PUBLIC_*` variable.

## Sending

- `from`: `Business Name <noreply@<client domain>>` (the verified domain).
- Always both `html` and `text`. HTML-only mail scores worse with spam filters,
  and some clients and screen readers use the text part.
- `Idempotency-Key` header: `${eventId}:${template}` (e.g.
  `a1b2...:admin-notification`). Resend dedupes the same key for 24 hours, so a
  retried request (CRM fallback path, waitUntil retry) cannot send twice.
- Timeout every call (`AbortSignal.timeout`), check `res.ok`, log the status and
  the first part of the body on failure. A 429 with `daily_quota_exceeded` means
  the free plan's daily cap; see perishable facts.
- Subject: plain text, **no emoji**, strip CR/LF and control characters, cap the
  interpolated name (template: 50 characters). Do not HTML-escape the subject.
- Body: escape every interpolated value at output time (`escapeHtml`), including
  values that "can't" contain HTML. Never escape on input.

## Business notification

| Part | Content |
|---|---|
| Subject | Lead type + name, e.g. `New callback request - Jane Smith` / `Visszahívást kér: Kiss Anna` |
| Reply-To | The customer's email (so "reply" goes to the lead) |
| Body | Name, email, phone, postcode, message, source page, UTM source/medium/campaign, "how did you hear", referrer, server timestamp |
| Priority cue | Callback requests are visually distinct (red header) so the business calls at once. Put the type in words in the subject, not as an emoji. |

## Customer confirmation (on by default)

| Part | EN | HU |
|---|---|---|
| Subject | `We got your request - {Business}` | `Megkaptuk megkeresését - {Cég}` |
| Greeting | Hi {name}, | Kedves {név}! |
| Body | We received your request and will be in touch shortly. | Megkaptuk megkeresését, hamarosan felvesszük Önnel a kapcsolatot. |
| Urgent | Phone number for urgent matters | Telefonszám sürgős esetre |
| Footer | Automated message notice + company details | Automatikus üzenet + cégadatok |
| Reply-To | Business address | Business address |

Echo only the name. Do not include the visitor's message or any other free text:
the confirmation goes to an address the visitor typed, and echoing their text
turns the form into a relay for spam to third parties. Links in the confirmation
carry `utm_source=email` so a return visit is attributed to email.

## Quote email (calculator leads)

When the lead carries a price (quote calculator), the customer email is the quote:

| Section | Content |
|---|---|
| Header | "Your quote is ready" / "Elkészült árajánlata" |
| Summary | The answers that drive the price, in plain words |
| Price | The server-calculated price or range, never the client's number |
| CTA | One button: view the full quote / request a callback |
| Validity | Date until the quote is valid |
| Footer | Contact details, automated notice |

The calculator UI and pricing logic belong to the lead-gen-calculator skill.

## Plain-text part

- Same content as the HTML, in the same order.
- Short lines (about 70 characters), blank lines between sections.
- Links as full URLs; no "click the button above".

## Test matrix

Before a site goes live, send a real notification and confirmation and check:

| Client | Check |
|---|---|
| Gmail web + Gmail app (Android/iOS) | Layout, not in Spam/Promotions, links work |
| Outlook (desktop or outlook.com) | Layout (tables, no CSS-only layout), images off still readable |
| Apple Mail (iOS) | Layout, dark mode readable |
| Any client, text view | Plain-text part is complete |

Also: From name = business name, Reply-To correct in both emails, headers show
`dkim=pass` for the client domain and `spf=pass` for `send.<domain>`.
