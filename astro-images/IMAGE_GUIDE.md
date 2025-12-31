# Image Preparation Guide

A simple guide for preparing images before sending them for your website. Following these guidelines ensures your site loads fast and looks sharp on all devices.

> **Why these exact sizes?** Each image type below maps directly to our system patterns (Hero, Content, Thumbnail). These sizes are calculated to serve the right image to every device — from phones to 4K monitors. Please follow the size rules exactly.

---

## Quick Reference

| Image Type | System Pattern | Minimum Size | Format | Aspect Ratio |
|------------|----------------|--------------|--------|--------------|
| Hero/Banner | HERO | 2560 × 1440 | JPG | 16:9 |
| Content/Blog | CONTENT | 1920 × 1280 | JPG | 3:2 or 16:9 |
| Thumbnail/Card | THUMBNAIL | 800 × 600 | JPG | 4:3 |
| Logo | FIXED | 400 × 200 | SVG or PNG | Your ratio |
| Favicon | FIXED | 512 × 512 | PNG | 1:1 (square) |

---

## Hero Images (Main Banners)

**System pattern:** HERO

These are the large, eye-catching images at the top of pages.

**Requirements:**
- **Minimum width:** 2560 pixels
- **Aspect ratio:** 16:9 (widescreen) or 21:9 (ultra-wide)
- **Format:** JPG (photographs) or PNG (graphics with text)
- **File size:** Under 2 MB before optimization

**Why 2560px?**  
Modern screens (including laptops and 4K monitors) display your hero at up to 2560 pixels wide. Providing this size ensures crisp display on all devices.

**Tips:**
- Avoid text baked into the image (we add text via code for SEO)
- Keep important content centered (edges may crop on mobile)
- High contrast works best for readability with overlaid text

---

## Content Images (Blog Posts, Articles)

**System pattern:** CONTENT

Images within your page content, articles, or service descriptions.

**Requirements:**
- **Minimum width:** 1920 pixels
- **Aspect ratio:** 3:2, 4:3, or 16:9
- **Format:** JPG
- **File size:** Under 1 MB before optimization

**Why 1920px?**  
Content images display at around 720-960 pixels on desktop. The larger source allows us to serve sharp images to high-resolution (Retina) screens.

**Tips:**
- Landscape orientation works best for most layouts
- Portrait images are fine but may display smaller
- Consistent aspect ratio across a set looks more professional

---

## Thumbnails & Card Images

**System pattern:** THUMBNAIL

Small preview images for grids, cards, team members, portfolios.

**Requirements:**
- **Minimum width:** 800 pixels
- **Recommended:** 1200 pixels (for retina)
- **Aspect ratio:** 4:3 or 1:1 (square)
- **Format:** JPG
- **File size:** Under 500 KB before optimization

**Tips:**
- Use consistent aspect ratio across all cards in a set
- Center the subject (faces, products) for automatic cropping
- Square (1:1) works well for team photos and avatars

---

## Logos

**System pattern:** FIXED

Your brand logo for header, footer, and meta images.

**Requirements:**
- **Preferred format:** SVG (scales perfectly to any size)
- **Fallback format:** PNG with transparency
- **Minimum width:** 400 pixels (for PNG)
- **Recommended:** 800 pixels (for PNG)

**Why SVG?**  
SVG files are vector graphics — they stay perfectly sharp at any size and have tiny file sizes. Always provide SVG if you have it.

**What we need:**
1. **Primary logo** — full color, horizontal layout
2. **White version** — for dark backgrounds (if applicable)
3. **Icon only** — square mark without text (for favicon)

**File naming:**
```
logo.svg              (primary)
logo-white.svg        (white version)
logo-icon.svg         (icon/mark only)
logo.png              (fallback if no SVG)
```

---

## Favicon

The small icon that appears in browser tabs.

**Requirements:**
- **Size:** 512 × 512 pixels
- **Format:** PNG with transparency
- **Shape:** Square, but design can be any shape within

We will generate all required sizes (16×16, 32×32, 180×180, etc.) from your 512px source.

---

## File Formats Explained

| Format | Best For | Supports Transparency |
|--------|----------|----------------------|
| **JPG** | Photographs, complex images | No |
| **PNG** | Graphics, logos, screenshots | Yes |
| **SVG** | Logos, icons, illustrations | Yes |
| **WebP/AVIF** | We convert to these automatically | Yes |

**Rule of thumb:**
- Photos → JPG
- Graphics with transparency → PNG
- Logos and icons → SVG
- Never use BMP, TIFF, or GIF for website images

