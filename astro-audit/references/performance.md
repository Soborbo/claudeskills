# Performance Audit

## Core Web Vitals Targets

| Metric | Target | Threshold |
|--------|--------|-----------|
| LCP | < 2.5s | < 1.5s ideal |
| FID/INP | < 100ms | < 50ms ideal |
| CLS | < 0.1 | < 0.05 ideal |
| TTFB | < 800ms | < 200ms ideal |

## Bundle Analysis

```bash
# Total bundle size
du -sh dist/

# JavaScript breakdown
find dist -name "*.js" -exec wc -c {} + | sort -n

# CSS breakdown  
find dist -name "*.css" -exec wc -c {} +

# Largest files
find dist -type f -exec ls -la {} + | sort -k5 -n | tail -20
```

**Size budgets:**

| Asset Type | Budget |
|------------|--------|
| Total JS | 100kb gzipped |
| Total CSS | 50kb gzipped |
| Hero image | 100kb |
| Other images | 50kb each |
| Fonts | 100kb total |

## Image Optimization

```bash
# Find large images
find src/assets -type f \( -name "*.jpg" -o -name "*.png" \) -size +100k

# Check image formats
find src/assets -name "*.png" -exec file {} \; | grep -v "PNG image"
find src/assets -name "*.jpg" -exec file {} \; | grep -v "JPEG image"

# Verify Picture component usage
grep -rn "<Picture" src/ | wc -l
grep -rn "<img" src/ | wc -l  # Should be 0 or minimal
```

**Image rules:**
- Photos: AVIF → WebP → JPG
- Graphics: WebP → PNG
- Hero: eager + fetchpriority="high"
- Below fold: lazy loading
- Always set dimensions (aspect-ratio)

## Font Optimization

```bash
# Check font loading
grep -rn "font-display" src/
grep -rn "@font-face" src/
grep -rn "fonts.googleapis" src/

# Check preload
grep -rn "preload.*font" src/
```

**Font rules:**
- `font-display: swap` always
- Preload critical fonts
- Subset if possible
- Max 2-3 font files

## JavaScript Optimization

```bash
# Check for heavy imports
grep -rn "import.*from" src/ --include="*.ts" | head -30

# Find dynamic imports
grep -rn "import(" src/

# Check client directives
grep -rn "client:" src/
```

**JS rules:**
- Minimize `client:load` usage
- Prefer `client:visible` or `client:idle`
- Tree-shake unused code
- Split large components

## CSS Optimization

```bash
# Check for unused CSS (approximate)
npx purgecss --css dist/**/*.css --content dist/**/*.html --output purged/

# Check inline styles
grep -rn "style=" src/ --include="*.astro" | wc -l
```

**CSS rules:**
- Critical CSS inlined
- Non-critical deferred
- Remove unused Tailwind classes
- No duplicate styles

## Third-Party Impact

```bash
# List external scripts
grep -rn "<script.*src=" src/ | grep -v "node_modules"

# Check async/defer
grep -rn "<script" src/ | grep -v "async\|defer\|type=\"module\""
```

**Third-party rules:**
- Load async/defer
- Use facade for YouTube
- Delay non-critical (analytics after interaction)
- Consider self-hosting critical libs

## Server/CDN

**Cloudflare settings:**
- Auto Minify: ON (HTML, CSS, JS)
- Brotli: ON
- Early Hints: ON
- Rocket Loader: OFF (conflicts with Astro)
- Cache TTL: 1 month for assets

## Testing Commands

```bash
# Lighthouse CLI
npx lighthouse https://example.com --view

# WebPageTest
# Use: https://www.webpagetest.org/

# Chrome DevTools
# Performance tab → Record → Reload

# CrUX data
# https://pagespeed.web.dev/
```

## Performance Checklist

- [ ] Lighthouse Performance > 90
- [ ] LCP < 2.5s
- [ ] CLS < 0.1
- [ ] Total JS < 100kb
- [ ] Hero image optimized + eager
- [ ] Fonts preloaded + swap
- [ ] No render-blocking resources
- [ ] Images lazy loaded
- [ ] Third-party scripts deferred
- [ ] Cloudflare caching configured
