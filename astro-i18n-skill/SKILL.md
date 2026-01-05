---
name: astro-i18n
description: Comprehensive internationalization for Astro.js and Next.js. Handles hreflang, x-default, SEO-optimized routing, translation files, language switcher, and Cloudflare Pages deployment. Zero hardcoded strings, fully static, lightfast.
---

# Astro/Next.js i18n Skill

Complete i18n infrastructure. SEO-first, static-first, Cloudflare Pages compatible.

## Quick Start

1. Copy `assets/boilerplate/` to `src/i18n/`
2. Configure locales in `config.ts`
3. Add `<HreflangHead />` to base layout
4. Use `t(locale, 'key')` for all strings - ZERO hardcoded text

## Directory Structure

```
src/i18n/
├── config.ts              # Locales, default, siteUrl
├── routing.ts             # URL helpers
├── utils.ts               # t(), formatDate(), formatPrice()
├── translations/
│   ├── en.json
│   └── hu.json
└── components/
    ├── HreflangHead.astro
    ├── LanguageSwitcher.astro
    └── LocaleLink.astro
```

## Configuration

```typescript
// src/i18n/config.ts
export const i18nConfig = {
  defaultLocale: 'en' as const,
  locales: ['en', 'hu'] as const,
  localeStates: {             // Lifecycle management
    en: 'active',             // index + hreflang
    hu: 'active',
    // de: 'paused',          // noindex, no hreflang
    // sk: 'deprecated',      // 301 redirect
  },
  xDefaultLocale: 'en' as const,
  routing: 'prefix-except-default',
  siteUrl: 'https://example.com',
  localeLabels: { /* ... */ },
} as const;
```

## Features

- **Scroll preservation** - Position maintained on locale switch
- **Locale lifecycle** - active/paused/deprecated states
- **Namespace support** - Split translations for large projects
- **SEO lint CI** - Build-time validation script

## Hreflang Rules (SEO Critical)

1. **Self-referencing** - Every page links to itself
2. **Bidirectional** - If A→B, then B→A  
3. **x-default** - Always include
4. **Absolute URLs** - Full URLs with protocol
5. **Canonical alignment** - Must match one hreflang

```html
<link rel="canonical" href="https://example.com/about" />
<link rel="alternate" hreflang="en" href="https://example.com/about" />
<link rel="alternate" hreflang="hu" href="https://example.com/hu/about" />
<link rel="alternate" hreflang="x-default" href="https://example.com/about" />
```

## Usage

```astro
---
// Layout
import HreflangHead from '@/i18n/components/HreflangHead.astro';
import { getCurrentLocale, getPathWithoutLocale } from '@/i18n/routing';
const locale = getCurrentLocale(Astro.url);
---
<html lang={locale}>
<head><HreflangHead currentLocale={locale} currentPath={getPathWithoutLocale(Astro.url)} /></head>

---
// Page - use t() for ALL strings
import { t } from '@/i18n/utils';
---
<h1>{t(Astro.params.locale, 'hero.title', { company: 'Acme' })}</h1>
```

## Astro Config

```javascript
export default defineConfig({
  site: 'https://example.com',
  i18n: { defaultLocale: 'en', locales: ['en', 'hu'], routing: { prefixDefaultLocale: false } },
});
```

## Next.js → See [references/nextjs.md](references/nextjs.md)

## References

- **Hreflang**: [references/hreflang.md](references/hreflang.md) - SEO rules, x-default, common mistakes
- **Next.js**: [references/nextjs.md](references/nextjs.md) - App Router, static export
- **Translations**: [references/translations.md](references/translations.md) - Namespaces, validation, CI lint
- **Cloudflare**: [references/cloudflare.md](references/cloudflare.md) - Cache headers, Accept-Language

## Incomplete Translations & Indexing

```typescript
// Exclude incomplete locales from hreflang
<HreflangHead currentLocale={locale} currentPath={path} availableLocales={['en']} />
```

| Completeness | Action |
|--------------|--------|
| 100% | `index, follow` |
| <80% | `noindex` or redirect |
| Machine-translated | `noindex` |

## Forbidden Patterns

❌ Hardcoded strings · ❌ Missing `lang` on `<html>` · ❌ Hreflang without self-reference · ❌ Relative hreflang URLs · ❌ Emoji flags without text (a11y) · ❌ Missing translation shows key

## Build Validation

Run `npm run i18n:check` before deploy. **Build fails if:** missing keys, broken placeholders, canonical≠hreflang mismatch. See [references/translations.md](references/translations.md).

## Checklist

- [ ] `i18nConfig` with all locales
- [ ] Translation JSON per locale (validated)
- [ ] `<HreflangHead>` in layout
- [ ] `lang` on `<html>`
- [ ] x-default set
- [ ] Zero hardcoded strings
- [ ] Incomplete pages excluded from hreflang
- [ ] Build validation passes
