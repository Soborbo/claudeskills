/**
 * Zod Schemas — locale-aware form validation.
 * See references/schemas.md for field documentation.
 */

import { z } from 'zod';
import type { Locale } from './types';

const messages = {
  'en-GB': {
    nameRequired: 'Name is required (minimum 2 characters)',
    emailInvalid: 'Please enter a valid email address',
    phoneInvalid: 'Please enter a valid UK phone number',
    messageTooLong: 'Message must be under 2000 characters',
  },
  'hu-HU': {
    nameRequired: 'Név megadása kötelező (minimum 2 karakter)',
    emailInvalid: 'Érvényes email cím szükséges',
    phoneInvalid: 'Érvényes telefonszám szükséges',
    messageTooLong: 'Az üzenet maximum 2000 karakter lehet',
  },
} as const;

const phonePatterns = {
  'en-GB': /^(\+44|0)\d{10,11}$/,
  'hu-HU': /^(\+36|06)\d{8,9}$/,
} as const;

/**
 * Create a contact form schema for the given locale.
 * Validates shape only — time checks, Turnstile, rate limits
 * are handled in the submit handler, not here.
 */
export function createContactSchema(locale: Locale = 'en-GB') {
  const msg = messages[locale];
  const phoneRegex = phonePatterns[locale];

  return z.object({
    // Contact fields
    name: z.string().min(2, msg.nameRequired),
    email: z.string().email(msg.emailInvalid),
    phone: z.string().regex(phoneRegex, msg.phoneInvalid).optional(),
    message: z.string().max(2000, msg.messageTooLong).optional(),

    // Form metadata
    formId: z.string().min(1),
    sourcePage: z.string().min(1),

    // Spam — honeypot (must be empty if present)
    honeypot: z.string().max(0).optional().default(''),

    // Turnstile token (optional in schema — verified in handler)
    'cf-turnstile-response': z.string().min(1).optional(),

    // Client-side timestamp for time check (validated in handler, not here)
    formStartTime: z.coerce.number().optional(),

    // UTM tracking
    utmSource: z.string().optional(),
    utmMedium: z.string().optional(),
    utmCampaign: z.string().optional(),
    referrer: z.string().optional(),
  });
}

/**
 * Calculator form schema — extends contact with quote data.
 */
export function createCalculatorSchema(locale: Locale = 'en-GB') {
  return createContactSchema(locale).extend({
    quoteId: z.string().min(1),
    answers: z.record(z.string(), z.unknown()),
    priceEstimate: z.number().optional(),
  });
}

export type ContactFormInput = z.infer<ReturnType<typeof createContactSchema>>;
export type CalculatorFormInput = z.infer<ReturnType<typeof createCalculatorSchema>>;
