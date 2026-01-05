# Image Preparation Guide

A guide for preparing images for your website. Following these guidelines ensures fast loading and sharp display on all devices.

> **Key insight:** We optimize based on how WIDE the image displays, not its shape. The same rules apply whether your image is landscape, portrait, or square.

---

## Quick Reference by Width

| Image Width on Page | Pattern | Minimum Source Width | Common Uses |
|---------------------|---------|---------------------|-------------|
| Full screen (100%) | FULL | 2560px | Full-bleed hero banners |
| ~66% screen | TWO_THIRDS | 2048px | Dominant side of 66/33 split |
| ~60% screen | LARGE | 1920px | Dominant side of 60/40 split |
| ~50% screen | HALF | 1600px | Split hero, checkerboard |
| ~40% screen | SMALL | 1280px | Smaller side of 60/40 split |
| ~33% screen | THIRD | 1280px | 3-column grid, features |
| ~25% screen | QUARTER | 960px | 4-column grid, team photos |
| ~20% screen | FIFTH | 768px | 5-column grid, icon features |
| ~16% screen | SIXTH | 640px | 6-column grid, partner logos |
| Fixed size | FIXED | 2× display size | Logos, avatars, icons |

---

## Aspect Ratios (Shape)

You can use ANY aspect ratio. The width rule stays the same.

| Ratio | Shape | Common Uses |
|-------|-------|-------------|
| **16:9** | Wide landscape | Hero banners, video thumbnails |
| **4:3** | Standard landscape | Traditional photos, features |
| **3:2** | Photo landscape | Professional photography |
| **1:1** | Square | Google search, social sharing, avatars |
| **2:3** | Portrait | Standing person photos |
| **3:4** | Portrait | Headshots, product shots |

**Example:** A standing photo of the business owner (2:3 portrait) displayed at 50% screen width needs:
- Minimum 1600px wide source (HALF pattern)
- Dimensions: 1600×2400 or larger

---

## Hero Images

### Full-Width Hero (100% screen)

**Requirements:**
- **Minimum width:** 2560px
- **Aspect ratio:** 16:9 or 21:9 recommended
- **Format:** JPG
- **Example size:** 2560×1440 (16:9)

### Split Hero (50% screen with text)

**Requirements:**
- **Minimum width:** 1600px
- **Aspect ratio:** Any (4:3, 3:2, 1:1, or portrait)
- **Format:** JPG
- **Example sizes:** 1600×1200 (4:3), 1600×1600 (1:1), 1600×2400 (2:3 portrait)

### Asymmetric Split Hero (60/40 or 66/33)

**Image-dominant side (60% or 66%):**
- **Minimum width:** 1920px (60%) or 2048px (66%)
- **Aspect ratio:** Any

**Text-dominant side (40%):**
- **Minimum width:** 1280px
- **Aspect ratio:** Any

---

## Grid Images

### 3-Column Grid (THIRD)

**Requirements:**
- **Minimum width:** 1280px
- **Aspect ratio:** 4:3 or 1:1 work best
- **Example size:** 1280×960 (4:3)

### 4-Column Grid (QUARTER)

**Requirements:**
- **Minimum width:** 960px
- **Aspect ratio:** 1:1 or 3:4
- **Example sizes:** 960×960 (square), 960×1280 (3:4)

### 5-Column Grid (FIFTH)

**Requirements:**
- **Minimum width:** 768px
- **Aspect ratio:** 1:1 recommended
- **Example size:** 768×768 (square)

### 6-Column Grid (SIXTH)

**Requirements:**
- **Minimum width:** 640px
- **Aspect ratio:** 1:1 recommended
- **Example size:** 640×640 (square)
- **Common use:** Partner logos, client logos, trust badges

---

## Person Photos

### Standing/Full Body (Portrait)

**Requirements:**
- **Minimum width:** 1280-1600px (depends on display size)
- **Aspect ratio:** 2:3 or 3:4
- **Example size:** 1600×2400 (2:3)

**Tips:**
- Subject centered for cropping flexibility
- Clear background or environment
- Good lighting on face

### Headshots / Team Grid

**Requirements:**
- **Minimum width:** 960px (4-column) or 768px (5-column)
- **Aspect ratio:** 1:1 (square) or 3:4
- **Example sizes:** 960×960 (square), 960×1280 (3:4)

**Tips:**
- Consistent background across all team photos
- Similar framing (head and shoulders)
- Same aspect ratio for all team members

---

## Google Search Images (Schema)

