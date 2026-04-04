# Caching Strategy

## Cloudflare Pages / Workers

### _headers file (in project root):
```
# Hashed assets (CSS, JS, images processed by Astro) — immutable
/_astro/*
  Cache-Control: public, max-age=31536000, immutable

# Self-hosted fonts — immutable (they never change)
/fonts/*
  Cache-Control: public, max-age=31536000, immutable

# Pre-processed images in /img/ — long cache, not immutable (may be replaced)
/img/*
  Cache-Control: public, max-age=2592000

# OG images — long cache
/og/*
  Cache-Control: public, max-age=2592000

# HTML pages — always revalidate
/*.html
  Cache-Control: public, max-age=0, must-revalidate

# Root page
/
  Cache-Control: public, max-age=0, must-revalidate
```

### wrangler.toml alternative:
```toml
[[headers]]
  for = "/_astro/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/fonts/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*.html"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"
```

## What You Can't Control

- **Cloudflare Tag Gateway scripts** (`/ry2s/`) — cache managed by the Gateway
- **Facebook Pixel** (`connect.facebook.net`) — 20 min TTL, can't change
- **CookieYes** (`cdn-cookieyes.com`) — 10 hour TTL, can't change
- **Cloudflare beacon** (`static.cloudflareinsights.com`) — 1 day TTL, can't change

Lighthouse will flag these as "inefficient cache" — this is expected and you cannot fix it. Don't spend time trying.

## Edge Caching for HTML

For Astro static sites on Cloudflare Pages, HTML is automatically edge-cached and purged on deploy. No additional config needed.

For SSR pages (`prerender: false`): consider adding `Cache-Control: public, s-maxage=3600, max-age=0` to cache at the edge for 1 hour while keeping browsers fresh.
