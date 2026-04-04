# Astro Images Audit Checklist

Run this checklist after implementing images to verify compliance with the skill.

---

## 1. File Structure

- [ ] All images in `/src/assets/` (not `/public/`)
- [ ] No images in `/public/` directory (except pre-optimized with manual srcset)

```bash
# Should return empty
find public -type f \( -name "*.jpg" -o -name "*.png" -o -name "*.webp" -o -name "*.avif" \) 2>/dev/null
```

---

## 2. Picture Components

### Required Props
- [ ] Every `<Picture>` has `pattern` prop (or uses default HALF)
- [ ] Every `<Picture>` has `alt` attribute
- [ ] No manual `widths` or `sizes` props unless custom override is needed

```bash
# Should return empty (Picture without pattern — allowed if HALF default is intentional)
grep -r "<Picture" src --include="*.astro" | grep -v "pattern="

# Should return empty (missing alt)
grep -r "<Picture" src --include="*.astro" | grep -v "alt="

# Should return empty (old API — manual widths/sizes/quality/formats)
grep -r "<Picture" src --include="*.astro" | grep -E "widths=\{|sizes=\"|quality=\{|formats=\{"
```

---

## 3. Pattern Selection (Must Match Layout)

| Layout | Correct Pattern |
|--------|----------------|
| Full-bleed hero | `FULL` |
| Split 66/33, 60/40 (image side) | `TWO_THIRDS`, `LARGE` |
| Split 50/50, checkerboard | `HALF` |
| Card at 50% with max-height | `HALF_CARD` |
| Text-dominant split (40/60) | `SMALL` |
| 3-col grid, standing person | `THIRD` |
| 4-col team grid | `QUARTER` |
| 5-col icons | `FIFTH` |
| 6-col logos | `SIXTH` |
| Logo, avatar, icon | Use `FixedImage` component |

- [ ] Each `pattern` prop matches the actual CSS layout
- [ ] Unknown layouts default to HALF

---

## 4. LCP / Priority

- [ ] Only ONE image has `lcp` prop per page
- [ ] `lcp` prop is NOT inside a loop/map
- [ ] Hero image uses `lcp` prop (sets loading="eager" + fetchpriority="high")
- [ ] Below-fold images use default lazy loading (no props needed)
- [ ] 2-3 above-fold non-hero images use `aboveFold` prop

```bash
# Count lcp props — should be 0 or 1 per page
grep -r 'lcp' src --include="*.astro" | grep "<Picture" | wc -l

# Should return empty (lcp in loops)
grep -r "lcp" src --include="*.astro" | grep -E "\.(map|forEach)\("
```

---

## 5. Forbidden Patterns

- [ ] No `<Picture>` for SVG files (use `<img>` with width/height)
- [ ] No animated images (GIF/APNG/animated WebP — use `<video>`)
- [ ] No CSS `background-image` for LCP/content images
- [ ] No upscaled images (source smaller than pattern minSourceWidth)
- [ ] No PNG fallback for photos (JPG is automatic fallback)
- [ ] No `loading="lazy"` on hero images
- [ ] No `loading="eager"` on below-fold images

```bash
# Should return empty (SVG through Picture)
grep -r "<Picture" src --include="*.astro" | grep -i "\.svg"

# Should return empty (GIF through Picture)
grep -r "<Picture" src --include="*.astro" | grep -i "\.gif"
```

---

## 6. Source Image Sizes

Verify source images meet minimum requirements for their pattern:

| Pattern | Min Source Width |
|---------|------------------|
| FULL | 2560px |
| TWO_THIRDS | 2048px |
| LARGE | 1920px |
| HALF | 1600px |
| HALF_CARD | 1280px |
| SMALL | 1280px |
| THIRD | 1280px |
| QUARTER | 960px |
| FIFTH | 768px |
| SIXTH | 640px |

```bash
# List all images with dimensions (requires ImageMagick)
find src/assets -type f \( -name "*.jpg" -o -name "*.png" -o -name "*.webp" \) -exec identify -format "%f: %wx%h\n" {} \;
```

- [ ] No source image is smaller than its pattern requires
- [ ] FULL/LCP undersized = ERROR (must provide larger asset)
- [ ] Other undersized = WARNING (widths capped automatically, flag for replacement)

---

## 7. Alt Text

- [ ] Content images have descriptive alt text
- [ ] Decorative images have `alt=""`
- [ ] No missing alt attributes
- [ ] No generic alt text ("image", "photo", "picture")

```bash
# Find potentially bad alt text
grep -r 'alt="image"' src --include="*.astro"
grep -r 'alt="photo"' src --include="*.astro"
grep -r 'alt="picture"' src --include="*.astro"
```

