# Translation Management Reference

Best practices for managing translation files, type safety, and workflow.

## Translation Completeness Gate (Build Validation)

**Critical:** Build MUST fail if translations are incomplete.

```typescript
// scripts/validate-translations.ts
import fs from 'fs';
import { i18nConfig } from '../src/i18n/config';

const baseLocale = i18nConfig.defaultLocale;
const COMPLETENESS_THRESHOLD = 0.8; // 80% minimum

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

const baseTranslations = JSON.parse(
  fs.readFileSync(`src/i18n/translations/${baseLocale}.json`, 'utf-8')
);
const baseKeys = getAllKeys(baseTranslations);

let hasErrors = false;
const report: Record<string, { missing: string[]; extra: string[]; completeness: number }> = {};

for (const locale of i18nConfig.locales) {
  if (locale === baseLocale) continue;
  
  const translations = JSON.parse(
    fs.readFileSync(`src/i18n/translations/${locale}.json`, 'utf-8')
  );
  const localeKeys = getAllKeys(translations);
  
  const missing = [...baseKeys].filter(k => !localeKeys.has(k));
  const extra = [...localeKeys].filter(k => !baseKeys.has(k));
  const completeness = (baseKeys.size - missing.length) / baseKeys.size;
  
  report[locale] = { missing, extra, completeness };
  
  if (missing.length > 0) {
    console.error(`\n❌ ${locale}: Missing ${missing.length} keys (${(completeness * 100).toFixed(1)}% complete):`);
    missing.slice(0, 10).forEach(k => console.error(`   - ${k}`));
    if (missing.length > 10) console.error(`   ... and ${missing.length - 10} more`);
    
    if (completeness < COMPLETENESS_THRESHOLD) {
      console.error(`\n🚫 ${locale} below ${COMPLETENESS_THRESHOLD * 100}% threshold - BUILD BLOCKED`);
      hasErrors = true;
    }
  }
  
  if (extra.length > 0) {
    console.warn(`\n⚠️ ${locale}: ${extra.length} stale keys (remove or sync):`);
    extra.forEach(k => console.warn(`   - ${k}`));
  }
}

// Check for placeholder mismatches
function findPlaceholders(str: string): string[] {
  return [...str.matchAll(/\{(\w+)\}/g)].map(m => m[1]);
}

for (const locale of i18nConfig.locales) {
  if (locale === baseLocale) continue;
  const translations = JSON.parse(
    fs.readFileSync(`src/i18n/translations/${locale}.json`, 'utf-8')
  );
  
  for (const key of report[locale]?.missing ? [] : [...baseKeys]) {
    const baseValue = getNestedValue(baseTranslations, key);
    const localeValue = getNestedValue(translations, key);
    
    if (typeof baseValue === 'string' && typeof localeValue === 'string') {
      const basePlaceholders = findPlaceholders(baseValue);
      const localePlaceholders = findPlaceholders(localeValue);
      
      const missingPlaceholders = basePlaceholders.filter(p => !localePlaceholders.includes(p));
      if (missingPlaceholders.length > 0) {
        console.error(`❌ ${locale}.${key}: Missing placeholders: {${missingPlaceholders.join('}, {')}}`);
        hasErrors = true;
      }
    }
  }
}

function getNestedValue(obj: any, key: string): unknown {
  return key.split('.').reduce((o, k) => o?.[k], obj);
}

if (hasErrors) {
  console.error('\n\n🛑 TRANSLATION VALIDATION FAILED - FIX BEFORE DEPLOY\n');
  process.exit(1);
} else {
  console.log('\n✅ All translations valid and complete\n');
}
```

### Package.json Scripts

```json
{
  "scripts": {
    "i18n:validate": "ts-node scripts/validate-translations.ts",
    "i18n:check": "npm run i18n:validate",
    "build": "npm run i18n:check && astro build",
    "predeploy": "npm run i18n:check"
  }
}
```

## Fallback Chain

```typescript
// src/i18n/utils.ts - with fallback hierarchy
export function t(
  locale: Locale,
  key: string,
  params?: Record<string, string | number>
): string {
  // Try requested locale
  let value = getNestedValue(translations[locale], key);
  
  // Fallback chain: hu → en → key
  if (typeof value !== 'string' && locale !== i18nConfig.defaultLocale) {
    value = getNestedValue(translations[i18nConfig.defaultLocale], key);
    if (typeof value === 'string') {
      console.warn(`[i18n] Fallback used: ${locale}.${key} → ${i18nConfig.defaultLocale}`);
    }
  }
  
  if (typeof value !== 'string') {
    console.error(`[i18n] MISSING: ${key}`);
    return `[${key}]`; // Visible marker in dev
  }
  
  return interpolate(value, params);
}
```

