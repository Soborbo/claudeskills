import { z } from 'astro/zod';

// UK phone: 0 + 10 digits, or +44 + 10 digits (spaces/dashes stripped before validation)
const ukPhoneRegex = /^(\+44\d{10}|0\d{10})$/;

export const contactSchema = z.object({
  name: z.string().min(2, 'Please enter your name').max(100),
  email: z.string().email('Please enter a valid email'),
  phone: z.string()
    .transform(v => v.replace(/[\s\-()]/g, ''))
    .pipe(z.string().regex(ukPhoneRegex, 'Please enter a valid UK phone number')),
  postcode: z.string().max(10).optional(),
  message: z.string().max(2000).optional(),
  consent: z.literal('on', { message: 'Please accept the privacy policy' }),

  // Hidden fields
  website: z.string().max(0).optional(), // honeypot
  event_id: z.string().max(100).optional(),
  source_page: z.string().max(200).optional(),
  utm_source: z.string().max(200).optional(),
  utm_medium: z.string().max(200).optional(),
  utm_campaign: z.string().max(200).optional(),

  // Turnstile
  'cf-turnstile-response': z.string().optional(),
});

export type ContactFormData = z.infer<typeof contactSchema>;