---

## 8. FixedImage Component (logos, avatars, icons)

- [ ] Uses `<FixedImage>` component (not `<Picture>`)
- [ ] Has `width` prop set to display width
- [ ] Has `alt` text
- [ ] `include3x` only used for icons >= 64px
- [ ] Quality defaults: 80 for 1x, 60 for 2x/3x

```bash
# Find FixedImage usage for verification
grep -r "<FixedImage" src --include="*.astro"
```

---

## 9. OG Images

- [ ] 5 variants generated from hero (og, twitter, schema-16, schema-4, schema-1)
- [ ] All in JPG format (not AVIF/WebP — social platforms need JPG)
- [ ] Quality 80
- [ ] BaseLayout has `ogImage` prop set

```bash
# OG images exist
find public/og -name "*-og.jpg" | wc -l
```

---

## 10. BaseLayout Integration

- [ ] Every page passes `preloadImage` prop to BaseLayout
- [ ] `preloadImage` is the page's own hero image (not hardcoded global)
- [ ] Each page has its own hero path

```bash
# Check preloadImage usage
grep -r "preloadImage" src --include="*.astro"
```

---

## 11. Face Focus

- [ ] Images with people have `object-position` set (e.g. `class="object-[center_20%]"`)
- [ ] Ambiguous focal points were discussed with user
- [ ] Default center-center used for non-person images

---

## 12. Checkerboard Layout

- [ ] Image always FIRST in DOM (mobile: image on top)
- [ ] Text always SECOND in DOM (mobile: text below)
- [ ] Desktop alternation uses CSS `order` (not DOM reorder)
- [ ] No `flex-col-reverse` or `order-first/last` on mobile

---

## 13. Raw `<img>` Rules

Raw `<img>` allowed only for: FixedImage component output, SVGs, external URLs.

- [ ] SVG `<img>` tags have explicit `width` and `height` (from viewBox)
- [ ] External URL images have `width`, `height`, `loading="lazy"`, `decoding="async"`
- [ ] `width`/`height` = delivered dimensions, not source

---

## 14. Cloudflare Adapter Configuration

- [ ] `output: 'static'` in astro.config
- [ ] `imageService: 'compile'` in adapter config
- [ ] `image.service.entrypoint: 'astro/assets/services/sharp'` set

```bash
grep -E "output:|imageService|entrypoint" astro.config.mjs
```

---

## 15. Build Verification

```bash
npm run build

# AVIF and WebP variants generated
find dist/_astro -name "*.avif" -o -name "*.webp" | head -20

# No PNG photos in output
find dist -name "*.png" -not -path "*/icons/*" -not -path "*/svg/*" | head -10

# 480w in srcsets
grep -r "480w" dist --include="*.html" | wc -l
```

- [ ] Build completes without image errors
- [ ] AVIF and WebP variants generated
- [ ] No unexpected PNG photos in output
- [ ] 480w present in every srcset

---

## 16. Browser Verification

Open DevTools → Network → Img filter:

- [ ] Only ONE image loads per `<Picture>` element
- [ ] Correct format loads (AVIF in Chrome/Firefox, WebP fallback)
- [ ] Image size appropriate for viewport (not oversized)
- [ ] No duplicate image requests

---

## 17. Lighthouse Check

- [ ] No "Properly size images" warning
- [ ] No "Serve images in next-gen formats" warning
- [ ] No "Efficiently encode images" warning
- [ ] LCP image loads within 2.5s
- [ ] No CLS from images (width/height set)

---

## Quick Pass/Fail Summary

| Check | Status |
|-------|--------|
| Files in `/src/assets/` | ☐ |
| All `<Picture>` have `pattern` prop | ☐ |
| Pattern matches CSS layout | ☐ |
| Only 1 `lcp` prop per page | ☐ |
| No forbidden patterns | ☐ |
| Source images large enough | ☐ |
| Alt text proper | ☐ |
| FixedImage for fixed-size images | ☐ |
| OG images (5 variants, JPG) | ☐ |
| BaseLayout has `preloadImage` | ☐ |
| Face focus on people images | ☐ |
| Checkerboard: image first in DOM | ☐ |
| Raw `<img>` have width/height | ☐ |
| Cloudflare adapter config correct | ☐ |
| Build passes (AVIF/WebP, 480w) | ☐ |
| Browser loads single image | ☐ |
| Lighthouse passes | ☐ |

---

## If Audit Fails

1. Identify which check failed
2. Locate the offending file/component
3. Fix according to SKILL.md
4. Re-run failed checks
5. Full audit passes before deployment
