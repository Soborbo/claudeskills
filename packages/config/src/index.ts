/**
 * @leadgen/config
 *
 * Central site configuration for lead generation websites.
 */

import type {
  SiteConfig,
  PartialSiteConfig,
  CompanyInfo,
  ContactInfo,
  PhoneNumber,
  EmailAddress,
  Address,
  OpeningHours,
  Person,
  SocialLink,
  Service,
  Branding,
  SeoConfig,
  AnalyticsConfig,
  LegalConfig,
  NavigationConfig,
  SchemaConfig,
  ColorPalette,
} from './types';

// =============================================================================
// Re-exports
// =============================================================================

export * from './types';
export * from './schema';

// =============================================================================
// Default Values
// =============================================================================

const DEFAULT_COLORS: ColorPalette = {
  primary: '#2563eb',
  primaryDark: '#1d4ed8',
  primaryLight: '#3b82f6',
  secondary: '#64748b',
  accent: '#f59e0b',
  background: '#ffffff',
  surface: '#f8fafc',
  text: '#1e293b',
  textMuted: '#64748b',
  border: '#e2e8f0',
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
};

const DEFAULT_SEO: Partial<SeoConfig> = {
  language: 'hu',
  locale: 'hu_HU',
  robots: 'index, follow',
};

// =============================================================================
// Config Store
// =============================================================================

let _siteConfig: SiteConfig | null = null;

/**
 * Define the site configuration
 *
 * @param config - Site configuration object
 * @returns Complete site configuration with defaults applied
 *
 * @example
 * // site.config.ts
 * import { defineSiteConfig } from '@leadgen/config';
 *
 * export default defineSiteConfig({
 *   url: 'https://example.hu',
 *   company: {
 *     name: 'Költöztető Kft.',
 *     legalName: 'Költöztető Szolgáltató Kft.',
 *     // ...
 *   },
 *   // ...
 * });
 */
export function defineSiteConfig(config: PartialSiteConfig): SiteConfig {
  // Apply defaults
  const fullConfig: SiteConfig = {
    url: config.url.replace(/\/$/, ''), // Remove trailing slash
    company: {
      name: config.company.name,
      legalName: config.company.legalName || config.company.name,
      tagline: config.company.tagline,
      description: config.company.description,
      about: config.company.about,
      taxNumber: config.company.taxNumber,
      vatNumber: config.company.vatNumber,
      registrationNumber: config.company.registrationNumber,
      foundedYear: config.company.foundedYear,
      employees: config.company.employees,
      industry: config.company.industry,
      schemaType: config.company.schemaType || 'LocalBusiness',
    },
    contact: {
      phones: config.contact.phones || [],
      emails: config.contact.emails || [],
      addresses: config.contact.addresses || [],
      contactFormUrl: config.contact.contactFormUrl,
      bookingUrl: config.contact.bookingUrl,
    },
    openingHours: config.openingHours,
    specialHours: config.specialHours,
    team: config.team,
    social: config.social,
    services: config.services,
    branding: {
      logo: config.branding.logo,
      favicon: config.branding.favicon || '/favicon.ico',
      appleTouchIcon: config.branding.appleTouchIcon,
      colors: {
        ...DEFAULT_COLORS,
        ...config.branding.colors,
      },
      typography: config.branding.typography,
      ogImage: config.branding.ogImage,
      twitterImage: config.branding.twitterImage,
    },
    seo: {
      ...DEFAULT_SEO,
      ...config.seo,
      language: config.seo.language,
      locale: config.seo.locale,
    } as SeoConfig,
    analytics: config.analytics,
    legal: config.legal,
    navigation: config.navigation,
    schema: config.schema,
    custom: config.custom,
  };

  // Store globally
  _siteConfig = fullConfig;

  return fullConfig;
}

/**
 * Get the current site configuration
 *
 * @throws Error if config not defined yet
 */
export function getSiteConfig(): SiteConfig {
  if (!_siteConfig) {
    throw new Error(
      '[@leadgen/config] Site config not defined. Call defineSiteConfig() first.'
    );
  }
  return _siteConfig;
}

/**
 * Check if site config is defined
 */
export function hasSiteConfig(): boolean {
  return _siteConfig !== null;
}

// =============================================================================
// Convenience Getters
// =============================================================================

/**
 * Get company info
 */
export function getCompany(): CompanyInfo {
  return getSiteConfig().company;
}

/**
 * Get contact info
 */
export function getContact(): ContactInfo {
  return getSiteConfig().contact;
}

/**
 * Get primary phone number
 */
export function getPrimaryPhone(): PhoneNumber | undefined {
  const phones = getSiteConfig().contact.phones;
  return phones.find((p) => p.primary) || phones[0];
}

