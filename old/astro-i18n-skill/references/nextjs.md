# Next.js i18n Reference

Complete internationalization patterns for Next.js App Router with static export.

## Static Export Constraint

Next.js `output: 'export'` is **NOT compatible** with built-in `i18n` config:

```javascript
// ✗ This will fail with static export
module.exports = {
  output: 'export',
  i18n: { locales: ['en', 'hu'], defaultLocale: 'en' } // Error!
};
```

**Solution**: Manual routing with `[locale]` dynamic segment.

## Project Structure

```
├── app/
│   ├── page.tsx                  # Root redirect
│   ├── not-found.tsx             # 404 with language detection
│   └── [locale]/
│       ├── layout.tsx            # Locale layout
│       ├── page.tsx              # Home
│       ├── about/
│       │   └── page.tsx
│       └── contact/
│           └── page.tsx
├── i18n/
│   ├── config.ts
│   ├── translations/
│   │   ├── en.json
│   │   └── hu.json
│   ├── utils.ts
│   └── routing.ts
├── components/
│   ├── HreflangHead.tsx
│   └── LanguageSwitcher.tsx
├── messages/                     # For next-intl
│   ├── en.json
│   └── hu.json
└── next.config.js
```

## next.config.js

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true, // Required for static export
  },
};

module.exports = nextConfig;
```

## Root Page Redirect

```typescript
// app/page.tsx
import { redirect } from 'next/navigation';
import { i18nConfig } from '@/i18n/config';

export default function RootPage() {
  redirect(`/${i18nConfig.defaultLocale}`);
}
```

## Locale Layout with Static Params

```typescript
// app/[locale]/layout.tsx
import { i18nConfig, type Locale } from '@/i18n/config';
import { HreflangHead } from '@/components/HreflangHead';

// Generate static paths for all locales
export function generateStaticParams() {
  return i18nConfig.locales.map((locale) => ({ locale }));
}

