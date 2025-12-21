---
name: astro-i18n
description: Internationalization patterns for Astro sites. Multi-language routing, content translation, locale switching, RTL support. Use for multi-market lead generation.
---

# Astro i18n Skill

## Purpose

Provides internationalization patterns for lead generation sites targeting multiple markets/languages.

## Core Rules

1. **URL structure first** — `/en/`, `/de/`, `/fr/` prefixes for SEO
2. **Fallback gracefully** — Missing translations → default language
3. **RTL support** — Arabic, Hebrew layouts when needed
4. **hreflang tags** — Proper language alternates for SEO
5. **Persist preference** — Remember user's language choice

## Directory Structure

```
src/
├── i18n/
│   ├── config.ts          # Language configuration
│   ├── utils.ts            # Helper functions
│   └── translations/
│       ├── en.json
│       ├── de.json
│       └── fr.json
├── pages/
│   ├── [lang]/
│   │   ├── index.astro
│   │   ├── about.astro
│   │   └── contact.astro
│   └── index.astro         # Redirects to default lang
└── content/
    └── blog/
        ├── en/
        │   └── post-1.md
        └── de/
            └── post-1.md
```

## Language Configuration

```typescript
// src/i18n/config.ts
export const languages = {
  en: { name: 'English', code: 'en-GB', dir: 'ltr' },
  de: { name: 'Deutsch', code: 'de-DE', dir: 'ltr' },
  fr: { name: 'Français', code: 'fr-FR', dir: 'ltr' },
} as const;

export const defaultLang = 'en';

export type Lang = keyof typeof languages;

export function isValidLang(lang: string): lang is Lang {
  return lang in languages;
}
```

## Translation Files

```json
// src/i18n/translations/en.json
{
  "nav": {
    "home": "Home",
    "about": "About",
    "services": "Services",
    "contact": "Contact"
  },
  "hero": {
    "title": "Professional Moving Services",
    "subtitle": "Trusted by thousands of families",
    "cta": "Get Free Quote"
  },
  "form": {
    "name": "Your Name",
    "email": "Email Address",
    "phone": "Phone Number",
    "message": "Message",
    "submit": "Send Message",
    "required": "This field is required",
    "invalidEmail": "Please enter a valid email"
  },
  "footer": {
    "copyright": "© {year} {company}. All rights reserved.",
    "privacy": "Privacy Policy",
    "terms": "Terms of Service"
  }
}
```

```json
// src/i18n/translations/de.json
{
  "nav": {
    "home": "Startseite",
    "about": "Über uns",
    "services": "Leistungen",
    "contact": "Kontakt"
  },
  "hero": {
    "title": "Professionelle Umzugsservices",
    "subtitle": "Von Tausenden Familien vertraut",
    "cta": "Kostenloses Angebot"
  },
  "form": {
    "name": "Ihr Name",
    "email": "E-Mail-Adresse",
    "phone": "Telefonnummer",
    "message": "Nachricht",
    "submit": "Nachricht senden",
    "required": "Dieses Feld ist erforderlich",
    "invalidEmail": "Bitte geben Sie eine gültige E-Mail ein"
  },
  "footer": {
    "copyright": "© {year} {company}. Alle Rechte vorbehalten.",
    "privacy": "Datenschutz",
    "terms": "AGB"
  }
}
```

## Translation Utilities

```typescript
// src/i18n/utils.ts
import { defaultLang, type Lang, isValidLang } from './config';
import en from './translations/en.json';
import de from './translations/de.json';
import fr from './translations/fr.json';

const translations = { en, de, fr } as const;

type TranslationKey = string;

export function t(
  lang: Lang,
  key: TranslationKey,
  params?: Record<string, string | number>
): string {
  const keys = key.split('.');
  let value: any = translations[lang];

  for (const k of keys) {
    value = value?.[k];
  }

  // Fallback to default language
  if (value === undefined) {
    value = translations[defaultLang];
    for (const k of keys) {
      value = value?.[k];
    }
  }

  // Still undefined? Return key
  if (value === undefined) {
    console.warn(`Missing translation: ${key}`);
    return key;
  }

  // Replace parameters
  if (params && typeof value === 'string') {
    return value.replace(/\{(\w+)\}/g, (_, key) =>
      String(params[key] ?? `{${key}}`)
    );
  }

  return value;
}

export function getLangFromUrl(url: URL): Lang {
  const [, lang] = url.pathname.split('/');
  if (isValidLang(lang)) return lang;
  return defaultLang;
}

export function getLocalizedUrl(url: URL, lang: Lang): string {
  const [, currentLang, ...rest] = url.pathname.split('/');
  if (isValidLang(currentLang)) {
    return `/${lang}/${rest.join('/')}`;
  }
  return `/${lang}${url.pathname}`;
}
```

## Base Layout with i18n

