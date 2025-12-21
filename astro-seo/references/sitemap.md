# Sitemap & robots.txt

## Sitemap Setup

Use `@astrojs/sitemap` integration:

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://example.com',
  integrations: [
    sitemap({
      // Multi-language support
      i18n: {
        defaultLocale: 'en',
        locales: {
          en: 'en-GB',
          hu: 'hu-HU',
        },
      },
      // Exclude pages
      filter: (page) => 
        !page.includes('/thank-you') &&
        !page.includes('/admin'),
      // Custom serialization
      serialize: (item) => ({
        ...item,
        changefreq: 'weekly',
        priority: item.url === 'https://example.com/' ? 1.0 : 0.7,
      }),
    }),
  ],
});
```

## Generated Output

The integration creates:
- `/sitemap-index.xml` — Index file
- `/sitemap-0.xml` — Actual URLs

## Custom Priority

```javascript
serialize: (item) => {
  // Homepage
  if (item.url === 'https://example.com/') {
    return { ...item, priority: 1.0, changefreq: 'weekly' };
  }
  // Service pages
  if (item.url.includes('/services')) {
    return { ...item, priority: 0.9, changefreq: 'monthly' };
  }
  // Default
  return { ...item, priority: 0.7, changefreq: 'monthly' };
}
```

## robots.txt

Create as dynamic route:

```typescript
// src/pages/robots.txt.ts
import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const sitemapURL = new URL('/sitemap-index.xml', site);
  
  const robotsTxt = `
User-agent: *
Allow: /

# Block admin and thank you pages
Disallow: /admin/
Disallow: /thank-you

# Block query parameters
Disallow: /*?*

# Sitemap
Sitemap: ${sitemapURL.href}
`.trim();

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};
```

## Staging/Dev Block

For non-production environments:

```typescript
// src/pages/robots.txt.ts
import type { APIRoute } from 'astro';

const isProduction = import.meta.env.PROD;

export const GET: APIRoute = ({ site }) => {
  // Block everything on staging/dev
  if (!isProduction) {
    return new Response('User-agent: *\nDisallow: /', {
      headers: { 'Content-Type': 'text/plain' },
    });
  }
  
  // Production robots.txt
  const robotsTxt = `
User-agent: *
Allow: /
Sitemap: ${new URL('/sitemap-index.xml', site).href}
`.trim();

  return new Response(robotsTxt, {
    headers: { 'Content-Type': 'text/plain' },
  });
};
```

## Cloudflare Headers

Add to `public/_headers`:

```
/sitemap-index.xml
  Content-Type: application/xml

/sitemap-*.xml
  Content-Type: application/xml

/robots.txt
  Content-Type: text/plain
```

## Sitemap Checklist

- [ ] All public pages included
- [ ] Thank you pages excluded
- [ ] Admin pages excluded
- [ ] Query string URLs excluded
- [ ] Correct absolute URLs
- [ ] Priority set appropriately
- [ ] Validates at xml-sitemaps.com
- [ ] Submitted to Google Search Console
