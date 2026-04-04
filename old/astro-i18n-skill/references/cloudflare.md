# Cloudflare Pages Deployment Reference

Optimized deployment for multilingual static sites on Cloudflare Pages.

## Locale-Aware Cache Headers

Different cache strategies per locale:

```
# /public/_headers

# Default locale - longest cache (most traffic)
/assets/*
  Cache-Control: public, max-age=31536000, immutable

# Secondary locales - shorter cache for faster updates
/hu/*
  Cache-Control: public, max-age=86400, stale-while-revalidate=604800

/de/*
  Cache-Control: public, max-age=86400, stale-while-revalidate=604800

# HTML pages - short cache with revalidation
/*.html
  Cache-Control: public, max-age=3600, stale-while-revalidate=86400

# Translation JSON (if loaded dynamically)
/i18n/*.json
  Cache-Control: public, max-age=3600
```

## Accept-Language Detection (SEO-Safe)

**Critical:** Never auto-redirect based on Accept-Language. Use suggestion instead.

```javascript
// functions/_middleware.js
export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);
  
  // Skip if already has locale prefix
  const supportedLocales = ['en', 'hu', 'de'];
  const pathSegments = url.pathname.split('/').filter(Boolean);
  const pathLocale = pathSegments[0];
  
  if (supportedLocales.includes(pathLocale)) {
    return next();
  }
  
  // Skip for assets
  if (url.pathname.startsWith('/_') || url.pathname.includes('.')) {
    return next();
  }
  
  // Only act on root path - SUGGEST, don't redirect
  if (url.pathname === '/') {
    const response = await next();
    
    // Check for user preference cookie first
    const cookies = request.headers.get('Cookie') || '';
    const cookieLocale = getCookieValue(cookies, 'preferred_locale');
    
    if (cookieLocale && supportedLocales.includes(cookieLocale)) {
      // User has explicit preference - redirect
      return Response.redirect(`${url.origin}/${cookieLocale}/`, 302);
    }
    
    // Detect browser language
    const acceptLanguage = request.headers.get('Accept-Language') || '';
    const suggestedLocale = detectLocale(acceptLanguage, supportedLocales);
    
    // Add suggestion header (frontend can show banner)
    const modifiedResponse = new Response(response.body, response);
    if (suggestedLocale && suggestedLocale !== 'en') {
      modifiedResponse.headers.set('X-Suggested-Locale', suggestedLocale);
    }
    
    return modifiedResponse;
  }
  
  return next();
}

function detectLocale(acceptLanguage, supported) {
  const languages = acceptLanguage
    .split(',')
    .map(lang => {
      const [code, q = 'q=1'] = lang.trim().split(';');
      return { 
        code: code.split('-')[0].toLowerCase(), 
        q: parseFloat(q.split('=')[1]) 
      };
    })
    .sort((a, b) => b.q - a.q);
  
  for (const { code } of languages) {
    if (supported.includes(code)) return code;
  }
  return null;
}

function getCookieValue(cookies, name) {
  const match = cookies.match(new RegExp(`${name}=([^;]+)`));
  return match ? match[1] : null;
}
```

## Language Suggestion Banner (Non-Intrusive)

```astro
---
// components/LocaleSuggestionBanner.astro
import { i18nConfig, type Locale } from '@/i18n/config';
import { t } from '@/i18n/utils';

interface Props {
  currentLocale: Locale;
}

const { currentLocale } = Astro.props;
---

<div 
  id="locale-suggestion" 
  class="hidden fixed bottom-4 right-4 bg-white shadow-lg rounded-lg p-4 max-w-sm z-50"
  role="dialog"
  aria-labelledby="locale-suggestion-title"
>
  <p id="locale-suggestion-title" class="font-medium mb-2">
    <!-- Filled by JS based on suggested locale -->
  </p>
  <div class="flex gap-2">
    <a 
      id="locale-suggestion-link" 
      href="#" 
      class="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
    >
      Switch
    </a>
    <button 
      id="locale-suggestion-dismiss" 
      class="px-4 py-2 text-gray-600 hover:text-gray-800"
    >
      Stay here
    </button>
  </div>
</div>

<script>
  const banner = document.getElementById('locale-suggestion');
  const title = document.getElementById('locale-suggestion-title');
  const link = document.getElementById('locale-suggestion-link');
  const dismiss = document.getElementById('locale-suggestion-dismiss');
  
  // Check for suggestion header (set by Worker)
  const suggestedLocale = document.querySelector('meta[name="x-suggested-locale"]')?.content;
  
  // Or check localStorage for dismissed state
  const dismissed = localStorage.getItem('locale_suggestion_dismissed');
  
  if (suggestedLocale && !dismissed && suggestedLocale !== document.documentElement.lang) {
    const localeNames = { hu: 'Magyar', de: 'Deutsch', en: 'English' };
    title.textContent = `This site is also available in ${localeNames[suggestedLocale]}`;
    link.href = `/${suggestedLocale}/`;
    banner?.classList.remove('hidden');
  }
  
  dismiss?.addEventListener('click', () => {
    localStorage.setItem('locale_suggestion_dismissed', 'true');
    banner?.classList.add('hidden');
  });
  
  link?.addEventListener('click', () => {
    // Set cookie so Worker knows preference
    document.cookie = `preferred_locale=${suggestedLocale};path=/;max-age=31536000`;
  });
</script>
```

