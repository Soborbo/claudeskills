# Routing & URL Structure

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

## Browser Language Detection (Middleware)

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

## URL Patterns

All pages follow this structure:

- `/en/` - English homepage
- `/en/about` - English about page
- `/en/contact` - English contact page
- `/de/` - German homepage
- `/de/uber-uns` - German about page (translated slug)
- `/fr/` - French homepage

**Important:** Use `getStaticPaths()` to generate all language variants at build time.
