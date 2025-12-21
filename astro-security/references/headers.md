# Security Headers

## Cloudflare Pages `_headers`

```
/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload

/*.html
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://www.google-analytics.com https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; base-uri 'self'; form-action 'self'
```

## CSP Breakdown

| Directive | Value | Purpose |
|-----------|-------|---------|
| default-src | 'self' | Fallback for all |
| script-src | 'self' 'unsafe-inline' + domains | JS sources |
| style-src | 'self' 'unsafe-inline' + fonts | CSS sources |
| font-src | 'self' + Google Fonts | Font files |
| img-src | 'self' data: https: | Images anywhere HTTPS |
| connect-src | 'self' + analytics | Fetch/XHR targets |
| frame-src | Turnstile domain | Iframes allowed |
| base-uri | 'self' | Prevent base tag hijack |
| form-action | 'self' | Form submission targets |

## Common CSP Additions

```
# Google Analytics 4
script-src https://www.googletagmanager.com https://www.google-analytics.com
connect-src https://www.google-analytics.com https://analytics.google.com

# Google Fonts
style-src https://fonts.googleapis.com
font-src https://fonts.gstatic.com

# Turnstile
script-src https://challenges.cloudflare.com
frame-src https://challenges.cloudflare.com

# YouTube (if embedded)
frame-src https://www.youtube-nocookie.com

# Hotjar
script-src https://static.hotjar.com https://script.hotjar.com
connect-src https://*.hotjar.com wss://*.hotjar.com
frame-src https://vars.hotjar.com
font-src https://script.hotjar.com

# Meta Pixel
script-src https://connect.facebook.net
connect-src https://www.facebook.com
img-src https://www.facebook.com
```

## Header Explanations

| Header | Value | Purpose |
|--------|-------|---------|
| X-Content-Type-Options | nosniff | Prevent MIME sniffing |
| X-Frame-Options | DENY | Prevent clickjacking |
| X-XSS-Protection | 1; mode=block | Legacy XSS filter |
| Referrer-Policy | strict-origin-when-cross-origin | Control referrer info |
| Permissions-Policy | camera=(), etc. | Disable browser APIs |
| HSTS | max-age=31536000 | Force HTTPS for 1 year |

## Testing Headers

```bash
# Check headers
curl -I https://example.com

# Security scanner
# https://securityheaders.com
# https://observatory.mozilla.org
```

## Astro Middleware Alternative

```typescript
// src/middleware.ts
export function onRequest({ request }, next) {
  const response = await next();
  
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  // etc.
  
  return response;
}
```