## Indexing Rules by Completeness

| Completeness | Action | Meta |
|--------------|--------|------|
| 100% | Index | `<meta name="robots" content="index, follow">` |
| 80-99% | Index with warning | Log to analytics |
| <80% | NoIndex | `<meta name="robots" content="noindex, follow">` |
| Machine-translated | NoIndex | `<meta name="translation-type" content="machine">` |

```astro
---
// In layout - dynamic robots based on completeness
import { getTranslationCompleteness } from '@/i18n/utils';

const completeness = getTranslationCompleteness(locale);
const robotsContent = completeness < 0.8 ? 'noindex, follow' : 'index, follow';
---
<meta name="robots" content={robotsContent} />
```

## File Organization

### Flat Structure (Small Sites)

```
src/i18n/translations/
├── en.json
├── hu.json
└── de.json
```

### Namespaced Structure (Large Sites)

Recommended for projects with 50+ translation keys.

```
src/i18n/translations/
├── en/
│   ├── common.json        # Nav, footer, buttons, errors
│   ├── pages/
│   │   ├── home.json
│   │   ├── about.json
│   │   └── contact.json
│   └── components/
│       ├── calculator.json
│       ├── forms.json
│       └── header.json
└── hu/
    ├── common.json
    ├── pages/
    │   └── ...
    └── components/
        └── ...
```

### Using Namespaces (Cloudflare Pages Compatible)

Namespaces must be imported at build time (no dynamic imports at runtime):

```astro
---
// src/components/Calculator.astro
import { tn, registerNamespace } from '@/i18n/utils';
import { getCurrentLocale } from '@/i18n/routing';

// Import namespace translations (build-time)
import calcEn from '@/i18n/translations/en/components/calculator.json';
import calcHu from '@/i18n/translations/hu/components/calculator.json';

// Register once
registerNamespace('components.calculator', { en: calcEn, hu: calcHu });

const locale = getCurrentLocale(Astro.url);
---

<h2>{tn(locale, 'components.calculator', 'title')}</h2>
<p>{tn(locale, 'components.calculator', 'step1.description')}</p>
```

### Namespace Benefits

| Benefit | Impact |
|---------|--------|
| Smaller bundles | Only load what's needed per page |
| Team scalability | Different teams own different namespaces |
| Cache efficiency | Common namespace cached separately |
| Easier auditing | Clear ownership per namespace |

## Translation File Format

### Basic Structure

```json
{
  "meta": {
    "title": "Site Title",
    "description": "Site description for SEO"
  },
  "nav": {
    "home": "Home",
    "about": "About Us",
    "services": "Services",
    "contact": "Contact"
  },
  "home": {
    "hero": {
      "title": "Welcome to Our Site",
      "subtitle": "Your trusted partner",
      "cta": "Get Started"
    },
    "features": {
      "title": "Our Features",
      "item1": {
        "title": "Fast",
        "description": "Lightning fast performance"
      }
    }
  },
  "footer": {
    "copyright": "© {year} Company. All rights reserved.",
    "privacyPolicy": "Privacy Policy",
    "termsOfService": "Terms of Service"
  }
}
```

### Interpolation Syntax

```json
{
  "greeting": "Hello, {name}!",
  "items": "{count} items in cart",
  "price": "Total: {amount}",
  "date": "Last updated: {date}"
}
```

### Pluralization (ICU MessageFormat)

```json
{
  "items": "{count, plural, =0 {No items} =1 {One item} other {# items}}",
  "reviews": "{count, plural, =0 {No reviews yet} =1 {1 review} other {# reviews}}"
}
```

### Hungarian Pluralization

Hungarian doesn't have complex pluralization like English, but use ICU for consistency:

```json
{
  "items": "{count, plural, =0 {Nincs elem} =1 {1 elem} other {# elem}}",
  "reviews": "{count, plural, =0 {Még nincs vélemény} =1 {1 vélemény} other {# vélemény}}"
}
```

## Type-Safe Translation System

### Generate Types from JSON

