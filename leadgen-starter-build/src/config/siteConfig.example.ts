import type { SiteConfig } from './siteConfig';

export const config: SiteConfig = {

  // ── IDENTITY ────────────────────────────────────
  name:        'Painless Removals',
  legalName:   'Painless Removals Ltd',
  tagline:     "Bristol's Most Trusted Removal Company",
  description: 'Professional house removals in Bristol & South West. Fully insured, fixed prices, no hidden fees. Get your free quote today.',
  url:         'https://painlessremovals.co.uk',
  locale:      'en-GB',
  currency:    'GBP',
  foundedYear: 1978,
  schemaType:      'MovingCompany',
  googleMapsCid:   'https://www.google.com/maps?cid=10222747834737099273',
  priceRange:      '££',
  paymentAccepted: 'Cash, Credit Card, Bank Transfer',

  // ── PEOPLE ──────────────────────────────────────
  people: [
    {
      name:     'Jay Sheridan',
      slug:     'jay-sheridan',
      role:     'Managing Director',
      jobTitle: 'Managing Director',
      image:    '/images/jay-sheridan.webp',
      bio:      'Jay has been running Painless Removals for over 15 years, carrying on the family tradition his father started in 1978.',
      featured: true,
      sameAs: [
        'https://www.linkedin.com/in/jay-sheridan/',
        'https://find-and-update.company-information.service.gov.uk/officers/XXXXXXX/appointments',
      ],
    },
  ],

  // ── CONTACT ─────────────────────────────────────
  contact: {
    phone:        '+441171234567',
    phoneDisplay: '0117 123 4567',
    email:        'hello@painlessremovals.co.uk',
    whatsapp:     '441171234567',
  },

  // ── ADDRESS ─────────────────────────────────────
  address: {
    street:   '42 Southmead Road',
    city:     'Bristol',
    region:   'South West England',
    postcode: 'BS10 5DL',
    country:  'GB',
    geo: { lat: 51.4945, lng: -2.6050 },
  },

  // ── SERVICE AREA ────────────────────────────────
  serviceArea: { radius: 50, unit: 'mi' },

  // ── LEGAL ───────────────────────────────────────
  legal: {
    companyNumber:     '12345678',
    vatNumber:         'GB123456789',
    insuranceProvider: 'Basil Fry & Company',
    privacyPolicyPath: '/privacy/',
    cookiePolicyPath:  '/cookie-policy',
  },

  // ── BRAND ───────────────────────────────────────
  brand: {
    primary:   '#2563EB',
    secondary: '#1E40AF',
    accent:    '#F59E0B',
    dark:      '#1F2937',
    light:     '#F9FAFB',
  },

  // ── FONTS ───────────────────────────────────────
  fonts: { heading: 'Plus Jakarta Sans', body: 'Inter' },

  // ── ASSETS ──────────────────────────────────────
  assets: {
    logo:     '/images/logo.svg',
    logoDark: '/images/logo-dark.svg',
    favicon:  '/favicon.svg',
    ogImage:  '/images/og-default.jpg',
    ogWidth:  1200,
    ogHeight: 630,
  },

  // ── SEO ─────────────────────────────────────────
  seo: {
    titleTemplate: '%s | Painless Removals Bristol',
    defaultRobots: 'index,follow',
    twitterCard:   'summary_large_image',
  },

  // ── TRUST ───────────────────────────────────────
  trust: [
    { name: 'BAR Member',           image: '/images/trust/bar.svg',          url: 'https://www.bar.co.uk' },
    { name: 'Which? Trusted Trader', image: '/images/trust/which.svg',       url: 'https://trustedtraders.which.co.uk' },
    { name: 'Fully Insured',        image: '/images/trust/insurance.svg' },
  ],

  // ── REVIEWS ─────────────────────────────────────
  reviews: [
    { platform: 'Google',     rating: 4.9, count: 247, url: 'https://g.page/painless-removals/review', primary: true },
    { platform: 'Trustpilot', rating: 4.8, count: 89,  url: 'https://uk.trustpilot.com/review/painlessremovals.co.uk' },
    { platform: 'Facebook',   rating: 4.9, count: 52,  url: 'https://facebook.com/painlessremovals/reviews' },
  ],

  // ── TESTIMONIALS ────────────────────────────────
  testimonials: [
    {
      quote:    "Absolutely brilliant service. The lads were careful with everything and nothing was damaged. Best removal company I've used.",
      author:   'Sarah M.',
      location: 'BS6, Redland',
      service:  'house-removals',
      area:     'bristol',
    },
    {
      quote:    'Jay gave us an honest quote and the final price was exactly what he said. No surprises. Would recommend to anyone.',
      author:   'David T.',
      location: 'BA1, Bath',
      service:  'house-removals',
      area:     'bath',
    },
  ],

  // ── USPs ────────────────────────────────────────
  usps: [
    { icon: 'shield-check', text: 'Fully Insured' },
    { icon: 'pound-sign',   text: 'Fixed Prices, No Hidden Fees' },
    { icon: 'clock',        text: 'Same-Week Availability' },
    { icon: 'award',        text: 'BAR Accredited Since 1978' },
  ],

  // ── CTAs ────────────────────────────────────────
  cta: {
    primary:          'Get Your Free Quote',
    secondary:        'Call Us Today',
    calculator:       'Get an Instant Estimate',
    callbackButton:   'Request a Callback',
    mobileCall:       'Call Now',
    mobileCalculator: 'Get Estimate',
    riskReversal:     'Free, no-obligation \u2022 Takes 30 seconds',
  },

  // ── SERVICES ────────────────────────────────────
  services: [
    { name: 'House Removals',  slug: 'house-removals',  shortDescription: 'Full house moves across Bristol and the South West.',  serviceType: 'House Moving Service',     icon: 'home',     featured: true },
    { name: 'Office Removals', slug: 'office-removals', shortDescription: 'Minimal disruption commercial moves.',                 serviceType: 'Office Moving Service',    icon: 'building', featured: true },
    { name: 'Packing Service', slug: 'packing-service', shortDescription: 'Professional packing to keep your belongings safe.',   serviceType: 'Packing Service',          icon: 'package' },
    { name: 'Storage',         slug: 'storage',         shortDescription: 'Secure short and long-term storage solutions.',         serviceType: 'Storage Facility Service', icon: 'warehouse' },
    { name: 'Man & Van',       slug: 'man-and-van',     shortDescription: 'Affordable single-item and small moves.',              serviceType: 'Moving Service',           icon: 'truck' },
    { name: 'Piano Removals',  slug: 'piano-removals',  shortDescription: 'Specialist piano moving with the right equipment.',     serviceType: 'Piano Moving Service',     icon: 'music' },
  ],

  // ── AREAS ───────────────────────────────────────
  areas: [
    { name: 'Bristol',           slug: 'bristol',          county: 'Bristol',              postcodePrefixes: ['BS1','BS2','BS3','BS4','BS5','BS6','BS7','BS8','BS9','BS10'], featured: true },
    { name: 'Bath',              slug: 'bath',             county: 'Somerset',             postcodePrefixes: ['BA1','BA2'],     featured: true },
    { name: 'Weston-super-Mare', slug: 'weston-super-mare', county: 'Somerset',            postcodePrefixes: ['BS22','BS23','BS24'] },
    { name: 'Clevedon',          slug: 'clevedon',         county: 'North Somerset',       postcodePrefixes: ['BS21'] },
    { name: 'Keynsham',          slug: 'keynsham',         county: 'Bath and NE Somerset', postcodePrefixes: ['BS31'] },
  ],

  // ── HOURS ───────────────────────────────────────
  hours: [
    { days: ['Monday','Tuesday','Wednesday','Thursday','Friday'], opens: '07:00', closes: '19:00' },
    { days: ['Saturday'],                                         opens: '08:00', closes: '17:00' },
    { days: ['Sunday'],                                           opens: '09:00', closes: '14:00' },
  ],

  // ── SOCIAL ──────────────────────────────────────
  social: {
    facebook:  'https://facebook.com/painlessremovals',
    instagram: 'https://instagram.com/painlessremovals',
    google:    'https://g.page/painless-removals',
  },

  // ── TRACKING ────────────────────────────────────
  tracking: { gtmId: 'GTM-XXXXXXX' },

  // ── FORMS ───────────────────────────────────────
  forms: {
    notificationEmail: 'jay@painlessremovals.co.uk',
    sheetsId:          '1aBcDeFgHiJkLmNoPqRsTuVwXyZ',
    turnstileSiteKey:  '0x4AAAAAAA...',
    thankYouPath:      '/thank-you',
    successMessage:    "Thank you! We'll get back to you within 2 hours during working hours.",
    errorMessage:      'Something went wrong. Please call us on 0117 123 4567.',
    consentText:       'I agree to the privacy policy and consent to being contacted about my move.',
  },
};
