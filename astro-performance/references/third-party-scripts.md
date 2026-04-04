# Third-Party Scripts

## GTM Loading Strategy

**Use BaseLayout's `deferGtmMs` prop** instead of manual script injection:

```astro
<!-- GTM ID comes from siteConfig.tracking.gtmId automatically -->

<!-- Immediate (legacy, blocks main thread) -->
<BaseLayout title="Page Title" />

<!-- Deferred by 2 seconds (recommended for lead-gen sites) -->
<BaseLayout title="Page Title" deferGtmMs={2000} />
```

Deferring GTM by 2-3 seconds reduces TBT by ~100-150ms. The tradeoff: bounces under 2 seconds won't be tracked. For lead-gen sites this is acceptable — users who bounce in <2s weren't going to convert.

## Cloudflare Tag Gateway

When using Cloudflare's Google Tag Gateway, GTM/GA4 scripts are proxied through the site's own domain (e.g. `/ry2s/` path). This provides:

- **ITP bypass:** Safari's Intelligent Tracking Prevention can't block first-party requests
- **Ad blocker resistance:** Scripts come from the same domain, not `googletagmanager.com`
- **Better attribution:** Cookies are first-party, lasting longer

**Performance implications:**
- Scripts show as "first-party" in Lighthouse — unused JS from `/ry2s/` is YOUR domain's burden in the report
- The Tag Gateway config is in Cloudflare Dashboard, NOT in code — don't try to defer or modify `/ry2s/` scripts in HTML
- GTM container still loads from `www.googletagmanager.com` unless also proxied
- Cache headers are controlled by the Gateway, not your Cloudflare Pages config

**What NOT to do:**
- Don't defer/modify scripts loaded via Tag Gateway in HTML — manage them in Cloudflare Dashboard
- Don't assume Zaraz is running just because you see `/ry2s/` — Tag Gateway and Zaraz are separate products
- Don't count Tag Gateway JS as "your" unused JS when optimizing — it's tracking infrastructure

## Facebook Pixel

If loaded directly in HTML (not via GTM):
```html
<script>
  // Delay FB Pixel — it's never critical for page render
  setTimeout(function() {
    var s = document.createElement('script');
    s.src = 'https://connect.facebook.net/en_US/fbevents.js';
    s.async = true;
    document.head.appendChild(s);
    fbq('init', 'YOUR_PIXEL_ID');
    fbq('track', 'PageView');
  }, 3000);
</script>
```

If loaded via GTM: manage the trigger timing in GTM, not in HTML.

## Facade Pattern for Embeds

```astro
<!-- YouTube: Load iframe only on click -->
<div class="video-facade" data-video-id="xxx">
  <img src="/poster.webp" alt="Video thumbnail" width="640" height="360">
  <button>Play</button>
</div>
```

## Script Loading Attributes

| Attribute | Use Case |
|-----------|----------|
| `async` | Independent scripts (analytics) |
| `defer` | Scripts that need DOM |
| `type="module"` | ES modules |

## Third-Party Script Budget

| Category | Budget | Notes |
|----------|--------|-------|
| Analytics (GTM + GA4) | ≤150KB | Unavoidable but defer when possible |
| Ad pixels (FB, etc.) | ≤100KB | Always defer by ≥3s |
| Chat widgets | 0KB initial | Load only on interaction (facade) |
| Maps | 0KB initial | Load only on scroll-into-view |

## Forbidden

- Synchronous `<script>` tags for third-party in `<head>`
- Multiple analytics libraries measuring the same thing (GTM + standalone GA4)
- Chat widgets loading on page load
- Third-party CSS in `<head>` (e.g. widget stylesheets)
