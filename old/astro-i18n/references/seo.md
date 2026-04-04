# SEO for Multi-Language Sites

## hreflang Tags (Critical)

```astro
---
import { languages, defaultLang } from '@/i18n/config';

const lang = getLangFromUrl(Astro.url);

// Build hreflang alternates
const alternates = Object.entries(languages).map(([code, config]) => ({
  hreflang: config.code,
  href: new URL(
    Astro.url.pathname.replace(`/${lang}/`, `/${code}/`),
    Astro.site
  ).href,
}));
---

<head>
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
```

## Open Graph Locale Tags

```astro
---
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

## Canonical URLs

```astro
<link
  rel="canonical"
  href={new URL(Astro.url.pathname, Astro.site).href}
/>
```

## Sitemap Generation

```typescript
// astro.config.mjs
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://example.com',
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'de', 'fr'],
    routing: {
      prefixDefaultLocale: true,
    },
  },
  integrations: [
    sitemap({
      i18n: {
        defaultLocale: 'en',
        locales: {
          en: 'en-GB',
          de: 'de-DE',
          fr: 'fr-FR',
        },
      },
    }),
  ],
});
```

## robots.txt

```
# public/robots.txt
User-agent: *
Allow: /

Sitemap: https://example.com/sitemap-index.xml
```

## Meta Description per Language

Always translate meta descriptions:

```astro
---
const descriptions = {
  en: 'Professional moving services across the UK',
  de: 'Professionelle Umzugsservices in ganz Deutschland',
  fr: 'Services de déménagement professionnels en France',
};
---

<meta name="description" content={descriptions[lang]} />
```