```typescript
// scripts/generate-i18n-types.ts
import fs from 'fs';
import path from 'path';

const en = JSON.parse(
  fs.readFileSync('src/i18n/translations/en.json', 'utf-8')
);

function generateTypes(obj: object, prefix = ''): string[] {
  const keys: string[] = [];
  
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof value === 'object' && value !== null) {
      keys.push(...generateTypes(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  
  return keys;
}

const keys = generateTypes(en);
const typeContent = `// Auto-generated - do not edit
export type TranslationKey = 
  | ${keys.map(k => `'${k}'`).join('\n  | ')};
`;

fs.writeFileSync('src/i18n/types.ts', typeContent);
```

### Type-Safe t() Function

```typescript
// src/i18n/utils.ts
import type { TranslationKey } from './types';
import type { Locale } from './config';
import en from './translations/en.json';
import hu from './translations/hu.json';

const translations = { en, hu } as const;

export function t(
  locale: Locale,
  key: TranslationKey,
  params?: Record<string, string | number>
): string {
  const keys = key.split('.');
  let value: unknown = translations[locale];
  
  for (const k of keys) {
    value = (value as Record<string, unknown>)?.[k];
  }
  
  if (typeof value !== 'string') {
    // Fallback to English
    value = getNestedValue(translations.en, keys);
    if (typeof value !== 'string') {
      console.error(`Missing translation: ${key}`);
      return key;
    }
  }
  
  return interpolate(value, params);
}

function getNestedValue(obj: object, keys: string[]): unknown {
  let value: unknown = obj;
  for (const k of keys) {
    value = (value as Record<string, unknown>)?.[k];
  }
  return value;
}

function interpolate(
  str: string, 
  params?: Record<string, string | number>
): string {
  if (!params) return str;
  
  return str.replace(/\{(\w+)\}/g, (_, key) => {
    return String(params[key] ?? `{${key}}`);
  });
}
```

## Translation Workflow

### Development Process

1. **Add English string first** - Source of truth
2. **Run type generation** - Update TranslationKey type
3. **Use in code** - Get autocomplete + type checking
4. **Add translations** - Fill in other locales
5. **Validate** - Check for missing keys

### Validation Script

```typescript
// scripts/validate-translations.ts
import fs from 'fs';
import { i18nConfig } from '../src/i18n/config';

const locales = i18nConfig.locales;
const baseLocale = i18nConfig.defaultLocale;

function getAllKeys(obj: object, prefix = ''): Set<string> {
  const keys = new Set<string>();
  
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof value === 'object' && value !== null) {
      for (const k of getAllKeys(value, fullKey)) {
        keys.add(k);
      }
    } else {
      keys.add(fullKey);
    }
  }
  
  return keys;
}

const baseTranslations = JSON.parse(
  fs.readFileSync(`src/i18n/translations/${baseLocale}.json`, 'utf-8')
);
const baseKeys = getAllKeys(baseTranslations);

let hasErrors = false;

for (const locale of locales) {
  if (locale === baseLocale) continue;
  
  const translations = JSON.parse(
    fs.readFileSync(`src/i18n/translations/${locale}.json`, 'utf-8')
  );
  const localeKeys = getAllKeys(translations);
  
  // Missing keys
  const missing = [...baseKeys].filter(k => !localeKeys.has(k));
  if (missing.length > 0) {
    console.error(`\n❌ ${locale}: Missing ${missing.length} keys:`);
    missing.forEach(k => console.error(`   - ${k}`));
    hasErrors = true;
  }
  
  // Extra keys (might be stale)
  const extra = [...localeKeys].filter(k => !baseKeys.has(k));
  if (extra.length > 0) {
    console.warn(`\n⚠️ ${locale}: Extra ${extra.length} keys (possibly stale):`);
    extra.forEach(k => console.warn(`   - ${k}`));
  }
}

if (hasErrors) {
  process.exit(1);
} else {
  console.log('✅ All translations valid');
}
```

### Package.json Scripts

```json
{
  "scripts": {
    "i18n:types": "ts-node scripts/generate-i18n-types.ts",
    "i18n:validate": "ts-node scripts/validate-translations.ts",
    "i18n:check": "npm run i18n:types && npm run i18n:validate"
  }
}
```

## Best Practices

### 1. Key Naming Convention

```json
{
  "page.section.element": "value",
  "home.hero.title": "Welcome",
  "contact.form.submitButton": "Send Message",
  "common.buttons.submit": "Submit",
  "common.buttons.cancel": "Cancel"
}
```

### 2. Context in Keys

```json
{
  "button.submit": "Submit",
  "button.submitForm": "Submit Form",
  "button.submitOrder": "Place Order"
}
```

### 3. Avoid Concatenation