```astro
---
import { languages, defaultLang, type Lang } from '@/i18n/config';
import { getLangFromUrl, t } from '@/i18n/utils';

interface Props {
  title: string;
  description: string;
}

const { title, description } = Astro.props;
const lang = getLangFromUrl(Astro.url);
const langConfig = languages[lang];

// Build hreflang alternates
const alternates = Object.entries(languages).map(([code, config]) => ({
  hreflang: config.code,
  href: new URL(
    Astro.url.pathname.replace(`/${lang}/`, `/${code}/`),
    Astro.site
  ).href,
}));
---

<!doctype html>
<html lang={langConfig.code} dir={langConfig.dir}>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{title}</title>
    <meta name="description" content={description} />

    <!-- hreflang tags for SEO -->
    {alternates.map(({ hreflang, href }) => (
      <link rel="alternate" hreflang={hreflang} href={href} />
    ))}
    <link
      rel="alternate"
      hreflang="x-default"
      href={new URL(`/${defaultLang}/`, Astro.site).href}
    />
  </head>
  <body>
    <slot />
  </body>
</html>
```

## Language Switcher Component

```astro
---
import { languages, type Lang } from '@/i18n/config';
import { getLangFromUrl, getLocalizedUrl } from '@/i18n/utils';

const currentLang = getLangFromUrl(Astro.url);
---

<div class="language-switcher">
  <button
    type="button"
    class="lang-trigger"
    aria-expanded="false"
    aria-haspopup="listbox"
  >
    <span class="current-lang">{languages[currentLang].name}</span>
    <svg class="icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
    </svg>
  </button>

  <ul class="lang-menu" role="listbox" hidden>
    {Object.entries(languages).map(([code, config]) => (
      <li role="option" aria-selected={code === currentLang}>
        <a
          href={getLocalizedUrl(Astro.url, code as Lang)}
          class:list={['lang-option', { active: code === currentLang }]}
          hreflang={config.code}
        >
          {config.name}
        </a>
      </li>
    ))}
  </ul>
</div>

<style>
  .language-switcher {
    position: relative;
  }

  .lang-trigger {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.5rem 0.75rem;
    background: transparent;
    border: 1px solid #e5e7eb;
    border-radius: 0.375rem;
    cursor: pointer;
  }

  .icon {
    width: 1rem;
    height: 1rem;
  }

  .lang-menu {
    position: absolute;
    top: 100%;
    right: 0;
    min-width: 10rem;
    margin-top: 0.25rem;
    padding: 0.25rem;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.375rem;
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
    list-style: none;
  }

  .lang-menu[hidden] {
    display: none;
  }

  .lang-option {
    display: block;
    padding: 0.5rem 0.75rem;
    text-decoration: none;
    color: inherit;
    border-radius: 0.25rem;
  }

  .lang-option:hover {
    background: #f3f4f6;
  }

  .lang-option.active {
    background: #eff6ff;
    color: #1d4ed8;
  }
</style>

<script>
  function initLanguageSwitcher() {
    const switcher = document.querySelector('.language-switcher');
    if (!switcher) return;

    const trigger = switcher.querySelector('.lang-trigger');
    const menu = switcher.querySelector('.lang-menu');

    trigger?.addEventListener('click', () => {
      const expanded = trigger.getAttribute('aria-expanded') === 'true';
      trigger.setAttribute('aria-expanded', String(!expanded));
      menu?.toggleAttribute('hidden');
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!switcher.contains(e.target as Node)) {
        trigger?.setAttribute('aria-expanded', 'false');
        menu?.setAttribute('hidden', '');
      }
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        trigger?.setAttribute('aria-expanded', 'false');
        menu?.setAttribute('hidden', '');
      }
    });
  }

  initLanguageSwitcher();
  document.addEventListener('astro:page-load', initLanguageSwitcher);
</script>
```

## Dynamic Route Setup

```astro
---
// src/pages/[lang]/index.astro
import { languages, type Lang } from '@/i18n/config';
import { t } from '@/i18n/utils';
import BaseLayout from '@/layouts/BaseLayout.astro';

export function getStaticPaths() {
  return Object.keys(languages).map((lang) => ({
    params: { lang },
  }));
}

const { lang } = Astro.params as { lang: Lang };
---

<BaseLayout
  title={t(lang, 'hero.title')}
  description={t(lang, 'hero.subtitle')}
>
  <h1>{t(lang, 'hero.title')}</h1>
  <p>{t(lang, 'hero.subtitle')}</p>
  <a href={`/${lang}/contact`}>{t(lang, 'hero.cta')}</a>
</BaseLayout>
```

## Root Redirect

```astro
---
// src/pages/index.astro
import { defaultLang } from '@/i18n/config';

// Redirect to default language
return Astro.redirect(`/${defaultLang}/`);
---
```

