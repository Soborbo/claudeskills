/**
 * @leadgen/config - Type Definitions
 *
 * Central site configuration types for lead generation websites.
 */

// =============================================================================
// Company Information
// =============================================================================

/**
 * Company legal and basic information
 */
export interface CompanyInfo {
  /** Display name (brand name) */
  name: string;

  /** Legal registered name */
  legalName: string;

  /** Company slogan/tagline */
  tagline?: string;

  /** Short description (1-2 sentences) */
  description?: string;

  /** Full about text */
  about?: string;

  /** Tax number (Adószám) */
  taxNumber?: string;

  /** EU VAT number */
  vatNumber?: string;

  /** Company registration number (Cégjegyzékszám) */
  registrationNumber?: string;

  /** Year founded */
  foundedYear?: number;

  /** Number of employees (or range like "10-50") */
  employees?: string | number;

  /** Industry/sector */
  industry?: string;

  /** Company type for schema.org (LocalBusiness, MovingCompany, etc.) */
  schemaType?: string;
}

// =============================================================================
// Contact Information
// =============================================================================

/**
 * Phone number with optional label
 */
export interface PhoneNumber {
  /** Phone number (display format) */
  number: string;
  /** Label (e.g., "Központ", "Mobil", "Ügyfélszolgálat") */
  label?: string;
  /** Is this the primary number? */
  primary?: boolean;
  /** Is WhatsApp available on this number? */
  whatsapp?: boolean;
  /** Is Viber available on this number? */
  viber?: boolean;
}

/**
 * Email address with optional label
 */
export interface EmailAddress {
  /** Email address */
  email: string;
  /** Label (e.g., "Általános", "Árajánlat", "Támogatás") */
  label?: string;
  /** Is this the primary email? */
  primary?: boolean;
}

/**
 * Physical address
 */
export interface Address {
  /** Street address */
  street: string;
  /** City */
  city: string;
  /** Postal code */
  postalCode: string;
  /** Region/County (Megye) */
  region?: string;
  /** Country */
  country: string;
  /** Country code (ISO 3166-1 alpha-2) */
  countryCode: string;
  /** Google Maps URL */
  mapsUrl?: string;
  /** Latitude for schema.org */
  latitude?: number;
  /** Longitude for schema.org */
  longitude?: number;
  /** Address label (e.g., "Központi iroda", "Raktár") */
  label?: string;
}

/**
 * All contact information
 */
export interface ContactInfo {
  /** Phone numbers */
  phones: PhoneNumber[];
  /** Email addresses */
  emails: EmailAddress[];
  /** Physical addresses */
  addresses: Address[];
  /** Contact form URL */
  contactFormUrl?: string;
  /** Booking/appointment URL */
  bookingUrl?: string;
}

// =============================================================================
// Opening Hours
// =============================================================================

/**
 * Opening hours for a specific day or day range
 */
export interface OpeningHours {
  /** Day(s) display text (e.g., "Hétfő - Péntek") */
  days: string;
  /** Hours display text (e.g., "08:00 - 18:00" or "Zárva") */
  hours: string;
  /** Schema.org day codes (e.g., "Mo-Fr", "Sa") */
  schemaDays?: string;
  /** Schema.org time (e.g., "08:00-18:00") */
  schemaTime?: string;
  /** Is closed on this day? */
  closed?: boolean;
}

/**
 * Special hours (holidays, etc.)
 */
export interface SpecialHours {
  /** Date (ISO format) */
  date: string;
  /** Description (e.g., "Karácsony") */
  description: string;
  /** Hours or "Zárva" */
  hours: string;
  /** Is closed? */
  closed?: boolean;
}

// =============================================================================
// Team / People
// =============================================================================

/**
 * Team member / Person
 */
export interface Person {
  /** Full name */
  name: string;
  /** Job title / Role */
  title: string;
  /** Photo URL */
  photo?: string;
  /** Bio / Description */
  bio?: string;
  /** Email */
  email?: string;
  /** Phone */
  phone?: string;
  /** LinkedIn URL */
  linkedin?: string;
  /** Is this the CEO/owner? */
  isOwner?: boolean;
  /** Is this the founder? */
  isFounder?: boolean;
  /** Display order */
  order?: number;
}