```json
{
  "greeting": "Hello, {name}! You have {count} messages."
}
```

NOT:
```json
{
  "greeting1": "Hello, ",
  "greeting2": "! You have ",
  "greeting3": " messages."
}
```

### 4. Complete Sentences

```json
{
  "noResults": "No results found for your search.",
  "tryAgain": "Please try different keywords."
}
```

### 5. Provide Context for Translators

```json
{
  "_comments": {
    "hero.cta": "Call-to-action button on homepage hero section",
    "nav.services": "Navigation menu item for services page"
  },
  "hero": {
    "cta": "Get Started Today"
  }
}
```

## Formatting Utilities

### Date Formatting

```typescript
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

// Short date
export function formatShortDate(date: Date, locale: Locale): string {
  return formatDate(date, locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Relative time (2 days ago)
export function formatRelativeTime(date: Date, locale: Locale): string {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const diff = date.getTime() - Date.now();
  const days = Math.round(diff / (1000 * 60 * 60 * 24));
  
  if (Math.abs(days) < 1) {
    const hours = Math.round(diff / (1000 * 60 * 60));
    return rtf.format(hours, 'hour');
  }
  
  return rtf.format(days, 'day');
}
```

### Currency Formatting

```typescript
const LOCALE_CURRENCIES: Record<Locale, string> = {
  en: 'GBP',
  hu: 'HUF',
  de: 'EUR',
};

export function formatPrice(
  amount: number,
  locale: Locale,
  currency?: string
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency ?? LOCALE_CURRENCIES[locale],
    maximumFractionDigits: locale === 'hu' ? 0 : 2,
  }).format(amount);
}

// Compact format (1.2K, 1.5M)
export function formatCompactNumber(
  num: number,
  locale: Locale
): string {
  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    compactDisplay: 'short',
  }).format(num);
}
```

### Phone Number Formatting

```typescript
const PHONE_FORMATS: Record<Locale, { pattern: RegExp; format: string }> = {
  en: {
    pattern: /(\d{4})(\d{3})(\d{4})/,
    format: '$1 $2 $3',
  },
  hu: {
    pattern: /(\d{2})(\d{3})(\d{4})/,
    format: '+36 $1 $2 $3',
  },
};

export function formatPhone(phone: string, locale: Locale): string {
  const digits = phone.replace(/\D/g, '');
  const format = PHONE_FORMATS[locale];
  return digits.replace(format.pattern, format.format);
}
```

## Translation Memory

For large projects, consider translation management systems:

1. **Crowdin** - Popular, Git integration
2. **Lokalise** - Developer-friendly
3. **Phrase** - Comprehensive features
4. **SimpleLocalize** - Simple and affordable
5. **Locize** - i18next ecosystem

### Git-based Workflow

```yaml
# .github/workflows/i18n.yml
name: i18n Check
on: [pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run i18n:check
```

## Common Hungarian Translations

```json
{
  "common": {
    "buttons": {
      "submit": "Beküldés",
      "cancel": "Mégse",
      "save": "Mentés",
      "delete": "Törlés",
      "edit": "Szerkesztés",
      "close": "Bezárás",
      "back": "Vissza",
      "next": "Tovább",
      "previous": "Előző",
      "search": "Keresés",
      "filter": "Szűrés",
      "loadMore": "Több betöltése",
      "readMore": "Tovább olvasom"
    },
    "form": {
      "required": "Kötelező mező",
      "optional": "Opcionális",
      "firstName": "Keresztnév",
      "lastName": "Vezetéknév",
      "email": "E-mail cím",
      "phone": "Telefonszám",
      "message": "Üzenet",
      "company": "Cégnév",
      "address": "Cím",
      "city": "Város",
      "postcode": "Irányítószám",
      "country": "Ország"
    },
    "validation": {
      "required": "Ez a mező kötelező",
      "email": "Érvénytelen e-mail cím",
      "phone": "Érvénytelen telefonszám",
      "minLength": "Minimum {min} karakter szükséges",
      "maxLength": "Maximum {max} karakter engedélyezett"
    },
    "messages": {
      "success": "Sikeres művelet",
      "error": "Hiba történt",
      "loading": "Betöltés...",
      "noResults": "Nincs találat",
      "confirmDelete": "Biztosan törölni szeretné?"
    },
    "dates": {
      "today": "Ma",
      "yesterday": "Tegnap",
      "tomorrow": "Holnap",
      "daysAgo": "{count} napja",
      "weeksAgo": "{count} hete"
    }
  }
}
```