---

## Aspect Ratios Explained

| Ratio | Shape | Common Uses |
|-------|-------|-------------|
| 16:9 | Wide rectangle | Heroes, videos, banners |
| 4:3 | Standard rectangle | Cards, thumbnails |
| 3:2 | Photo standard | Blog images, galleries |
| 1:1 | Square | Avatars, team photos, Instagram-style |
| 21:9 | Ultra-wide | Cinematic banners |

**Important:** All images of the same type should use the SAME aspect ratio. Mixing ratios in a grid looks messy.

---

## How to Check Image Size

### On Mac:
1. Right-click the image file
2. Click "Get Info"
3. Look for "Dimensions" (e.g., 2560 × 1440)

### On Windows:
1. Right-click the image file
2. Click "Properties"
3. Click "Details" tab
4. Look for "Width" and "Height"

### Online:
Upload to [squoosh.app](https://squoosh.app) — it shows dimensions and lets you resize.

---

## How to Resize Images

If your image is too small (below minimum requirements):

**Option 1: Use original/source file**  
Check if you have a higher-resolution version (from camera, designer, or stock site).

**Option 2: Re-export from design software**  
If created in Canva, Figma, or Photoshop, export at the required size.

**Option 3: Download larger from stock sites**  
Stock photos usually offer multiple sizes. Choose the largest.

**⚠️ Do NOT upscale small images** — stretching a 500px image to 2560px creates blurry, unusable results. We cannot use upscaled images.

---

## File Naming

Use simple, descriptive names with hyphens:

**Good:**
```
hero-homepage.jpg
team-john-smith.jpg
service-web-design.jpg
logo.svg
```

**Bad:**
```
IMG_20240315_142536.jpg
Screenshot 2024-03-15.png
final_v2_FINAL_new (1).jpg
```

**Rules:**
- Lowercase only
- Hyphens between words (not spaces or underscores)
- Descriptive but short
- No special characters

---

## Sending Images

**Best methods:**
1. **Google Drive / Dropbox** — share a folder link
2. **WeTransfer** — for large batches
3. **Direct upload** — if we've set up a submission form

**Organize by type:**
```
/images
  /heroes
    hero-homepage.jpg
    hero-about.jpg
  /content
    blog-post-1.jpg
    service-image.jpg
  /team
    john-smith.jpg
    jane-doe.jpg
  /logos
    logo.svg
    logo-white.svg
    favicon.png
```

---

## Checklist Before Sending

- [ ] All hero images are at least 2560px wide
- [ ] All content images are at least 1920px wide
- [ ] All thumbnails are at least 800px wide
- [ ] Logo provided as SVG (or high-res PNG if no SVG)
- [ ] Favicon provided as 512×512 PNG
- [ ] Files are named descriptively (no IMG_12345.jpg)
- [ ] Images are organized in folders by type
- [ ] No upscaled/blurry images
- [ ] Consistent aspect ratios within each type

---

## Common Questions

**Q: Can I send iPhone photos?**  
Yes! iPhone photos are typically 4032 × 3024 pixels — more than enough. Just send the original, unedited file.

**Q: What about screenshots?**  
Screenshots are often too small and low-quality for hero images. They're fine for blog content showing software interfaces.

**Q: Do I need to optimize/compress images first?**  
No. We handle all optimization automatically. Send the highest quality originals you have.

**Q: Can I use images from Google?**  
Only if they're licensed for commercial use. Stock sites like Unsplash, Pexels, or purchased stock are safe. Random Google images are not.

**Q: What if I only have small images?**  
Let us know. We can either source alternatives, use AI upscaling (limited quality), or adjust the design to work with smaller images. We cannot use undersized images without quality loss.

**Q: Can I use GIFs or animated images?**  
We avoid animated images on websites as they hurt performance. If you need animation, we'll use video or other optimized formats instead.

---

## Summary

| Image Type | Pattern | Min Width | Format | Aspect Ratio |
|------------|---------|-----------|--------|--------------|
| Hero | HERO | 2560px | JPG | 16:9 |
| Content | CONTENT | 1920px | JPG | 3:2 / 16:9 |
| Thumbnail | THUMBNAIL | 800px | JPG | 4:3 / 1:1 |
| Logo | FIXED | 400px | SVG / PNG | Any |
| Favicon | FIXED | 512px | PNG | 1:1 |

**When in doubt:** bigger is better. We can always scale down, but we can't scale up.
