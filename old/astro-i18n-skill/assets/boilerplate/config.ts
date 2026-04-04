/**
 * i18n Configuration
 * 
 * Central configuration for internationalization.
 * Modify locales, default language, and routing strategy here.
 */

/**
 * Locale lifecycle states
 * - active: fully indexed, in hreflang, normal operation
 * - paused: noindex, excluded from hreflang, shows "coming soon" banner
 * - deprecated: 301 redirect to default, removed from sitemap
 */
export type LocaleState = 'active' | 'paused' | 'deprecated';

export const i18nConfig = {
  /**
   * Default locale - used when no locale prefix is present
   */
  defaultLocale: 'en' as const,
  
  /**
   * All supported locales
   */
  locales: ['en', 'hu'] as const,
  
  /**
   * Locale lifecycle states
   * Controls indexing, hreflang inclusion, and redirects
   */
  localeStates: {
    en: 'active',
    hu: 'active',
    // de: 'paused',      // Example: noindex, no hreflang, show banner
    // sk: 'deprecated',  // Example: 301 → default locale
  } as Record<string, LocaleState>,
  
  /**
   * x-default hreflang locale
   */
  xDefaultLocale: 'en' as const,
  
  /**
   * URL routing strategy
   */
  routing: 'prefix-except-default' as const,
  
  /**
   * Base site URL (required for hreflang)
   */
  siteUrl: 'https://example.com',
  
  /**
   * Locale metadata
   */
  localeLabels: {
    en: {
      name: 'English',
      nativeName: 'English',
      flag: '🇬🇧',
      hreflangCode: 'en',
    },
    hu: {
      name: 'Hungarian',
      nativeName: 'Magyar',
      flag: '🇭🇺',
      hreflangCode: 'hu',
    },
  },
} as const;

export type Locale = (typeof i18nConfig.locales)[number];

/**
 * Check if locale is valid
 */
export function isValidLocale(value: string): value is Locale {
  return i18nConfig.locales.includes(value as Locale);
}

/**
 * Get locale metadata
 */
export function getLocaleInfo(locale: Locale) {
  return i18nConfig.localeLabels[locale];
}

/**
 * Get locale state (active/paused/deprecated)
 */
export function getLocaleState(locale: Locale): LocaleState {
  return i18nConfig.localeStates[locale] ?? 'active';
}

/**
 * Get only active locales (for hreflang, sitemap)
 */
export function getActiveLocales(): Locale[] {
  return i18nConfig.locales.filter(
    (locale) => getLocaleState(locale) === 'active'
  );
}

/**
 * Check if locale should be indexed
 */
export function shouldIndexLocale(locale: Locale): boolean {
  return getLocaleState(locale) === 'active';
}

/**
 * Check if locale should be in hreflang
 */
export function shouldIncludeInHreflang(locale: Locale): boolean {
  return getLocaleState(locale) === 'active';
}
