# Validation: schema, phones, postcodes, messages

Canonical schema: `src/lib/forms/schemas.ts` in leadgen-template-site. It imports
`z` from `astro/zod` and picks the phone rule from `config.locale`.

## Zod 4 in form code

| Zod 3 habit | Zod 4 | What happens if you keep the old form |
|---|---|---|
| `z.string().email()` | `z.email()` | Deprecated; still works for now |
| `{ message: '...' }` | `{ error: '...' }` | `message` is still accepted as an alias |
| `errorMap: ...` | `{ error: (iss) => ... }` or `z.config({ customError })` | **Silently ignored**: users see Zod's English default |
| `z.literal(true)` for a checkbox | `z.literal('on').optional()` | A checkbox posts `"on"`; the field always fails |
| `.flatten()` | `z.flattenError(err)` | Deprecated |
| `.default(x)` before a transform | `.prefault(x)` | `.default` now applies to the output type |

Give `z.string({ error })` on required fields so a missing field shows "please
enter your name", not "expected string, received undefined".

## Phone numbers

Normalise first, then validate. People paste numbers in every format; rejecting
them costs leads.

| Locale | Normalise | Pattern after normalising |
|---|---|---|
| en-GB | strip spaces, `().-/`, NBSP, dashes; `00` -> `+`; `+44 (0)` -> `+44` | `^(\+44\d{9,10}\|0\d{9,10})$` |
| hu-HU | same; `00` -> `+`; leading `06` -> `+36`; `+360` -> `+36` | `^\+36\d{8,9}$` (Budapest 1+7, others 9) |

Use `.transform(normalise).pipe(z.string().regex(pattern, msg))` so the stored
value is the canonical one. The browser applies only an E.164 length check
(`^\+?\d{7,15}$`) and writes the cleaned value back; the server owns the national
rule.

## Postcodes

| Locale | Rule |
|---|---|
| en-GB | Uppercase, collapse spaces; validate with the standard UK pattern `^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$` after normalising. Optional field on most forms. |
| hu-HU | Exactly 4 digits `^\d{4}$`. |

The template keeps postcode optional and drops values shorter than 2 characters
(the CRM rejects them and its salvage path drops marketing consent).

## Names, messages, limits

- Name: 2-100 characters. Unicode letters are fine (`\p{L}`); do not restrict to
  ASCII, Hungarian names have accents.
- Message: max 2000 characters, optional.
- Tracking fields: max lengths as in the template (`event_id` max 40: the gateway
  drops longer ids).
- Body size: the endpoint rejects bodies over 64 KB before parsing.

## Messages (EN / HU)

The template takes messages from `src/i18n/en.json` via `t()` (keys under
`form.errors`: `nameRequired`, `emailInvalid`, `phoneInvalid`, `securityCheck`,
`rateLimited`). The template ships English only; a Hungarian site adds its own
`hu` strings for the same keys. Earlier Hungarian wording used on Soborbo sites:
"Név megadása kötelező", "Érvényes email cím szükséges", "Érvényes telefonszám
szükséges". Hungarian copy addresses the visitor formally (Ön).

Never put spam-logic hints ("honeypot", "submitted too fast") in user-facing text.

## What is not in the schema

| Check | Where | Why |
|---|---|---|
| Honeypot | before Zod, in `submit.ts` | A Zod `max(0)` failure returns a 400 and tells the bot |
| Turnstile | handler | Async network call |
| Rate limit, dedupe | handler | Infrastructure state |
| `leadId`, `eventId` fallback, timestamp | handler | Server-generated, never trusted from the client |

Repeated keys: parse `FormData` so a later empty value never erases an earlier one,
and treat a filled honeypot in any repeat as spam (`parseFormData` in `submit.ts`).
`Object.fromEntries(formData)` keeps only the last value, which lets a bot send
`website=spam&website=` past the trap.