// =============================================================================
// Social Media
// =============================================================================

export type SocialPlatform =
  | 'facebook'
  | 'instagram'
  | 'linkedin'
  | 'youtube'
  | 'tiktok'
  | 'twitter'
  | 'pinterest'
  | 'google';

/**
 * Social media link
 */
export interface SocialLink {
  /** Platform identifier */
  platform: SocialPlatform;
  /** Profile URL */
  url: string;
  /** Display label (optional override) */
  label?: string;
}

// =============================================================================
// Services / Products
// =============================================================================

/**
 * Service or product offered
 */
export interface Service {
  /** Service ID (slug) */
  id: string;
  /** Display name */
  name: string;
  /** Short description */
  description?: string;
  /** Full description (HTML allowed) */
  content?: string;
  /** Service page URL */
  url?: string;
  /** Icon name or URL */
  icon?: string;
  /** Image URL */
  image?: string;
  /** Price range text (e.g., "30 000 - 150 000 Ft") */
  priceRange?: string;
  /** Starting price */
  priceFrom?: number;
  /** Currency code */
  currency?: string;
  /** Is this a featured/main service? */
  featured?: boolean;
  /** Display order */
  order?: number;
  /** Category */
  category?: string;
}

// =============================================================================
// Branding / Design
// =============================================================================

/**
 * Color definition with variants
 */
export interface ColorPalette {
  /** Primary color (hex) */
  primary: string;
  /** Primary dark variant */
  primaryDark?: string;
  /** Primary light variant */
  primaryLight?: string;
  /** Secondary color */
  secondary?: string;
  /** Accent color */
  accent?: string;
  /** Background color */
  background?: string;
  /** Surface/card color */
  surface?: string;
  /** Text color */
  text?: string;
  /** Muted text color */
  textMuted?: string;
  /** Border color */
  border?: string;
  /** Success color */
  success?: string;
  /** Warning color */
  warning?: string;
  /** Error color */
  error?: string;
  /** Info color */
  info?: string;
}

/**
 * Typography settings
 */
export interface Typography {
  /** Heading font family */
  headingFont?: string;
  /** Body font family */
  bodyFont?: string;
  /** Google Fonts URL (if using Google Fonts) */
  googleFontsUrl?: string;
  /** Font import CSS */
  fontImport?: string;
}

/**
 * Logo configuration
 */
export interface Logo {
  /** Main logo URL (for light backgrounds) */
  main: string;
  /** Logo for dark backgrounds */
  dark?: string;
  /** Small/icon version */
  icon?: string;
  /** Logo alt text */
  alt: string;
  /** Logo width (px) */
  width?: number;
  /** Logo height (px) */
  height?: number;
}

/**
 * Branding configuration
 */
export interface Branding {
  /** Logo configuration */
  logo: Logo;
  /** Favicon path */
  favicon?: string;
  /** Apple touch icon path */
  appleTouchIcon?: string;
  /** Color palette */
  colors: ColorPalette;
  /** Typography settings */
  typography?: Typography;
  /** Open Graph default image */
  ogImage?: string;
  /** Twitter card default image */
  twitterImage?: string;
}

// =============================================================================
// SEO & Meta
// =============================================================================

/**
 * SEO configuration
 */
export interface SeoConfig {
  /** Default page title suffix (e.g., " | Cégünk Kft.") */
  titleSuffix?: string;
  /** Default meta description */
  defaultDescription?: string;
  /** Site language */
  language: string;
  /** Locale for Open Graph (e.g., "hu_HU") */
  locale: string;
  /** Twitter handle (without @) */
  twitterHandle?: string;
  /** Default robots meta */
  robots?: string;
  /** Google Site Verification */
  googleVerification?: string;
  /** Bing Site Verification */
  bingVerification?: string;
}

