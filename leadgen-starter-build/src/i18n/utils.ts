import en from './en.json';
import { config } from '../config/siteConfig.example';

type NestedKeyOf<T> = T extends object
  ? { [K in keyof T & string]: T[K] extends object
      ? `${K}.${NestedKeyOf<T[K]>}`
      : K
    }[keyof T & string]
  : never;

type TranslationKey = NestedKeyOf<typeof en>;

const translations: Record<string, typeof en> = { en };

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

/**
 * Get a nested array value from translations (for structured data like steps).
 */
export function tArray<T = unknown>(key: string): T[] {
  const locale = config.locale.split('-')[0];
  const dict = translations[locale] ?? translations.en ?? en;
  const value = getNestedValue(dict as unknown as Record<string, unknown>, key);
  return Array.isArray(value) ? value as T[] : [];
}

/**
 * Translation helper. Interpolates {year}, {companyName}, {area} etc.
 */
export function t(key: TranslationKey, vars?: Record<string, string | number>): string {
  const locale = config.locale.split('-')[0];
  const dict = translations[locale] ?? translations.en ?? en;
  let value = getNestedValue(dict as unknown as Record<string, unknown>, key);

  if (value === undefined) {
    value = getNestedValue(en as unknown as Record<string, unknown>, key);
  }

  if (typeof value !== 'string') return key;

  let result = value;

  // Default interpolation values from siteConfig
  const defaults: Record<string, string | number> = {
    year: new Date().getFullYear(),
    companyName: config.name,
    phone: config.contact.phoneDisplay,
    email: config.contact.email,
  };

  const mergedVars = { ...defaults, ...vars };

  for (const [k, v] of Object.entries(mergedVars)) {
    result = result.replaceAll(`{${k}}`, String(v));
  }

  return result;
}