/**
 * Get primary email
 */
export function getPrimaryEmail(): EmailAddress | undefined {
  const emails = getSiteConfig().contact.emails;
  return emails.find((e) => e.primary) || emails[0];
}

/**
 * Get primary address
 */
export function getPrimaryAddress(): Address | undefined {
  const addresses = getSiteConfig().contact.addresses;
  return addresses.find((a) => a.label === 'primary') || addresses[0];
}

/**
 * Get opening hours
 */
export function getOpeningHours(): OpeningHours[] {
  return getSiteConfig().openingHours || [];
}

/**
 * Get social links
 */
export function getSocialLinks(): SocialLink[] {
  return getSiteConfig().social || [];
}

/**
 * Get team members (sorted by order)
 */
export function getTeam(): Person[] {
  const team = getSiteConfig().team || [];
  return [...team].sort((a, b) => (a.order || 99) - (b.order || 99));
}

/**
 * Get owner/founder
 */
export function getOwner(): Person | undefined {
  return getSiteConfig().team?.find((p) => p.isOwner);
}

/**
 * Get services (sorted by order)
 */
export function getServices(): Service[] {
  const services = getSiteConfig().services || [];
  return [...services].sort((a, b) => (a.order || 99) - (b.order || 99));
}

/**
 * Get featured services
 */
export function getFeaturedServices(): Service[] {
  return getServices().filter((s) => s.featured);
}

/**
 * Get service by ID
 */
export function getServiceById(id: string): Service | undefined {
  return getSiteConfig().services?.find((s) => s.id === id);
}

/**
 * Get branding config
 */
export function getBranding(): Branding {
  return getSiteConfig().branding;
}

/**
 * Get color palette
 */
export function getColors(): ColorPalette {
  return getSiteConfig().branding.colors;
}

/**
 * Get SEO config
 */
export function getSeo(): SeoConfig {
  return getSiteConfig().seo;
}

/**
 * Get analytics config
 */
export function getAnalytics(): AnalyticsConfig | undefined {
  return getSiteConfig().analytics;
}

/**
 * Get legal config
 */
export function getLegal(): LegalConfig | undefined {
  return getSiteConfig().legal;
}

/**
 * Get navigation config
 */
export function getNavigation(): NavigationConfig | undefined {
  return getSiteConfig().navigation;
}

// =============================================================================
// Formatting Helpers
// =============================================================================

/**
 * Format phone number for tel: link
 */
export function formatPhoneHref(phone: PhoneNumber | string): string {
  const number = typeof phone === 'string' ? phone : phone.number;
  return `tel:${number.replace(/\s/g, '')}`;
}

/**
 * Format email for mailto: link
 */
export function formatEmailHref(email: EmailAddress | string): string {
  const address = typeof email === 'string' ? email : email.email;
  return `mailto:${address}`;
}

/**
 * Format address as single line
 */
export function formatAddressLine(address: Address): string {
  return `${address.postalCode} ${address.city}, ${address.street}`;
}

/**
 * Format address as multi-line
 */
export function formatAddressMultiline(address: Address): string[] {
  return [
    address.street,
    `${address.postalCode} ${address.city}`,
    address.region ? `${address.region}, ${address.country}` : address.country,
  ];
}

/**
 * Get page title with suffix
 */
export function getPageTitle(title: string): string {
  const config = getSiteConfig();
  const suffix = config.seo.titleSuffix || ` | ${config.company.name}`;
  return `${title}${suffix}`;
}

/**
 * Get full URL for a path
 */
export function getFullUrl(path: string): string {
  const baseUrl = getSiteConfig().url;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}

// =============================================================================
// CSS Variable Generation
// =============================================================================

/**
 * Generate CSS custom properties from color palette
 */
export function generateColorCssVars(colors: ColorPalette = getColors()): string {
  const vars: string[] = [];

  Object.entries(colors).forEach(([key, value]) => {
    if (value) {
      // Convert camelCase to kebab-case
      const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      vars.push(`--color-${cssKey}: ${value};`);
    }
  });

  return `:root {\n  ${vars.join('\n  ')}\n}`;
}

/**
 * Generate Tailwind color config from palette
 */
export function generateTailwindColors(colors: ColorPalette = getColors()): Record<string, string> {
  return {
    primary: {
      DEFAULT: colors.primary,
      dark: colors.primaryDark || colors.primary,
      light: colors.primaryLight || colors.primary,
    },
    secondary: {
      DEFAULT: colors.secondary || '#64748b',
    },
    accent: {
      DEFAULT: colors.accent || '#f59e0b',
    },
  } as unknown as Record<string, string>;
}