## Browser Language Detection

```typescript
// src/middleware.ts
import { defineMiddleware } from 'astro:middleware';
import { languages, defaultLang, isValidLang } from './i18n/config';

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  // Skip if already has language prefix
  const [, firstSegment] = pathname.split('/');
  if (isValidLang(firstSegment)) {
    return next();
  }

  // Skip for assets
  if (pathname.match(/\.(js|css|png|jpg|svg|ico)$/)) {
    return next();
  }

  // Get preferred language from Accept-Language header
  const acceptLanguage = context.request.headers.get('accept-language');
  let preferredLang = defaultLang;

  if (acceptLanguage) {
    const browserLangs = acceptLanguage
      .split(',')
      .map((lang) => lang.split(';')[0].trim().substring(0, 2));

    for (const lang of browserLangs) {
      if (isValidLang(lang)) {
        preferredLang = lang;
        break;
      }
    }
  }

  // Redirect to preferred language
  return context.redirect(`/${preferredLang}${pathname}`);
});
```

## Translated Content Collections

```typescript
// src/content/config.ts
import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    lang: z.enum(['en', 'de', 'fr']),
    translationOf: z.string().optional(), // Slug of original post
  }),
});

export const collections = { blog };
```

```astro
---
// src/pages/[lang]/blog/[...slug].astro
import { getCollection } from 'astro:content';
import { languages, type Lang } from '@/i18n/config';

export async function getStaticPaths() {
  const posts = await getCollection('blog');
  const paths = [];

  for (const lang of Object.keys(languages)) {
    const langPosts = posts.filter((p) => p.data.lang === lang);
    for (const post of langPosts) {
      paths.push({
        params: { lang, slug: post.slug.replace(`${lang}/`, '') },
        props: { post },
      });
    }
  }

  return paths;
}

const { lang } = Astro.params as { lang: Lang };
const { post } = Astro.props;
---
```

## RTL Support

```css
/* Global RTL styles */
[dir='rtl'] {
  text-align: right;
}

[dir='rtl'] .flex-row {
  flex-direction: row-reverse;
}

[dir='rtl'] .ml-4 {
  margin-left: 0;
  margin-right: 1rem;
}

[dir='rtl'] .mr-4 {
  margin-right: 0;
  margin-left: 1rem;
}

/* Flip icons */
[dir='rtl'] .icon-arrow {
  transform: scaleX(-1);
}
```

## Number and Date Formatting

```typescript
// src/i18n/formatters.ts
import type { Lang } from './config';
import { languages } from './config';

export function formatNumber(lang: Lang, value: number): string {
  return new Intl.NumberFormat(languages[lang].code).format(value);
}

export function formatCurrency(
  lang: Lang,
  value: number,
  currency = 'GBP'
): string {
  return new Intl.NumberFormat(languages[lang].code, {
    style: 'currency',
    currency,
  }).format(value);
}

export function formatDate(lang: Lang, date: Date): string {
  return new Intl.DateTimeFormat(languages[lang].code, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function formatRelativeTime(lang: Lang, date: Date): string {
  const rtf = new Intl.RelativeTimeFormat(languages[lang].code, {
    numeric: 'auto',
  });

  const diff = date.getTime() - Date.now();
  const days = Math.round(diff / (1000 * 60 * 60 * 24));

  if (Math.abs(days) < 1) {
    const hours = Math.round(diff / (1000 * 60 * 60));
    return rtf.format(hours, 'hour');
  }
  if (Math.abs(days) < 30) {
    return rtf.format(days, 'day');
  }
  const months = Math.round(days / 30);
  return rtf.format(months, 'month');
}
```

## SEO for Multi-Language

```astro
---
// Language-specific meta tags
const { lang, title, description } = Astro.props;
const langConfig = languages[lang];
---

<head>
  <html lang={langConfig.code}>
  <meta property="og:locale" content={langConfig.code.replace('-', '_')} />

  {Object.entries(languages)
    .filter(([code]) => code !== lang)
    .map(([code, config]) => (
      <meta
        property="og:locale:alternate"
        content={config.code.replace('-', '_')}
      />
    ))}
</head>
```

## Forbidden

- ❌ Hardcoded text in components
- ❌ Missing hreflang tags
- ❌ Auto-translating without review
- ❌ Different URLs for same content without hreflang
- ❌ Ignoring RTL requirements
- ❌ Locale in query params instead of path

## Definition of Done

- [ ] Language config with supported locales
- [ ] Translation JSON files for each language
- [ ] `t()` function with fallback
- [ ] URL-based language routing (`/en/`, `/de/`)
- [ ] hreflang tags on all pages
- [ ] Language switcher component
- [ ] Browser language detection (optional)
- [ ] RTL support if needed
- [ ] Date/number formatting per locale
- [ ] Content collections with translations