## Why NOT Auto-Redirect?

Auto-redirecting based on Accept-Language breaks SEO:

1. **Googlebot crawls from US** - would always see EN version
2. **Hreflang becomes useless** - Google can't discover alternate versions
3. **Caching issues** - CDN serves wrong language
4. **User frustration** - VPN users, travelers, multilingual users

**Correct approach:**
- Default to URL-based locale
- SUGGEST alternative via banner
- Let USER choose (saves to cookie)
- Respect explicit URL always

## Why Cloudflare Pages?

- **Global edge network** - Fast delivery worldwide
- **Free SSL** - Automatic HTTPS
- **No cold starts** - Static assets, instant response
- **Free tier generous** - Unlimited sites, 500 builds/month
- **Git integration** - Auto deploy on push
- **Preview deployments** - Every PR gets a URL

## Project Setup

### Directory Output

```
# Astro
dist/
├── index.html        # Default locale home
├── about/
│   └── index.html
├── hu/
│   ├── index.html
│   └── about/
│       └── index.html
└── _astro/           # Assets

# Next.js (static export)
out/
├── en/
│   ├── index.html
│   └── about/
│       └── index.html
├── hu/
│   ├── index.html
│   └── about/
│       └── index.html
└── _next/            # Assets
```

### Build Commands

**Astro:**
```bash
npm run build
# Output: dist/
```

**Next.js:**
```bash
npm run build
# Output: out/
```

## Cloudflare Pages Configuration

### Via Dashboard

1. Connect GitHub/GitLab repository
2. Set build settings:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist` (Astro) or `out` (Next.js)
   - **Root directory**: `/` (or monorepo path)
3. Add environment variables if needed

### Via wrangler.toml

```toml
name = "my-i18n-site"
compatibility_date = "2024-01-01"

[site]
bucket = "./dist"  # or "./out" for Next.js
```

## Custom Domain Setup

1. Go to Pages project → Custom domains
2. Add domain (e.g., `example.com`)
3. Add DNS records as instructed
4. Wait for SSL provisioning (~15 min)

### Subdomain per Language (Optional)

For domain-based routing:

```
example.com     → English (default)
hu.example.com  → Hungarian
de.example.com  → German
```

Requires separate deployments or Cloudflare Workers for routing.

## Redirects

### _redirects File

```
# /public/_redirects (Astro) or root (Next.js)

# Redirect root to default locale (if using prefix-all)
/  /en/  302

# Language detection redirect (browser preference)
# Note: Cloudflare Pages doesn't support Accept-Language natively
# Use Workers for this

# Old URL redirects
/old-page  /en/new-page  301
/hu/regi-oldal  /hu/uj-oldal  301
```

### _headers File

```
# /public/_headers

