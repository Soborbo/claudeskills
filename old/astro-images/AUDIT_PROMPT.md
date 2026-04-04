# Astro Images Audit Checklist

Run this checklist after implementing images to verify compliance with the skill.

---

## 1. File Structure

- [ ] All images in `/src/assets/` (not `/public/`)
- [ ] Schema images in `/src/assets/schema/`
- [ ] No images in `/public/` directory

```bash
# Should return empty
find public -type f \( -name "*.jpg" -o -name "*.png" -o -name "*.webp" -o -name "*.avif" \) 2>/dev/null
```

---

## 2. Picture Components

### Required Props
- [ ] Every `<Picture>` has `widths` prop
- [ ] Every `<Picture>` has `sizes` prop
- [ ] Every `<Picture>` has `quality={60}`
- [ ] Every `<Picture>` has `formats={['avif', 'webp']}`
- [ ] Every `<Picture>` has `width` and `height` (or inferred from import)
- [ ] Every `<Picture>` has `alt` attribute

```bash
# Should return empty (missing widths)
grep -r "<Picture" src --include="*.astro" | grep -v "widths="

# Should return empty (missing sizes)
grep -r "<Picture" src --include="*.astro" | grep -v "sizes="

# Should return empty (missing quality)
grep -r "<Picture" src --include="*.astro" | grep -v "quality="

# Should return empty (missing formats)
grep -r "<Picture" src --include="*.astro" | grep -v "formats="

# Should return empty (missing alt)
grep -r "<Picture" src --include="*.astro" | grep -v "alt="
```

---

## 3. Width Arrays (Must Match Exactly)

| Pattern | Correct Array |
|---------|---------------|
| FULL | `[640,750,828,1080,1200,1920,2048,2560]` |
| TWO_THIRDS | `[384,640,768,1024,1280,1706,2048]` |
| LARGE | `[384,640,768,1024,1280,1536,1920]` |
| HALF | `[320,640,960,1280,1600]` |
| SMALL | `[256,512,640,1024,1280]` |
| THIRD | `[256,512,640,853,1280]` |
| QUARTER | `[192,384,512,640,960]` |
| FIFTH | `[160,320,512,640,768]` |
| SIXTH | `[128,256,427,512,640]` |

- [ ] No custom width arrays
- [ ] No computed/dynamic width arrays
- [ ] Each `widths` prop matches a pattern exactly

---

## 4. Sizes Attributes (Must Match Layout)

| Pattern | Correct sizes |
|---------|---------------|
| FULL | `100vw` |
| TWO_THIRDS | `(min-width: 1024px) 66vw, 100vw` |
| LARGE | `(min-width: 1024px) 60vw, 100vw` |
| HALF | `(min-width: 1024px) 50vw, 100vw` |
| SMALL | `(min-width: 1024px) 40vw, 100vw` |
| THIRD | `(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw` |
| QUARTER | `(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw` |
| FIFTH | `(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw` |
| SIXTH | `(min-width: 1024px) 16vw, (min-width: 640px) 33vw, 50vw` |

- [ ] No defensive `100vw` on non-full-width images
- [ ] `sizes` matches actual CSS layout

---

## 5. LCP / Priority

- [ ] Only ONE image has `fetchpriority="high"`
- [ ] `fetchpriority` is NOT inside a loop/map
- [ ] Hero image has `loading="eager"`
- [ ] Below-fold images use default lazy loading

```bash
# Count fetchpriority="high" — should be 0 or 1
grep -r 'fetchpriority="high"' src --include="*.astro" | wc -l

# Should return empty (fetchpriority in loops)
grep -r "fetchpriority" src --include="*.astro" | grep -E "\.(map|forEach)\("
```

---

## 6. Forbidden Patterns

- [ ] No `<Picture>` for SVG files
- [ ] No animated images (GIF/APNG/animated WebP)
- [ ] No CSS `background-image` for LCP/content images
- [ ] No upscaled images (source smaller than largest width in array)

```bash
# Should return empty (SVG through Picture)
grep -r "<Picture" src --include="*.astro" | grep -i "\.svg"

# Should return empty (GIF through Picture)
grep -r "<Picture" src --include="*.astro" | grep -i "\.gif"
```

---

## 7. Source Image Sizes

Verify source images meet minimum requirements:

| Pattern | Min Source Width |
|---------|------------------|
| FULL | 2560px |
| TWO_THIRDS | 2048px |
| LARGE | 1920px |
| HALF | 1600px |
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
- [ ] No upscaling occurring

---

## 8. Alt Text

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

## 9. FIXED Pattern (logos, avatars, icons)

- [ ] Uses `<img>` not `<Picture>`
- [ ] Uses `getImage()` from `astro:assets`
- [ ] Has 1x and 2x variants in srcset
- [ ] Quality: 80 for 1x, 60 for 2x
- [ ] 3x only used for icons ≥64px where fidelity matters

```bash
# Find getImage usage for verification
grep -r "getImage" src --include="*.astro"
```

---

## 10. Schema Images

- [ ] Three versions exist: 1:1, 4:3, 16:9
- [ ] All are minimum 1200px wide
- [ ] Located in `/src/assets/schema/`
- [ ] Referenced in schema markup
- [ ] Referenced in `og:image`

```bash
# Check schema folder
ls -la src/assets/schema/
```

Expected files:
```
schema-1x1.jpg    (1200×1200)
schema-4x3.jpg    (1200×900)
schema-16x9.jpg   (1200×675)
```

