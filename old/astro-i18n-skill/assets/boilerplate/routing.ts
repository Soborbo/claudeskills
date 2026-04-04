/**
 * i18n Routing Utilities
 * 
 * URL generation and parsing for multilingual sites.
 * Works with both Astro and Next.js.
 */

import { i18nConfig, type Locale, isValidLocale } from './config';

/**
 * Get absolute URL for a locale + path combination
 * Used for hreflang tags (requires full URL with protocol)
 * 
 * @example
 * getAbsoluteLocaleUrl('en', '/about') → 'https://example.com/about'
 * getAbsoluteLocaleUrl('hu', '/about') → 'https://example.com/hu/about'
 */
export function getAbsoluteLocaleUrl(locale: Locale, path: string): string {
  const { siteUrl, defaultLocale, routing } = i18nConfig;
  const cleanPath = normalizePath(path);
  
  // Default locale without prefix (when using prefix-except-default)
  if (routing === 'prefix-except-default' && locale === defaultLocale) {
    return `${siteUrl}${cleanPath}`;
  }
  
  return `${siteUrl}/${locale}${cleanPath}`;
}

/**
 * Get relative URL for a locale + path combination
 * Used for internal navigation links
 * 
 * @example
 * getRelativeLocaleUrl('en', '/about') → '/about'
 * getRelativeLocaleUrl('hu', '/about') → '/hu/about'
 */
export function getRelativeLocaleUrl(locale: Locale, path: string): string {
  const { defaultLocale, routing } = i18nConfig;
  const cleanPath = normalizePath(path);
  
  if (routing === 'prefix-except-default' && locale === defaultLocale) {
    return cleanPath || '/';
  }
  
  return `/${locale}${cleanPath}`;
}

/**
 * Extract current locale from URL
 * 
 * @example
 * getCurrentLocale(new URL('https://example.com/hu/about')) → 'hu'
 * getCurrentLocale(new URL('https://example.com/about')) → 'en' (default)
 */
export function getCurrentLocale(url: URL): Locale {
  const segments = url.pathname.split('/').filter(Boolean);
  const maybeLocale = segments[0];
  
  if (maybeLocale && isValidLocale(maybeLocale)) {
    return maybeLocale;
  }
  
  return i18nConfig.defaultLocale;
}

/**
 * Get path without locale prefix
 * Useful for language switcher and hreflang generation
 * 
 * @example
 * getPathWithoutLocale(new URL('https://example.com/hu/about')) → '/about'
 * getPathWithoutLocale(new URL('https://example.com/about')) → '/about'
 */
export function getPathWithoutLocale(url: URL): string {
  const segments = url.pathname.split('/').filter(Boolean);
  const firstSegment = segments[0];
  
  if (firstSegment && isValidLocale(firstSegment)) {
    const pathWithoutLocale = '/' + segments.slice(1).join('/');
    return pathWithoutLocale || '/';
  }
  
  return url.pathname || '/';
}

/**
 * Switch locale while preserving current path
 * Returns new URL for the target locale
 */
export function switchLocale(url: URL, targetLocale: Locale): string {
  const currentPath = getPathWithoutLocale(url);
  return getRelativeLocaleUrl(targetLocale, currentPath);
}

/**
 * Switch locale with scroll/state preservation
 * Call this from language switcher click handlers
 * Cloudflare Pages compatible (client-side only)
 */
export function switchLocalePreserveState(
  url: URL, 
  targetLocale: Locale
): string {
  const newUrl = switchLocale(url, targetLocale);
  
  // Preserve scroll position (client-side only)
  if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
    try {
      sessionStorage.setItem('i18n_scroll_y', String(window.scrollY));
      sessionStorage.setItem('i18n_scroll_path', getPathWithoutLocale(url));
    } catch {
      // sessionStorage unavailable (private mode, etc.)
    }
  }
  
  return newUrl;
}

/**
 * Restore scroll position after locale switch
 * Call this in client-side script on page load
 */
export function restoreScrollPosition(): void {
  if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') return;
  
  try {
    const savedY = sessionStorage.getItem('i18n_scroll_y');
    const savedPath = sessionStorage.getItem('i18n_scroll_path');
    const currentPath = window.location.pathname.replace(/^\/[a-z]{2}(?:\/|$)/, '/');
    
    // Only restore if same page (different locale)
    if (savedY && savedPath && currentPath.startsWith(savedPath.replace(/\/$/, ''))) {
      requestAnimationFrame(() => {
        window.scrollTo({ top: parseInt(savedY, 10), behavior: 'instant' });
      });
    }
    
    // Clean up
    sessionStorage.removeItem('i18n_scroll_y');
    sessionStorage.removeItem('i18n_scroll_path');
  } catch {
    // Ignore errors
  }
}

/**
 * Generate all locale URLs for a given path
 * Used for hreflang generation
 * 
 * @example
 * getAllLocaleUrls('/about')
 * → { en: 'https://example.com/about', hu: 'https://example.com/hu/about' }
 */
export function getAllLocaleUrls(path: string): Record<Locale, string> {
  const urls = {} as Record<Locale, string>;
  
  for (const locale of i18nConfig.locales) {
    urls[locale] = getAbsoluteLocaleUrl(locale, path);
  }
  
  return urls;
}

/**
 * Generate hreflang tags data
 * Returns array ready for rendering in head
 * Only includes provided locales (filter to active before calling)
 */
export interface HreflangTag {
  hreflang: string;
  href: string;
}

export function generateHreflangTags(
  currentPath: string,
  availableLocales?: Locale[]
): HreflangTag[] {
  const locales = availableLocales ?? [...i18nConfig.locales];
  
  const tags: HreflangTag[] = locales.map((locale) => ({
    hreflang: i18nConfig.localeLabels[locale].hreflangCode ?? locale,
    href: getAbsoluteLocaleUrl(locale, currentPath),
  }));
  
  // Add x-default only if xDefaultLocale is in available locales
  const xDefault = i18nConfig.xDefaultLocale as Locale;
  if (locales.includes(xDefault)) {
    tags.push({
      hreflang: 'x-default',
      href: getAbsoluteLocaleUrl(xDefault, currentPath),
    });
  }
  
  return tags;
}

/**
 * Get canonical URL for current page
 */
export function getCanonicalUrl(locale: Locale, path: string): string {
  return getAbsoluteLocaleUrl(locale, path);
}

/**
 * Helper: Normalize path (ensure leading slash, remove trailing slash)
 */
function normalizePath(path: string): string {
  // Ensure leading slash
  let normalized = path.startsWith('/') ? path : `/${path}`;
  
  // Remove trailing slash (except for root)
  if (normalized.length > 1 && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }
  
  return normalized;
}

/**
 * Check if current URL matches a specific locale
 */
export function isCurrentLocale(url: URL, locale: Locale): boolean {
  return getCurrentLocale(url) === locale;
}

/**
 * Build localized href for Astro/Next links
 * Maintains current locale unless explicitly switching
 */
export function localizeHref(href: string, currentLocale: Locale): string {
  // External links - return as-is
  if (href.startsWith('http') || href.startsWith('//')) {
    return href;
  }
  
  // Anchor links - return as-is
  if (href.startsWith('#')) {
    return href;
  }
  
  // Already has locale prefix
  const segments = href.split('/').filter(Boolean);
  if (segments[0] && isValidLocale(segments[0])) {
    return href;
  }
  
  return getRelativeLocaleUrl(currentLocale, href);
}
