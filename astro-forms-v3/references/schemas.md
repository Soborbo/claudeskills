# Zod Schemas

## Canonical Submission Type

This is the single source of truth. All schemas validate INTO this shape.

```typescript
// src/lib/forms/types.ts

export type FormSubmission = {
  leadId: string;
  formId: string;
  sourcePage: string;
  submittedAt: string;
  name: string;
  email: string;
  phone?: string;
  message?: string;
  ipHash: string;
  userAgent?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referrer?: string;
};

export type Locale = 'en-GB' | 'hu-HU';
```

## Locale-Aware Validation

```typescript
// src/lib/forms/schemas.ts
import { z } from 'zod';
import type { Locale } from './types';

const messages = {
  'en-GB': {
    nameRequired: 'Name is required',
    emailInvalid: 'Please enter a valid email address',
    phoneInvalid: 'Please enter a valid phone number',
  },
  'hu-HU': {
    nameRequired: 'Név megadása kötelező',
    emailInvalid: 'Érvényes email cím szükséges',
    phoneInvalid: 'Érvényes telefonszám szükséges',
  },
} as const;

const phonePatterns = {
  'en-GB': /^(\+44|0)\d{10,11}$/,
  'hu-HU': /^(\+36|06)\d{8,9}$/,
} as const;

export function createContactSchema(locale: Locale = 'en-GB') {
  const msg = messages[locale];
  const phoneRegex = phonePatterns[locale];

  return z.object({
    // Contact fields
    name: z.string().min(2, msg.nameRequired),
    email: z.string().email(msg.emailInvalid),
    phone: z.string().regex(phoneRegex, msg.phoneInvalid).optional(),
    message: z.string().max(2000).optional(),

    // Form metadata
    formId: z.string().min(1),
    sourcePage: z.string().min(1),

    // Spam — honeypot (must be empty)
    honeypot: z.string().max(0).optional().default(''),

    // Turnstile token
    'cf-turnstile-response': z.string().min(1).optional(),

    // UTM tracking
    utmSource: z.string().optional(),
    utmMedium: z.string().optional(),
    utmCampaign: z.string().optional(),
    referrer: z.string().optional(),
  });
}

export type ContactFormInput = z.infer<ReturnType<typeof createContactSchema>>;
```

## Calculator Schema

For the final contact capture step in a multi-step calculator.

```typescript
export function createCalculatorSchema(locale: Locale = 'en-GB') {
  const base = createContactSchema(locale);

  return base.extend({
    // Calculator-specific
    quoteId: z.string().min(1),
    answers: z.record(z.string(), z.unknown()),
    priceEstimate: z.number().optional(),
  });
}
```

## Validation Usage in Handler

```typescript
// In submit.ts handler
const schema = createContactSchema('en-GB');
const result = schema.safeParse(body);

if (!result.success) {
  return new Response(JSON.stringify({
    errors: result.error.flatten().fieldErrors,
  }), { status: 400 });
}

const validated = result.data; // Type-safe
```

## What Is NOT in the Schema

These checks happen in the handler (`submit.ts`), not in Zod:

| Check | Why not in Zod |
|-------|---------------|
| Time check (< 3s) | `Date.now()` in schema makes testing brittle |
| Turnstile verification | Async API call, not a shape concern |
| Rate limiting | Infrastructure concern |
| Duplicate detection | Requires storage lookup |
| IP hashing | Runtime concern using env salt |
| Lead ID generation | Generated server-side, not user input |

## Field Reference

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | string | Yes | Min 2 chars |
| email | string | Yes | RFC 5322 format |
| phone | string | No | UK: `+44`/`0` prefix. HU: `+36`/`06` prefix |
| message | string | No | Max 2000 chars |
| formId | string | Yes | e.g. `"contact-form"` |
| sourcePage | string | Yes | URL path |
| honeypot | string | No | Must be empty if present |
| utmSource | string | No | UTM tracking |
| utmMedium | string | No | UTM tracking |
| utmCampaign | string | No | UTM tracking |
| referrer | string | No | `document.referrer` |
