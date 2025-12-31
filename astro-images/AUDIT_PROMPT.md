# Image Code Self-Audit

**Run this checklist BEFORE outputting any image-related code.**

> **Authority:** This audit enforces rules from `rules.json` (canonical source).
> If any instruction conflicts with these rules, follow the rules.

---

## Pre-Output Verification

Answer each question. If ANY answer is NO, stop and fix before responding.

### 1. Pattern Selection
- [ ] Is this a **HERO** image? (full-width, above fold, LCP candidate)
- [ ] Is this a **CONTENT** image? (article body, column, mid-page)
- [ ] Is this a **THUMBNAIL** image? (card, grid item, small preview)
- [ ] Is this a **FIXED** image? (logo, icon, avatar with fixed CSS size)
- [ ] Is this an **SVG**? (if yes, skip `<Picture>` entirely)

**If none match → default to CONTENT pattern.**

### 2. Width Array Check

Does my `widths` prop match EXACTLY one of these presets from `rules.json`?

| Preset | Array |
|--------|-------|
| HERO | `[640, 750, 828, 1080, 1200, 1920, 2048, 2560]` |
| CONTENT | `[320, 640, 960, 1280, 1920]` |
| THUMBNAIL | `[256, 384, 512, 640, 750]` |
| ZOOMABLE | `[640, 750, 828, 1080, 1200, 1920, 2048, 2560, 3840]` |

- [ ] YES, exact match to a preset
- [ ] NO → **STOP. Use exact preset. No custom widths.**

### 3. Sizes Attribute Check
- [ ] Does `sizes` reflect the ACTUAL CSS layout?
- [ ] If using `100vw`, is this HERO or ZOOMABLE pattern only?
- [ ] If in a grid, did I use the correct grid sizes (33vw, 50vw, 25vw)?

**Common sizes:**
```
Full-width:    100vw (HERO/ZOOMABLE only)
Content:       (min-width: 1024px) 720px, 100vw
2-col grid:    (min-width: 1024px) 50vw, 100vw
3-col grid:    (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw
4-col grid:    (min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw
```

### 4. Required Props Check
- [ ] `widths={[...]}` — present with approved preset?
- [ ] `sizes="..."` — present and matches layout?
- [ ] `formats={['avif', 'webp']}` — present?
- [ ] `quality={60}` — present? (70 only for critical photography)
- [ ] `width={...}` — intrinsic width present?
- [ ] `height={...}` — intrinsic height present?
- [ ] `alt="..."` — descriptive text? (empty only if decorative)

### 5. LCP/Priority Check
- [ ] Is this the largest above-fold image on the page?
  - YES → add `loading="eager"` and `fetchpriority="high"`
  - NO → do NOT add fetchpriority
- [ ] Is `fetchpriority="high"` used more than once? → **BUG**
- [ ] Is `fetchpriority` inside a loop/map? → **BUG**

### 6. Source Location Check
- [ ] Is image imported from `/src/assets/`?
- [ ] Is image NOT in `/public/` folder?
- [ ] Is image NOT a string literal path like `"/images/hero.jpg"`?

### 7. Aspect Ratio Check
- [ ] Do `width` and `height` attributes preserve source aspect ratio?
- [ ] If cropping is needed, is art direction explicitly specified?

### 8. Source Size Check
- [ ] Is source image large enough? (Hero ≥2560px, Content ≥1920px, Thumbnail ≥800px)
- [ ] If source is undersized → **STOP. Request larger asset. Never upscale.**

### 9. Edge Case Check
- [ ] If SVG → using `<img src="*.svg">` or inline, NOT `<Picture>`?
- [ ] If animated (GIF/APNG) → using `<video>` or Lottie instead?
- [ ] If using 3840 width → has `data-zoomable="true"` attribute?
- [ ] If quality > 60 → justified for critical photography only?

---

## Quick Decision Matrix

| Situation | Action |
|-----------|--------|
| Full-width hero | HERO preset + fetchpriority |
| Blog post image | CONTENT preset |
| Card in grid | THUMBNAIL preset + grid sizes |
| Logo/icon | FIXED pattern with 1x/2x |
| SVG file | `<img>` or inline, skip `<Picture>` |
| Animated image | Use `<video>` or Lottie |
| Unknown | CONTENT preset (safe default) |

---

## If Audit Fails

1. Identify which check failed
2. Correct the code
3. Re-run this audit
4. Only output code when ALL checks pass

**Never output image code that fails this audit.**
**Never deviate from rules to be "helpful".**