---

## 11. Decoding

- [ ] Non-LCP images have `decoding="async"`
- [ ] Hero/LCP image does NOT have `decoding="async"`

---

## 12. Cloudflare Adapter Configuration

**Critical for Cloudflare deployments.** Sharp doesn't work at runtime on Cloudflare Workers/Pages.

- [ ] `output: 'static'` in astro.config (not `'server'`)
- [ ] `imageService: 'compile'` in adapter config
- [ ] `image.service.entrypoint: 'astro/assets/services/sharp'` set

```bash
# Check astro.config.mjs for correct settings
grep -E "output:|imageService|entrypoint" astro.config.mjs
```

**Expected output:**
```
output: 'static',
imageService: 'compile'
entrypoint: 'astro/assets/services/sharp'
```

**Wrong configuration (no AVIF/WebP generated):**
```js
export default defineConfig({
  output: 'server',  // ❌ Wrong
  adapter: cloudflare()
});
```

**Correct configuration:**
```js
export default defineConfig({
  output: 'static',  // ✅ Build-time generation
  adapter: cloudflare({
    imageService: 'compile'  // ✅ Build-time optimization
  }),
  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp'  // ✅ Sharp at build
    }
  }
});
```

---

## 13. Build Verification

```bash
# Build and check for errors
npm run build

# Check generated image sizes
find dist/_astro -name "*.avif" -o -name "*.webp" | head -20
```

- [ ] Build completes without image errors
- [ ] AVIF and WebP variants generated
- [ ] No unexpected image sizes in output

---

## 14. Browser Verification

Open DevTools → Network → Img filter:

- [ ] Only ONE image loads per `<Picture>` element
- [ ] Correct format loads (AVIF in Chrome/Firefox, WebP fallback)
- [ ] Image size appropriate for viewport (not oversized)
- [ ] No duplicate image requests

---

## 15. Lighthouse Check

Run Lighthouse performance audit:

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
| All `<Picture>` have required props | ☐ |
| Width arrays match patterns exactly | ☐ |
| Sizes match CSS layout | ☐ |
| Only 1 `fetchpriority="high"` | ☐ |
| No forbidden patterns | ☐ |
| Source images large enough | ☐ |
| Alt text proper | ☐ |
| FIXED pattern correct | ☐ |
| Schema images present | ☐ |
| Cloudflare adapter config correct | ☐ |
| Build passes (AVIF/WebP generated) | ☐ |
| Browser loads single image | ☐ |
| Lighthouse passes | ☐ |

---

## If Audit Fails

1. Identify which check failed
2. Locate the offending file/component
3. Fix according to SKILL.md
4. Re-run failed checks
5. Full audit passes before deployment

---

## 16. Undersized Images Report

Run this script to generate a report of all images that need replacement:

```bash
#!/bin/bash
# undersized-report.sh
# Generates table of images smaller than their pattern requires

echo "| Image | Used In | Current Size | Pattern | Required Width | Action |"
echo "|-------|---------|--------------|---------|----------------|--------|"

# Find all Picture components and check source sizes
grep -r "src={" src/components src/pages --include="*.astro" -l | while read file; do
  # Extract image imports and usages
  grep -oP "import \K\w+(?=.*from.*assets)" "$file" | while read img; do
    # Get the source file path
    src_path=$(grep "import $img" "$file" | grep -oP "from ['\"]\.\.?/\K[^'\"]+")
    if [ -f "src/$src_path" ]; then
      # Get image dimensions
      width=$(identify -format "%w" "src/$src_path" 2>/dev/null)
      # Get the widths array used
      pattern=$(grep -A5 "src={$img}" "$file" | grep -oP "widths={\[\K[^\]]+")
      max_width=$(echo "$pattern" | tr ',' '\n' | sort -n | tail -1)
      
      if [ "$width" -lt "$max_width" ] 2>/dev/null; then
        echo "| $img | $file | ${width}px | - | ${max_width}px | ⚠️ Replace |"
      fi
    fi
  done
done
```

**Manual Alternative — Generate Report Table:**

After build, manually check and fill this table:

| Image | Used In | Current Size | Pattern | Required Width | Action |
|-------|---------|--------------|---------|----------------|--------|
| hero.jpg | pages/index.astro | ?×? | FULL | 2560px | ☐ Check |
| owner.jpg | components/About.astro | ?×? | HALF | 1600px | ☐ Check |
| team-1.jpg | components/Team.astro | ?×? | QUARTER | 960px | ☐ Check |
| logo.png | components/Header.astro | ?×? | FIXED | 2× display | ☐ Check |

**Quick size check command:**

```bash
# List all images with dimensions
find src/assets -type f \( -name "*.jpg" -o -name "*.png" -o -name "*.webp" \) \
  -exec identify -format "| %f | - | %wx%h | - | - | ☐ |\n" {} \; 2>/dev/null
```

**Send this table to client for bulk replacement:**

```markdown
## Images Needing Replacement

The following images are smaller than required for optimal display:

| Image | Current Size | Required Size | Priority |
|-------|--------------|---------------|----------|
| hero-home.jpg | 1920×1080 | 2560×1440 | 🔴 High |
| about-split.jpg | 1200×800 | 1600×1067 | 🟡 Medium |
| team-john.jpg | 500×500 | 960×960 | 🟡 Medium |

Please provide replacement images at the required sizes.
```
