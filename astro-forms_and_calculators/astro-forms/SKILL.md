---
name: astro-forms
description: Form infrastructure for Astro projects. Use for any form submission - contact forms, booking forms, quote requests. Includes Zod validation, email delivery (Resend/Brevo), rate limiting, Google Sheets integration, postcode lookup, spam protection.
---

# Astro Forms Infrastructure

Reusable form handling for any Astro project.

## Quick Start

1. Copy `assets/boilerplate/` to project's `src/lib/forms/`
2. Set up Cloudflare KV for rate limiting
3. Configure email provider (Resend primary, Brevo fallback)
4. Set up Google Sheets webhook
5. Copy `wrangler.toml` and `.env.example`

## Core Features

- **Zod validation** - server-side, never trust client
- **Email delivery** - Resend primary, Brevo auto-fallback
- **Rate limiting** - Cloudflare KV based
- **Cloudflare Turnstile** - invisible CAPTCHA, Cloudflare-native
- **GDPR checkbox** - required, stores consent timestamp
- **Google Sheets** - all submissions stored, no database
- **Spam protection** - honeypot + time-check + Turnstile
- **Postcode lookup** - HU/UK support, debounced (300ms)
- **Email typo detection** - Levenshtein-based suggestions
- **CSP headers** - security by default
- **Structured logging** - requestId in all API calls

## Directory Structure

```
src/lib/forms/
├── schemas.ts        # Zod schemas
├── email/
│   ├── send.ts       # Unified sender
│   ├── resend.ts     # Primary provider
│   └── brevo.ts      # Fallback provider
├── turnstile.ts      # Cloudflare Turnstile verification
├── rate-limit.ts     # KV-based limiting
├── logger.ts         # Structured logging
├── postcode.ts       # Lookup with debounce
├── email-typo.ts     # Typo detection
└── sheets.ts         # Google Sheets integration
```

## Zod Validation

Always use `safeParse`, never `parse`:

```typescript
const result = schema.safeParse(body);
if (!result.success) {
  return json({ errors: result.error.flatten().fieldErrors }, 400);
}
const data = result.data; // Type-safe
```

## Spam Protection

Two layers, both required:

```typescript
// 1. Honeypot - must be empty
company: z.string().max(0).optional().default('')

// 2. Time check - min 3 seconds to fill
formStartTime: z.coerce.number().refine(
  (start) => Date.now() - start > 3000
)
```

## Email Fallback

```typescript
// Auto-switches on failure
const result = await sendEmail(options);
// result.provider = 'resend' | 'brevo'
// result.success = boolean
```

## Rate Limiting

```typescript
const limit = await checkRateLimit('submit', ip);
if (!limit.allowed) {
  return json({ error: 'Too many requests' }, 429);
}
```

## Postcode Lookup

- HU: 4 digits → city from JSON
- UK: alphanumeric → api.postcodes.io
- Debounce: 300ms
- City autofill: green flash animation (1s)

## Cloudflare Turnstile

Invisible CAPTCHA - better UX than reCAPTCHA, Cloudflare-native.

```html
<!-- In form -->
<div class="cf-turnstile" data-sitekey="{{TURNSTILE_SITE_KEY}}"></div>
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
```

Server-side verification required - see [references/turnstile.md](references/turnstile.md)

## GDPR Consent

Required checkbox with timestamp storage.

```typescript
// Schema
gdprConsent: z.literal(true, {
  errorMap: () => ({ message: 'GDPR hozzájárulás kötelező' })
}),
gdprTimestamp: z.string().datetime()

// Store in Sheets
gdprConsentAt: new Date().toISOString()
```

## References

- **Zod schemas**: See [references/schemas.md](references/schemas.md)
- **Email setup**: See [references/email.md](references/email.md)
- **Rate limiting**: See [references/rate-limit.md](references/rate-limit.md)
- **Turnstile**: See [references/turnstile.md](references/turnstile.md)

## Environment Variables

```env
RESEND_API_KEY=re_xxxxx
BREVO_API_KEY=xkeysib-xxxxx
GOOGLE_SHEETS_WEBHOOK_URL=https://script.google.com/...
SITE_URL=https://example.com
TURNSTILE_SITE_KEY=0x...
TURNSTILE_SECRET_KEY=0x...
```

## Cloudflare KV

```toml
# wrangler.toml
[[kv_namespaces]]
binding = "RATE_LIMIT_KV"
id = "your-kv-namespace-id"
```