# Cache static assets
/assets/*
  Cache-Control: public, max-age=31536000, immutable

/_astro/*
  Cache-Control: public, max-age=31536000, immutable

# Security headers
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()

# CORS for fonts (if needed)
/fonts/*
  Access-Control-Allow-Origin: *
```

## Language Detection with Workers

For browser language detection, use Cloudflare Workers:

```javascript
// functions/_middleware.js (Pages Functions)
export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);
  
  // Skip if already has locale prefix
  const supportedLocales = ['en', 'hu', 'de'];
  const pathLocale = url.pathname.split('/')[1];
  
  if (supportedLocales.includes(pathLocale)) {
    return next();
  }
  
  // Skip for assets
  if (url.pathname.startsWith('/_') || url.pathname.includes('.')) {
    return next();
  }
  
  // Detect language from Accept-Language header
  const acceptLanguage = request.headers.get('Accept-Language') || '';
  const preferredLocale = detectLocale(acceptLanguage, supportedLocales);
  
  // Check for language cookie (user preference)
  const cookies = request.headers.get('Cookie') || '';
  const cookieLocale = getCookieValue(cookies, 'locale');
  
  const targetLocale = cookieLocale || preferredLocale || 'en';
  
  // Only redirect root path
  if (url.pathname === '/') {
    return Response.redirect(`${url.origin}/${targetLocale}/`, 302);
  }
  
  return next();
}

function detectLocale(acceptLanguage, supported) {
  const languages = acceptLanguage
    .split(',')
    .map(lang => {
      const [code, q = 'q=1'] = lang.trim().split(';');
      return { code: code.split('-')[0], q: parseFloat(q.split('=')[1]) };
    })
    .sort((a, b) => b.q - a.q);
  
  for (const { code } of languages) {
    if (supported.includes(code)) {
      return code;
    }
  }
  
  return null;
}

function getCookieValue(cookies, name) {
  const match = cookies.match(new RegExp(`${name}=([^;]+)`));
  return match ? match[1] : null;
}
```

## Performance Optimization

### Asset Caching

```javascript
// astro.config.mjs
export default defineConfig({
  build: {
    assets: '_astro', // Hashed filenames for cache busting
  },
  vite: {
    build: {
      rollupOptions: {
        output: {
          assetFileNames: '_astro/[hash][extname]',
          chunkFileNames: '_astro/[hash].js',
          entryFileNames: '_astro/[hash].js',
        },
      },
    },
  },
});
```

### Preload Critical Assets

```html
<!-- In layout -->
<link rel="preload" href="/_astro/main.abc123.css" as="style" />
<link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossorigin />
```

### Image Optimization

Since Cloudflare Pages doesn't have built-in image optimization:

1. **Pre-optimize images** at build time
2. **Use Cloudflare Images** (paid) for dynamic optimization
3. **Use srcset** for responsive images

```astro
---
import { Picture } from 'astro:assets';
import heroImage from '../assets/hero.jpg';
---

<Picture
  src={heroImage}
  formats={['avif', 'webp']}
  widths={[400, 800, 1200]}
  sizes="(max-width: 800px) 100vw, 800px"
  alt={t(locale, 'hero.imageAlt')}
/>
```

## Environment Variables

### Build-time Variables

Set in Cloudflare Pages dashboard or `wrangler.toml`:

```toml
[vars]
SITE_URL = "https://example.com"
DEFAULT_LOCALE = "en"
```

Access in Astro:

```javascript
// astro.config.mjs
export default defineConfig({
  site: process.env.SITE_URL || 'https://example.com',
});
```

### Runtime Variables (Workers)

For dynamic features, use Cloudflare Workers environment:

```javascript
// functions/api/contact.js
export async function onRequestPost(context) {
  const { env, request } = context;
  
  const formData = await request.formData();
  
  // Use env variables
  const apiKey = env.EMAIL_API_KEY;
  
  // Send email...
}
```

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      deployments: write
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      
      - run: npm ci
      
      - name: Validate translations
        run: npm run i18n:check
      
      - name: Build
        run: npm run build
        env:
          SITE_URL: ${{ vars.SITE_URL }}
      
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: my-i18n-site
          directory: dist
          gitHubToken: ${{ secrets.GITHUB_TOKEN }}
```

### Preview Deployments

Every PR automatically gets a preview URL:
```
https://<commit-hash>.my-site.pages.dev
```

Configure in Cloudflare Pages → Builds & deployments → Preview deployments.

## Monitoring & Analytics

### Cloudflare Web Analytics

Free, privacy-friendly analytics:

```html
<!-- In layout, before </body> -->
<script defer src='https://static.cloudflareinsights.com/beacon.min.js' 
        data-cf-beacon='{"token": "your-token"}'></script>
```

### Real User Monitoring

Use Cloudflare's built-in RUM or integrate with:
- Google Analytics 4
- Plausible
- Fathom

## Troubleshooting

### Build Failures

1. Check Node.js version compatibility
2. Ensure all dependencies are in `package.json`
3. Review build logs in Cloudflare dashboard

### 404 Errors

1. Verify build output directory is correct
2. Check for correct trailing slash configuration
3. Ensure `_redirects` syntax is valid

### Slow TTFB

1. Enable Cloudflare cache
2. Add proper cache headers
3. Consider Cloudflare APO for dynamic sites

### Language Detection Not Working

1. Cloudflare Pages doesn't support `Accept-Language` natively
2. Use Workers middleware for detection
3. Implement client-side detection as fallback

## Cost Optimization

**Free tier includes:**
- Unlimited sites
- Unlimited requests
- 500 builds/month
- Unlimited bandwidth

**Paid features (if needed):**
- Web Analytics Advanced
- Cloudflare Images
- Workers (more compute)
- Pages Functions (serverless)

## Best Practices Summary

1. **Use hashed asset names** for cache busting
2. **Set long cache headers** for static assets
3. **Implement proper redirects** via `_redirects`
4. **Add security headers** via `_headers`
5. **Use Workers** for dynamic language detection
6. **Validate translations** in CI before deploy
7. **Monitor Core Web Vitals** via Cloudflare Analytics
8. **Test preview deployments** before merging PRs