// =============================================================================
// Analytics & Tracking
// =============================================================================

/**
 * Analytics configuration
 */
export interface AnalyticsConfig {
  /** Google Tag Manager ID */
  gtmId?: string;
  /** Google Analytics 4 Measurement ID */
  ga4Id?: string;
  /** Facebook Pixel ID */
  facebookPixelId?: string;
  /** Google Ads Conversion ID */
  googleAdsId?: string;
  /** CookieYes banner ID */
  cookieYesId?: string;
  /** Hotjar Site ID */
  hotjarId?: string;
  /** Microsoft Clarity ID */
  clarityId?: string;
}

// =============================================================================
// Legal
// =============================================================================

/**
 * Legal configuration
 */
export interface LegalConfig {
  /** Privacy policy URL */
  privacyPolicyUrl?: string;
  /** Terms and conditions URL */
  termsUrl?: string;
  /** Cookie policy URL */
  cookiePolicyUrl?: string;
  /** GDPR/data protection info URL */
  gdprUrl?: string;
  /** Impressum/legal notice URL */
  impressumUrl?: string;
  /** Complaint handling policy URL */
  complaintUrl?: string;
}

// =============================================================================
// Navigation
// =============================================================================

/**
 * Navigation item
 */
export interface NavItem {
  /** Display label */
  label: string;
  /** URL */
  href: string;
  /** Dropdown children */
  children?: NavItem[];
  /** Icon (optional) */
  icon?: string;
  /** Is external link? */
  external?: boolean;
  /** Highlight as CTA? */
  cta?: boolean;
}

/**
 * Navigation configuration
 */
export interface NavigationConfig {
  /** Main navigation items */
  main: NavItem[];
  /** Footer navigation (if different from main) */
  footer?: NavItem[];
  /** CTA button config */
  cta?: {
    label: string;
    href: string;
    phone?: string;
  };
}

// =============================================================================
// Schema.org Defaults
// =============================================================================

/**
 * Schema.org configuration for structured data
 */
export interface SchemaConfig {
  /** Business type (e.g., "MovingCompany", "LocalBusiness") */
  type: string;
  /** Price range indicator ($, $$, $$$) */
  priceRange?: string;
  /** Areas served (cities, regions) */
  areasServed?: string[];
  /** Currencies accepted */
  currenciesAccepted?: string[];
  /** Payment methods accepted */
  paymentAccepted?: string[];
  /** Aggregate rating */
  aggregateRating?: {
    ratingValue: number;
    reviewCount: number;
    bestRating?: number;
  };
}

// =============================================================================
// Main Site Config
// =============================================================================

/**
 * Complete site configuration
 */
export interface SiteConfig {
  /** Site URL (without trailing slash) */
  url: string;

  /** Company information */
  company: CompanyInfo;

  /** Contact information */
  contact: ContactInfo;

  /** Opening hours */
  openingHours?: OpeningHours[];

  /** Special hours (holidays) */
  specialHours?: SpecialHours[];

  /** Team members */
  team?: Person[];

  /** Social media links */
  social?: SocialLink[];

  /** Services/products */
  services?: Service[];

  /** Branding configuration */
  branding: Branding;

  /** SEO configuration */
  seo: SeoConfig;

  /** Analytics configuration */
  analytics?: AnalyticsConfig;

  /** Legal configuration */
  legal?: LegalConfig;

  /** Navigation configuration */
  navigation?: NavigationConfig;

  /** Schema.org configuration */
  schema?: SchemaConfig;

  /** Custom/additional data */
  custom?: Record<string, unknown>;
}

// =============================================================================
// Partial Types (for merging)
// =============================================================================

export type PartialSiteConfig = Partial<SiteConfig> & {
  url: string;
  company: Partial<CompanyInfo> & { name: string };
  contact: Partial<ContactInfo>;
  branding: Partial<Branding> & { logo: Logo; colors: Partial<ColorPalette> & { primary: string } };
  seo: Partial<SeoConfig> & { language: string; locale: string };
};
