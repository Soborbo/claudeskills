# Zod Schemas Reference

## Base Schemas

```typescript
import { z } from 'zod';

// Name (2-50 chars, unicode letters)
export const nameSchema = z
  .string()
  .min(2, 'Minimum 2 karakter')
  .max(50, 'Maximum 50 karakter')
  .regex(/^[\p{L}\s'-]+$/u, 'Érvénytelen név');

// Email (lowercase, trimmed)
export const emailSchema = z
  .string()
  .email('Érvénytelen email cím')
  .max(100)
  .transform(val => val.toLowerCase().trim());

// Phone (9-20 chars)
export const phoneSchema = z
  .string()
  .min(9, 'Érvénytelen telefonszám')
  .max(20)
  .regex(/^[\d\s+()-]+$/, 'Érvénytelen telefonszám');

// City
export const citySchema = z.string().min(2).max(100);
```

## Locale-Aware Postcode

```typescript
// Hungarian: exactly 4 digits
export const postcodeHUSchema = z
  .string()
  .length(4, 'Az irányítószám 4 számjegy')
  .regex(/^\d{4}$/, 'Érvénytelen irányítószám');

// UK: standard format
export const postcodeUKSchema = z
  .string()
  .min(5)
  .max(8)
  .regex(/^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i)
  .transform(val => val.toUpperCase().trim());

// Runtime selection
export const postcodeSchema = locale === 'en-GB' 
  ? postcodeUKSchema 
  : postcodeHUSchema;
```

## Spam Protection

```typescript
// Honeypot - MUST be empty
company: z
  .string()
  .max(0, 'Érvénytelen beküldés')
  .optional()
  .default('')

// Time check - use z.coerce for string→number
formStartTime: z.coerce
  .number()
  .refine(
    (start) => Date.now() - start > 3000,
    'Kérjük, töltse ki gondosan'
  )

// Turnstile token
'cf-turnstile-response': z.string().min(1, 'Captcha szükséges')
```

## GDPR Consent

```typescript
// Required checkbox - must be true
gdprConsent: z.literal(true, {
  errorMap: () => ({ message: 'GDPR hozzájárulás kötelező' })
}),

// Timestamp - auto-generated on submit
gdprTimestamp: z.string().datetime().optional()
```

## Contact Form Schema

```typescript
export const contactFormSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  postcode: postcodeSchema,
  city: citySchema,
  message: z.string().max(2000).optional(),
  
  // Spam protection
  company: z.string().max(0).optional().default(''), // honeypot
  formStartTime: z.coerce.number().refine(s => Date.now() - s > 3000),
  'cf-turnstile-response': z.string().min(1, 'Captcha szükséges'),
  
  // GDPR
  gdprConsent: z.literal(true, {
    errorMap: () => ({ message: 'GDPR hozzájárulás kötelező' })
  }),
});
```

## Validation in API

```typescript
export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  const result = contactFormSchema.safeParse(body);
  
  if (!result.success) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        errors: result.error.flatten().fieldErrors 
      }),
      { status: 400 }
    );
  }
  
  const data = result.data;
  // ... process validated data
};
```
