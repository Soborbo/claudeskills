import type { Locale } from './i18n';

export const siteConfig = {
  // ============================================
  // 🔧 CUSTOMIZE THESE
  // ============================================
  name: 'Calculator',
  locale: 'hu-HU' as Locale, // 'hu-HU' | 'en-GB'
  
  brand: {
    primaryColor: '#2563eb', // Blue - for image card backgrounds
    logo: '/logo.svg',
  },
  
  contact: {
    email: 'info@example.com',
    phone: '+36 1 234 5678',
  },
  
  gtm: {
    id: 'GTM-XXXXXX',
    enabled: false,
  },
  
  emails: {
    from: 'noreply@example.com',
    fromName: 'Company Name',
    admin: 'admin@example.com',
  },
  
  // Google Sheets - ALL DATA GOES HERE
  sheets: {
    webhookUrl: '', // Set in .env
  },
  
  // ============================================
  // RATE LIMITS
  // ============================================
  rateLimit: {
    submit: { perMinute: 5, perDay: 20 },
    postcode: { perMinute: 30 },
  },
} as const;