// Generate metadata per locale
export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ locale: string }> 
}) {
  const { locale } = await params;
  const messages = await import(`@/i18n/translations/${locale}.json`);
  
  return {
    title: messages.meta.title,
    description: messages.meta.description,
  };
}

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({ children, params }: LayoutProps) {
  const { locale } = await params;
  
  // Validate locale
  if (!i18nConfig.locales.includes(locale as Locale)) {
    notFound();
  }
  
  return (
    <html lang={locale}>
      <head>
        <HreflangHead locale={locale as Locale} />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
```

## Page with Translations

```typescript
// app/[locale]/page.tsx
import { i18nConfig, type Locale } from '@/i18n/config';
import { t } from '@/i18n/utils';

export function generateStaticParams() {
  return i18nConfig.locales.map((locale) => ({ locale }));
}

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params as { locale: Locale };
  
  return (
    <main>
      <h1>{t(locale, 'hero.title', { company: 'Acme' })}</h1>
      <p>{t(locale, 'hero.description')}</p>
      <a href={`/${locale}/contact`}>
        {t(locale, 'hero.cta')}
      </a>
    </main>
  );
}
```

## Nested Routes

```typescript
// app/[locale]/about/page.tsx
import { i18nConfig, type Locale } from '@/i18n/config';
import { t } from '@/i18n/utils';

export function generateStaticParams() {
  return i18nConfig.locales.map((locale) => ({ locale }));
}

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function AboutPage({ params }: PageProps) {
  const { locale } = await params as { locale: Locale };
  
  return (
    <main>
      <h1>{t(locale, 'about.title')}</h1>
      <p>{t(locale, 'about.content')}</p>
    </main>
  );
}
```

## HreflangHead Component

```typescript
// components/HreflangHead.tsx
import { i18nConfig, type Locale } from '@/i18n/config';
import { getAbsoluteLocaleUrl } from '@/i18n/routing';

interface HreflangHeadProps {
  locale: Locale;
  path?: string;
}

export function HreflangHead({ locale, path = '' }: HreflangHeadProps) {
  const canonicalUrl = getAbsoluteLocaleUrl(locale, path);
  
  return (
    <>
      <link rel="canonical" href={canonicalUrl} />
      {i18nConfig.locales.map((loc) => (
        <link
          key={loc}
          rel="alternate"
          hreflang={loc}
          href={getAbsoluteLocaleUrl(loc as Locale, path)}
        />
      ))}
      <link
        rel="alternate"
        hreflang="x-default"
        href={getAbsoluteLocaleUrl(i18nConfig.xDefaultLocale, path)}
      />
    </>
  );
}
```

## Language Switcher (Client Component)

```typescript
// components/LanguageSwitcher.tsx
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { i18nConfig, type Locale } from '@/i18n/config';

export function LanguageSwitcher() {
  const pathname = usePathname();
  
  // Extract current locale and path
  const segments = pathname.split('/').filter(Boolean);
  const currentLocale = i18nConfig.locales.includes(segments[0] as Locale)
    ? segments[0]
    : i18nConfig.defaultLocale;
  const pathWithoutLocale = '/' + segments.slice(1).join('/');
  
  return (
    <nav aria-label="Language switcher">
      <ul className="flex gap-2">
        {i18nConfig.locales.map((locale) => {
          const newPath = `/${locale}${pathWithoutLocale}`;
          const isActive = locale === currentLocale;
          
          return (
            <li key={locale}>
              <Link
                href={newPath}
                className={isActive ? 'font-bold' : ''}
                aria-current={isActive ? 'page' : undefined}
                hrefLang={locale}
              >
                {i18nConfig.localeLabels[locale as Locale].flag}{' '}
                {i18nConfig.localeLabels[locale as Locale].nativeName}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
```

## Using next-intl (Alternative)

For projects using `next-intl`:

### Installation

```bash
npm install next-intl
```

### Configuration

```typescript
// i18n/request.ts
import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ locale }) => ({
  messages: (await import(`../messages/${locale}.json`)).default,
}));
```

### next.config.js with next-intl

```javascript
const createNextIntlPlugin = require('next-intl/plugin');
const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Note: Cannot use output: 'export' with middleware
};

module.exports = withNextIntl(nextConfig);
```

### Usage

```typescript
// app/[locale]/page.tsx
import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';

export default function HomePage({ params: { locale } }) {
  setRequestLocale(locale); // For static rendering
  const t = useTranslations('HomePage');
  
  return <h1>{t('title')}</h1>;
}
```

## 404 Page with Language Detection

```typescript
// app/not-found.tsx
import Link from 'next/link';
import { i18nConfig } from '@/i18n/config';

export default function NotFound() {
  return (
    <html>
      <body>
        <h1>Page Not Found</h1>
        <p>The requested page could not be found.</p>
        <div>
          {i18nConfig.locales.map((locale) => (
            <Link key={locale} href={`/${locale}`}>
              {i18nConfig.localeLabels[locale].nativeName}
            </Link>
          ))}
        </div>
      </body>
    </html>
  );
}
```

## Dynamic Content Routes

```typescript
// app/[locale]/blog/[slug]/page.tsx
import { i18nConfig } from '@/i18n/config';

// Generate all locale + slug combinations
export async function generateStaticParams() {
  const posts = await getPosts(); // Your data fetching
  
  const paths = [];
  
  for (const locale of i18nConfig.locales) {
    for (const post of posts) {
      // Only generate if translation exists
      if (post.translations[locale]) {
        paths.push({
          locale,
          slug: post.translations[locale].slug,
        });
      }
    }
  }
  
  return paths;
}

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export default async function BlogPost({ params }: PageProps) {
  const { locale, slug } = await params;
  const post = await getPostBySlug(slug, locale);
  
  return (
    <article>
      <h1>{post.title}</h1>
      <div>{post.content}</div>
    </article>
  );
}
```

## Metadata Generation

```typescript
// app/[locale]/layout.tsx
import type { Metadata } from 'next';
import { i18nConfig } from '@/i18n/config';

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ locale: string }> 
}): Promise<Metadata> {
  const { locale } = await params;
  const messages = await import(`@/i18n/translations/${locale}.json`);
  
  return {
    title: {
      default: messages.meta.title,
      template: `%s | ${messages.meta.title}`,
    },
    description: messages.meta.description,
    alternates: {
      canonical: `${i18nConfig.siteUrl}/${locale}`,
      languages: Object.fromEntries(
        i18nConfig.locales.map((loc) => [
          loc,
          `${i18nConfig.siteUrl}/${loc}`,
        ])
      ),
    },
    openGraph: {
      locale: locale,
      alternateLocales: i18nConfig.locales.filter((l) => l !== locale),
    },
  };
}
```

## Build Output

Static export generates:

```
out/
├── en/
│   ├── index.html
│   ├── about/
│   │   └── index.html
│   └── contact/
│       └── index.html
├── hu/
│   ├── index.html
│   ├── about/
│   │   └── index.html
│   └── contact/
│       └── index.html
├── index.html           # Redirect to default locale
└── 404.html
```

## Cloudflare Pages Deployment

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: your-project
          directory: out
```

## Performance Tips

1. **Lazy load translations**: Import only needed locale
2. **Cache translations**: Use React cache for server components
3. **Minimal client JS**: Keep language switcher lightweight
4. **Static generation**: Use `generateStaticParams` everywhere
5. **Image optimization**: Use `next/image` with `unoptimized: true`
