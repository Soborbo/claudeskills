# Language Configuration

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

## Language Config

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
