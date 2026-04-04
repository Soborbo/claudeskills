import { z } from 'astro/zod';

// ── REUSABLE VALIDATORS ─────────────────────────
const hexColor = z.string().regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, 'Invalid hex color');
const timeHHMM = z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Use HH:mm format');
const phoneE164 = z.string().regex(/^\+[1-9]\d{7,14}$/, 'Use E.164 format: +44...');

const dayEnum = z.enum([
  'Monday', 'Tuesday', 'Wednesday', 'Thursday',
  'Friday', 'Saturday', 'Sunday',
]);

// ── SCHEMA ──────────────────────────────────────

export const siteConfigSchema = z.object({

  // ── IDENTITY ────────────────────────────────────
  name:         z.string(),
  legalName:    z.string(),
  tagline:      z.string(),
  description:  z.string(),
  url:          z.string().url(),
  locale:       z.string().default('en-GB'),
  currency:     z.string().default('GBP'),
  foundedYear:  z.number().int(),
  schemaType:       z.string().default('LocalBusiness'),
  googleMapsCid:    z.string().url().optional(),
  priceRange:       z.string().default('££'),
  paymentAccepted:  z.string().default('Cash, Credit Card, Bank Transfer'),

  // ── PEOPLE ──────────────────────────────────────
  people: z.array(z.object({
    name:     z.string(),
    slug:     z.string(),
    role:     z.string(),
    jobTitle: z.string().optional(),
    image:    z.string().optional(),
    bio:      z.string().optional(),
    featured: z.boolean().default(false),
    sameAs:   z.array(z.string().url()).default([]),
  })).min(1),

  // ── CONTACT ─────────────────────────────────────
  contact: z.object({
    phone:        phoneE164,
    phoneDisplay: z.string(),
    email:        z.string().email(),
    whatsapp:     z.string().optional(),
    bookingUrl:   z.string().url().optional(),
  }),

  // ── ADDRESS ─────────────────────────────────────
  address: z.object({
    street:   z.string(),
    city:     z.string(),
    region:   z.string(),
    postcode: z.string(),
    country:  z.string().default('GB'),
    geo: z.object({
      lat: z.number(),
      lng: z.number(),
    }).optional(),
  }),

  // ── SERVICE AREA ────────────────────────────────
  serviceArea: z.object({
    radius: z.number(),
    unit:   z.enum(['mi', 'km']).default('mi'),
  }).optional(),

  // ── LEGAL ───────────────────────────────────────
  legal: z.object({
    companyNumber:     z.string().optional(),
    vatNumber:         z.string().optional(),
    icoNumber:         z.string().optional(),
    insuranceProvider: z.string().optional(),
    privacyPolicyPath: z.string().default('/privacy-policy'),
    termsPath:         z.string().optional(),
    cookiePolicyPath:  z.string().optional(),
  }),

  // ── BRAND ───────────────────────────────────────
  brand: z.object({
    primary:    hexColor,
    secondary:  hexColor,
    accent:     hexColor,
    dark:       hexColor.default('#1F2937'),
    light:      hexColor.default('#F9FAFB'),
    surface:    hexColor.optional(),
  }),

  // ── FONTS ───────────────────────────────────────
  fonts: z.object({
    heading: z.string().default('Inter'),
    body:    z.string().default('Inter'),
  }),

  // ── ASSETS ──────────────────────────────────────
  assets: z.object({
    logo:      z.string(),
    logoDark:  z.string().optional(),
    favicon:   z.string().optional(),
    ogImage:   z.string(),
    ogWidth:   z.number().default(1200),
    ogHeight:  z.number().default(630),
    heroImage: z.string().optional(),
  }),

  // ── SEO ─────────────────────────────────────────
  seo: z.object({
    titleTemplate:      z.string().default('%s | Company Name'),
    defaultRobots:      z.string().default('index,follow'),
    twitterCard:        z.enum(['summary', 'summary_large_image']).default('summary_large_image'),
    canonicalBase:      z.string().url().optional(),
  }),

  // ── TRUST ───────────────────────────────────────
  trust: z.array(z.object({
    name:  z.string(),
    image: z.string().optional(),
    url:   z.string().url().optional(),
  })).default([]),

  // ── REVIEWS ─────────────────────────────────────
  reviews: z.array(z.object({
    platform: z.enum(['Google', 'Trustpilot', 'Facebook', 'Yell', 'Checkatrade', 'Bark']),
    rating:   z.number().min(1).max(5),
    count:    z.number().int().nonnegative(),
    url:      z.string().url(),
    primary:  z.boolean().default(false),
  })).min(1),

  // ── TESTIMONIALS ────────────────────────────────
  testimonials: z.array(z.object({
    quote:    z.string(),
    author:   z.string(),
    location: z.string().optional(),
    service:  z.string().optional(),
    area:     z.string().optional(),
  })).optional(),

  // ── USPs ────────────────────────────────────────
  usps: z.array(z.object({
    icon: z.string(),
    text: z.string(),
  })).min(3).max(8),

  // ── CTAs ────────────────────────────────────────
  cta: z.object({
    primary:          z.string(),
    secondary:        z.string(),
    calculator:       z.string().optional(),
    callbackButton:   z.string(),
    mobileCall:       z.string(),
    mobileCalculator: z.string().optional(),
    riskReversal:     z.string(),
  }),

  // ── SERVICES ────────────────────────────────────
  services: z.array(z.object({
    name:             z.string(),
    slug:             z.string(),
    shortDescription: z.string(),
    serviceType:      z.string().optional(),
    icon:             z.string().optional(),
    featured:         z.boolean().default(false),
  })).min(1),

  // ── AREAS ───────────────────────────────────────
  areas: z.array(z.object({
    name:             z.string(),
    slug:             z.string(),
    county:           z.string().optional(),
    postcodePrefixes: z.array(z.string()).optional(),
    featured:         z.boolean().default(false),
  })).min(1),

  // ── HOURS ───────────────────────────────────────
  hours: z.array(z.object({
    days:   z.array(dayEnum),
    opens:  timeHHMM,
    closes: timeHHMM,
  })).min(1),

  // ── SOCIAL ──────────────────────────────────────
  social: z.object({
    facebook:  z.string().url().optional(),
    instagram: z.string().url().optional(),
    linkedin:  z.string().url().optional(),
    youtube:   z.string().url().optional(),
    tiktok:    z.string().url().optional(),
    google:    z.string().url().optional(),
  }),

  // ── TRACKING ────────────────────────────────────
  tracking: z.object({
    gtmId: z.string().optional(),
  }),

  // ── FORMS ──────────────────────────────────────
  forms: z.object({
    notificationEmail:  z.string().email(),
    sheetsId:           z.string().optional(),
    turnstileSiteKey:   z.string().optional(),
    thankYouPath:       z.string().default('/thank-you'),
    successMessage:     z.string().default('Thank you! We\'ll be in touch within 24 hours.'),
    errorMessage:       z.string().default('Something went wrong. Please call us directly.'),
    consentText:        z.string().default('I agree to the privacy policy and consent to being contacted about my enquiry.'),
  }),

});

// ── TYPE EXPORT ──────────────────────────────────
export type SiteConfig = z.infer<typeof siteConfigSchema>;
