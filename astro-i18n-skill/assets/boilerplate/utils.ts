/**
 * Translation Utilities
 * 
 * Type-safe translation functions with interpolation and fallback support.
 * Works with JSON translation files.
 */

import { i18nConfig, type Locale } from './config';

// Import translation files
// Add new locales here
import en from './translations/en.json';
import hu from './translations/hu.json';

/**
 * All translations indexed by locale
 */
const translations: Record<Locale, typeof en> = {
  en,
  hu,
};

/**
 * Get translated string by dot notation key
 * Supports interpolation with {param} syntax
 * Falls back to default locale if missing
 * 
 * @example
 * t('en', 'nav.home') → 'Home'
 * t('hu', 'hero.title', { company: 'Acme' }) → 'Üdvözöljük az Acme-nál'
 */
export function t(
  locale: Locale,
  key: string,
  params?: Record<string, string | number>
): string {
  // Try requested locale
  let value = getNestedValue(translations[locale], key);
  let usedFallback = false;
  
  // Fallback chain: requested → default → key
  if (typeof value !== 'string' && locale !== i18nConfig.defaultLocale) {
    value = getNestedValue(translations[i18nConfig.defaultLocale], key);
    usedFallback = true;
  }
  
  if (typeof value !== 'string') {
    // Development: visible marker
    if (import.meta.env?.DEV) {
      console.error(`[i18n] MISSING: ${key}`);
      return `[${key}]`;
    }
    // Production: return key
    return key;
  }
  
  if (usedFallback && import.meta.env?.DEV) {
    console.warn(`[i18n] Fallback: ${locale}.${key} → ${i18nConfig.defaultLocale}`);
  }
  
  return interpolate(value, params);
}

/**
 * Check translation completeness for a locale
 * Returns ratio 0-1 (1 = 100% complete)
 */
export function getTranslationCompleteness(locale: Locale): number {
  if (locale === i18nConfig.defaultLocale) return 1;
  
  const baseKeys = getAllKeys(translations[i18nConfig.defaultLocale]);
  const localeKeys = getAllKeys(translations[locale]);
  
  const missing = [...baseKeys].filter(k => !localeKeys.has(k));
  return (baseKeys.size - missing.length) / baseKeys.size;
}

/**
 * Get all translation keys from an object
 */
function getAllKeys(obj: object, prefix = ''): Set<string> {
  const keys = new Set<string>();
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null) {
      for (const k of getAllKeys(value, fullKey)) keys.add(k);
    } else {
      keys.add(fullKey);
    }
  }
  return keys;
}

/**
 * Create a scoped translation function for a specific locale
 * Useful in components to avoid passing locale repeatedly
 */
export function useTranslations(locale: Locale) {
  return (key: string, params?: Record<string, string | number>) => 
    t(locale, key, params);
}

/**
 * Check if translation exists (without fallback)
 */
export function hasTranslation(locale: Locale, key: string): boolean {
  const value = getNestedValue(translations[locale], key);
  return typeof value === 'string';
}

// ============================================
// Namespace Support (for large projects)
// ============================================

/**
 * Translation namespace cache
 * Cloudflare Pages compatible - no dynamic imports at runtime
 */
const namespaceCache: Map<string, Record<string, unknown>> = new Map();

/**
 * Load a translation namespace
 * For SSG: import at build time
 * For large projects, split translations into namespaces
 * 
 * Directory structure:
 * src/i18n/translations/
 * ├── en/
 * │   ├── common.json
 * │   ├── pages/home.json
 * │   └── components/calculator.json
 * └── hu/
 *     ├── common.json
 *     └── ...
 * 
 * @example
 * // At top of component (build-time import)
 * import calculatorEn from '@/i18n/translations/en/components/calculator.json';
 * import calculatorHu from '@/i18n/translations/hu/components/calculator.json';
 * registerNamespace('components.calculator', { en: calculatorEn, hu: calculatorHu });
 * 
 * // Then use
 * tn(locale, 'components.calculator', 'step1.title')
 */
export function registerNamespace(
  namespace: string,
  translations: Record<Locale, Record<string, unknown>>
): void {
  for (const [locale, data] of Object.entries(translations)) {
    const cacheKey = `${locale}:${namespace}`;
    namespaceCache.set(cacheKey, data);
  }
}

/**
 * Get translation from a specific namespace
 * Cloudflare Pages compatible - uses pre-registered namespaces
 */
