import { z } from 'zod';

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
  name:         z.string(),                          // "Painless Removals"
  legalName:    z.string(),                          // "Painless Removals Ltd"
  tagline:      z.string(),                          // "Bristol's Most Trusted Removal Company"
  description:  z.string(),                          // Homepage meta description
  url:          z.string().url(),                    // "https://painlessremovals.co.uk"
  locale:       z.string().default('en-GB'),
  currency:     z.string().default('GBP'),
  foundedYear:  z.number().int(),
  schemaType:       z.string().default('LocalBusiness'), // "MovingCompany", "BeautySalon", etc.
  googleMapsCid:    z.string().url().optional(),         // "https://www.google.com/maps?cid=1234..."
  priceRange:       z.string().default('££'),            // £ to ££££
  paymentAccepted:  z.string().default('Cash, Credit Card, Bank Transfer'),

  // ── PEOPLE ──────────────────────────────────────
  people: z.array(z.object({
    name:     z.string(),
    slug:     z.string(),                            // "jay-sheridan" → @id: /about/jay-sheridan/#person
    role:     z.string(),                            // Marketing: "The Guy Who Runs the Show"
    jobTitle: z.string().optional(),                 // Schema: "Managing Director" (formal)
    image:    z.string().optional(),
    bio:      z.string().optional(),
    featured: z.boolean().default(false),            // Show on homepage
    sameAs:   z.array(z.string().url()).default([]), // LinkedIn, Companies House officer URL
  })).min(1),

  // ── CONTACT ─────────────────────────────────────
  contact: z.object({
    phone:        phoneE164,                         // "+447123456789"
    phoneDisplay: z.string(),                        // "0117 123 4567"
    email:        z.string().email(),
    whatsapp:     z.string().optional(),              // "447123456789"
    bookingUrl:   z.string().url().optional(),        // Calendly / booking link
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
    radius: z.number(),                              // Schema.org areaServed
    unit:   z.enum(['mi', 'km']).default('mi'),
  }).optional(),

  // ── LEGAL ───────────────────────────────────────
  legal: z.object({
    companyNumber:     z.string().optional(),         // Companies House
    vatNumber:         z.string().optional(),
    icoNumber:         z.string().optional(),         // ICO registration (GDPR)
    insuranceProvider: z.string().optional(),
    privacyPolicyPath: z.string().default('/privacy-policy'),
    termsPath:         z.string().optional(),
    cookiePolicyPath:  z.string().optional(),
  }),

  // ── BRAND ───────────────────────────────────────
  brand: z.object({
    primary:    hexColor,                            // Fő CTA, header
    secondary:  hexColor,                            // Secondary elemek
    accent:     hexColor,                            // Highlight, badge, star color
    dark:       hexColor.default('#1F2937'),         // Text / dark bg
    light:      hexColor.default('#F9FAFB'),         // Light bg
    surface:    hexColor.optional(),                 // Card bg, ha kell
  }),

  // ── FONTS ───────────────────────────────────────
  fonts: z.object({
    heading: z.string().default('Inter'),
    body:    z.string().default('Inter'),
  }),

  // ── ASSETS ──────────────────────────────────────
  assets: z.object({
    logo:      z.string(),                           // /images/logo.svg
    logoDark:  z.string().optional(),
    favicon:   z.string().optional(),
    ogImage:   z.string(),                           // Default OG image
    ogWidth:   z.number().default(1200),
    ogHeight:  z.number().default(630),
    heroImage: z.string().optional(),                // Default hero ha kell
  }),

  // ── SEO ─────────────────────────────────────────
  seo: z.object({
    titleTemplate:      z.string().default('%s | Company Name'),
    defaultRobots:      z.string().default('index,follow'),
    twitterCard:        z.enum(['summary', 'summary_large_image']).default('summary_large_image'),
    canonicalBase:      z.string().url().optional(),  // Ha eltér az url-től
  }),

  // ── TRUST ───────────────────────────────────────
  trust: z.array(z.object({
    name:  z.string(),                               // "BAR Member", "Which? Trusted Trader"
    image: z.string().optional(),                    // Badge/logo path
    url:   z.string().url().optional(),
  })).default([]),

  // ── REVIEWS ─────────────────────────────────────
  reviews: z.array(z.object({
    platform: z.enum(['Google', 'Trustpilot', 'Facebook', 'Yell', 'Checkatrade', 'Bark']),
    rating:   z.number().min(1).max(5),
    count:    z.number().int().nonnegative(),
    url:      z.string().url(),
    primary:  z.boolean().default(false),            // Melyiket mutatjuk default
  })).min(1),

  // ── TESTIMONIALS (optional) ─────────────────────
  testimonials: z.array(z.object({
    quote:    z.string(),
    author:   z.string(),
    location: z.string().optional(),                 // "BS6, Redland"
    service:  z.string().optional(),                 // Melyik service-hez köthető
    area:     z.string().optional(),                 // Melyik area-hoz köthető
  })).optional(),

  // ── USPs ────────────────────────────────────────
  usps: z.array(z.object({
    icon: z.string(),                                // Lucide icon name or SVG path
    text: z.string(),
  })).min(3).max(8),

  // ── CTAs ────────────────────────────────────────
  cta: z.object({
    primary:          z.string(),                    // "Get Your Free Quote"
    secondary:        z.string(),                    // "Call Us Today"
    calculator:       z.string().optional(),          // "Get an Instant Estimate"
    callbackButton:   z.string(),                    // "Request a Callback"
    mobileCall:       z.string(),                    // "Call Now"
    mobileCalculator: z.string().optional(),          // "Get Estimate"
    riskReversal:     z.string(),                    // "Free, no-obligation • Takes 30 seconds"
  }),

  // ── SERVICES ────────────────────────────────────
  services: z.array(z.object({
    name:             z.string(),
    slug:             z.string(),
    shortDescription: z.string(),
    serviceType:      z.string().optional(),          // Schema.org: "House Moving Service"
    icon:             z.string().optional(),
    featured:         z.boolean().default(false),
  })).min(1),

  // ── AREAS ───────────────────────────────────────
  areas: z.array(z.object({
    name:             z.string(),                    // "Bristol"
    slug:             z.string(),                    // "bristol"
    county:           z.string().optional(),          // "Somerset"
    postcodePrefixes: z.array(z.string()).optional(), // ["BS1", "BS2", "BS3"]
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
    google:    z.string().url().optional(),           // Google Business Profile
  }),

  // ── TRACKING ────────────────────────────────────
  tracking: z.object({
    gtmId: z.string().optional(),                    // "GTM-XXXXXXX" — GA4, GAds, Meta Pixel mind GTM-ben
  }),

  // ── FORMS (native Astro stack) ──────────────────
  forms: z.object({
    notificationEmail:  z.string().email(),           // Hová megy a lead
    sheetsId:           z.string().optional(),         // Google Sheets ID
    turnstileSiteKey:   z.string().optional(),         // Cloudflare Turnstile
    thankYouPath:       z.string().default('/thank-you'),
    successMessage:     z.string().default('Thank you! We\'ll be in touch within 24 hours.'),
    errorMessage:       z.string().default('Something went wrong. Please call us directly.'),
    consentText:        z.string().default('I agree to the privacy policy and consent to being contacted about my enquiry.'),
  }),

});

// ── TYPE EXPORT ──────────────────────────────────
export type SiteConfig = z.infer<typeof siteConfigSchema>;