For your website to appear with images in Google search results, we need THREE versions:

| Ratio | Size | Purpose |
|-------|------|---------|
| **1:1** | 1200×1200 | Google Discover, mobile search |
| **4:3** | 1200×900 | Standard thumbnails |
| **16:9** | 1200×675 | Top Stories, video results |

**What to provide:**
- ONE high-quality photo that can be cropped to all three ratios
- OR three separate images at these sizes
- Subject should be centered so it looks good when cropped

---

## Logos

**Preferred:** SVG format (vector, scales perfectly)

**If SVG unavailable:**
- Minimum width: 2× your largest display size
- Format: PNG with transparency
- Example: If logo displays at 200px, provide 400px source

**What we need:**
```
logo.svg              (primary - preferred)
logo-white.svg        (for dark backgrounds)
logo-icon.svg         (square mark for favicon)
logo.png              (fallback if no SVG, 800px wide)
```

---

## Favicon

- **Size:** 512×512 pixels
- **Format:** PNG with transparency
- **Shape:** Square (design can be any shape within)

---

## File Formats

| Format | Use For | Transparency |
|--------|---------|--------------|
| **JPG** | Photos | No |
| **PNG** | Graphics, logos, screenshots | Yes |
| **SVG** | Logos, icons, illustrations | Yes |

**We automatically convert to:** AVIF and WebP for fast loading.

---

## How to Check Image Size

**Mac:** Right-click → Get Info → Look for "Dimensions"

**Windows:** Right-click → Properties → Details → Width/Height

**Online:** Upload to [squoosh.app](https://squoosh.app)

---

## Common Mistakes to Avoid

❌ **Upscaling small images** — We cannot use a 500px image stretched to 2560px

❌ **Wrong aspect ratio for layout** — A 16:9 image won't work well for a standing person shot

❌ **Inconsistent team photos** — Mix of squares, portraits, and landscapes looks messy

❌ **Text baked into images** — We add text via code for SEO and accessibility

❌ **Low resolution phone screenshots** — Screenshots are often too small for hero use

---

## Checklist Before Sending

- [ ] Full-width hero images are at least 2560px wide
- [ ] Split hero images are at least 1600px wide
- [ ] Asymmetric split (60-66%) images are at least 1920-2048px wide
- [ ] 3-column grid images are at least 1280px wide
- [ ] 4-column grid images are at least 960px wide
- [ ] 5-column grid images are at least 768px wide
- [ ] 6-column grid images are at least 640px wide
- [ ] Logo provided as SVG (or 800px PNG)
- [ ] Schema images provided (1200×1200, 1200×900, 1200×675)
- [ ] Favicon provided at 512×512 PNG
- [ ] All team photos use the same aspect ratio
- [ ] Files are named descriptively (no IMG_12345.jpg)
- [ ] No upscaled/blurry images

---

## Organizing Your Images

```
/images
  /heroes
    hero-homepage.jpg       (2560×1440)
    hero-about-split.jpg    (1600×1200)
  /features
    feature-1.jpg           (1600×1200)
    feature-2.jpg           (1600×1200)
  /team
    john-smith.jpg          (960×960 square)
    jane-doe.jpg            (960×960 square)
  /people
    owner-standing.jpg      (1600×2400 portrait)
  /partners
    partner-logo-1.jpg      (640×640)
    partner-logo-2.jpg      (640×640)
  /schema
    main-photo-square.jpg   (1200×1200)
    main-photo-4x3.jpg      (1200×900)
    main-photo-16x9.jpg     (1200×675)
  /logos
    logo.svg
    logo-white.svg
    favicon.png             (512×512)
```

---

## Summary

| What | Minimum Width | Shape Options |
|------|---------------|---------------|
| Full-width hero | 2560px | 16:9, 21:9 |
| Dominant split (66%) | 2048px | Any |
| Dominant split (60%) | 1920px | Any |
| Split 50/50, features | 1600px | Any |
| Smaller split (40%) | 1280px | Any |
| 3-column grid | 1280px | Any |
| 4-column grid | 960px | 1:1 or 3:4 |
| 5-column grid | 768px | 1:1 |
| 6-column grid | 640px | 1:1 |
| Standing person | 1280-1600px | 2:3 or 3:4 |
| Google schema | 1200px | 1:1, 4:3, 16:9 (all three) |
| Logo | SVG or 800px | Any |
| Favicon | 512px | 1:1 |

**When in doubt:** Bigger is better. We can scale down but cannot scale up.