export function tn(
  locale: Locale,
  namespace: string,
  key: string,
  params?: Record<string, string | number>
): string {
  const cacheKey = `${locale}:${namespace}`;
  let data = namespaceCache.get(cacheKey);
  
  // Fallback to default locale
  if (!data && locale !== i18nConfig.defaultLocale) {
    const fallbackKey = `${i18nConfig.defaultLocale}:${namespace}`;
    data = namespaceCache.get(fallbackKey);
  }
  
  if (!data) {
    console.error(`[i18n] Namespace not registered: ${namespace}`);
    return `[${namespace}.${key}]`;
  }
  
  const value = getNestedValue(data, key);
  
  if (typeof value !== 'string') {
    console.error(`[i18n] Missing: ${namespace}.${key}`);
    return `[${namespace}.${key}]`;
  }
  
  return interpolate(value, params);
}

/**
 * Get all translations for a namespace
 * 
 * @example
 * getNamespace('en', 'nav') → { home: 'Home', about: 'About', ... }
 */
export function getNamespace(
  locale: Locale,
  namespace: string
): Record<string, unknown> | null {
  const value = getNestedValue(translations[locale], namespace);
  
  if (typeof value === 'object' && value !== null) {
    return value as Record<string, unknown>;
  }
  
  return null;
}

// ============================================
// Formatting Utilities
// ============================================

/**
 * Format date according to locale
 * 
 * @example
 * formatDate(new Date(), 'en') → 'January 1, 2024'
 * formatDate(new Date(), 'hu') → '2024. január 1.'
 */
export function formatDate(
  date: Date | string,
  locale: Locale,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  
  return new Intl.DateTimeFormat(locale, options ?? defaultOptions).format(d);
}

/**
 * Format short date
 */
export function formatShortDate(date: Date | string, locale: Locale): string {
  return formatDate(date, locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format date with time
 */
export function formatDateTime(date: Date | string, locale: Locale): string {
  return formatDate(date, locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Locale-specific currencies
 * Add/modify as needed
 */
const LOCALE_CURRENCIES: Record<Locale, string> = {
  en: 'GBP',
  hu: 'HUF',
};

/**
 * Format price/currency according to locale
 * 
 * @example
 * formatPrice(1000, 'en') → '£1,000'
 * formatPrice(100000, 'hu') → '100 000 Ft'
 */
export function formatPrice(
  amount: number,
  locale: Locale,
  currency?: string
): string {
  const curr = currency ?? LOCALE_CURRENCIES[locale];
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: curr,
    // Hungarian Forint doesn't use decimals
    maximumFractionDigits: curr === 'HUF' ? 0 : 2,
  }).format(amount);
}

/**
 * Format number according to locale
 * 
 * @example
 * formatNumber(1234567, 'en') → '1,234,567'
 * formatNumber(1234567, 'hu') → '1 234 567'
 */
export function formatNumber(num: number, locale: Locale): string {
  return new Intl.NumberFormat(locale).format(num);
}

/**
 * Format compact number (1K, 1M, etc.)
 */
export function formatCompactNumber(num: number, locale: Locale): string {
  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    compactDisplay: 'short',
  }).format(num);
}

/**
 * Format percentage
 */
export function formatPercent(
  value: number,
  locale: Locale,
  decimals = 0
): string {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format relative time (2 days ago, in 3 hours, etc.)
 */
export function formatRelativeTime(date: Date, locale: Locale): string {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const diff = date.getTime() - Date.now();
  
  const seconds = Math.round(diff / 1000);
  const minutes = Math.round(diff / (1000 * 60));
  const hours = Math.round(diff / (1000 * 60 * 60));
  const days = Math.round(diff / (1000 * 60 * 60 * 24));
  const weeks = Math.round(diff / (1000 * 60 * 60 * 24 * 7));
  const months = Math.round(diff / (1000 * 60 * 60 * 24 * 30));
  
  if (Math.abs(seconds) < 60) return rtf.format(seconds, 'second');
  if (Math.abs(minutes) < 60) return rtf.format(minutes, 'minute');
  if (Math.abs(hours) < 24) return rtf.format(hours, 'hour');
  if (Math.abs(days) < 7) return rtf.format(days, 'day');
  if (Math.abs(weeks) < 4) return rtf.format(weeks, 'week');
  
  return rtf.format(months, 'month');
}

// ============================================
// Internal Helpers
// ============================================

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: unknown, key: string): unknown {
  const keys = key.split('.');
  let value: unknown = obj;
  
  for (const k of keys) {
    if (value === null || value === undefined) return undefined;
    value = (value as Record<string, unknown>)[k];
  }
  
  return value;
}

/**
 * Replace {param} placeholders with values
 */
function interpolate(
  str: string,
  params?: Record<string, string | number>
): string {
  if (!params) return str;
  
  return str.replace(/\{(\w+)\}/g, (match, key) => {
    const value = params[key];
    return value !== undefined ? String(value) : match;
  });
}
