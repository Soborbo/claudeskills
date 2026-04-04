# Zod Schemas

## Base Contact Schema

```typescript
import { z } from 'zod';

export const contactSchema = z.object({
  // Required fields
  name: z.string().min(2, 'Név kötelező'),
  email: z.string().email('Érvényes email szükséges'),
  phone: z.string().regex(/^(\+36|06)?[0-9]{9}$/, 'Érvényes telefonszám'),
  
  // GDPR - REQUIRED
  gdprConsent: z.literal(true, {
    errorMap: () => ({ message: 'Adatvédelmi hozzájárulás kötelező' })
  }),
  gdprTimestamp: z.string().datetime(),
  
  // Spam protection
  honeypot: z.string().max(0).optional().default(''),
  formStartTime: z.coerce.number().refine(
    (start) => Date.now() - start > 3000,
    'Túl gyors kitöltés'
  ),
  
  // Turnstile
  'cf-turnstile-response': z.string().min(1),
  
  // Tracking
  sourceUrl: z.string().url(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
});

export type ContactForm = z.infer<typeof contactSchema>;
```

## Calculator Schema

```typescript
export const calculatorSchema = z.object({
  // All step answers
  answers: z.record(z.string(), z.unknown()),
  
  // Quote result
  quoteId: z.string(),
  priceEstimate: z.number().optional(),
  
  // Contact (final step)
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string(),
  
  // GDPR
  gdprConsent: z.literal(true),
  gdprTimestamp: z.string().datetime(),
  
  // Spam
  honeypot: z.string().max(0).optional().default(''),
  formStartTime: z.coerce.number(),
  'cf-turnstile-response': z.string(),
  
  // Tracking
  sourceUrl: z.string().url(),
});
```

## Validation Usage

```typescript
// API endpoint
export async function POST({ request }) {
  const body = await request.json();
  
  const result = contactSchema.safeParse(body);
  
  if (!result.success) {
    return new Response(JSON.stringify({
      errors: result.error.flatten().fieldErrors
    }), { status: 400 });
  }
  
  const data = result.data; // Type-safe
  
  // Process...
}
```

## Field Validation Rules

| Field | Rule | Error |
|-------|------|-------|
| name | min 2 chars | "Név kötelező" |
| email | valid email | "Érvényes email" |
| phone | HU format | "Érvényes telefon" |
| gdprConsent | must be true | "Hozzájárulás kötelező" |
| honeypot | must be empty | (silent reject) |
| formStartTime | >3s ago | "Túl gyors" |
