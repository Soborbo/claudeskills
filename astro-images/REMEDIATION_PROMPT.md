# astro-images — Full Remediation Prompt (v3.1)

Paste this into Claude Code (or similar) **from a site's repo root**. It fixes every
image defect the astro-images audit surfaces: AVIF-heavier-than-WebP, blank OG
previews, PNG fallback for photos, single-size images, raw-raster `<img>`,
fixed-width preload, and image SEO. Make **surgical** edits and **flag, don't guess**.

---

## 0. Orient (read before changing anything)
Read: `package.json` (build + image scripts), `astro.config.*`, `src/layouts/*.astro`,
every image component that exists (`Picture`, `ArtPicture`, `FixedImage`,
`OptimizedPicture`, `PictureImg`, …), the image preprocessor
(`scripts/optimize-images.mjs` or similar), `public/robots.txt`, and 2–3
representative pages. List **every** image pipeline in use and which files feed each.

## 1. AVIF quality — the biggest byte win (audit A)
**Cause:** one shared quality for AVIF and WebP. AVIF must use its OWN, lower quality.
- In the preprocessor (`optimize-images.mjs` / build script): set AVIF quality **~48–50**,
  `effort` 5–6; keep WebP ~60, JPG ~62.
- If images go through `<Picture>` / `getImage`, set **per-format quality**
  (the `QUALITY` map in `image-patterns.ts`), AVIF 50.
- **Regenerate:** `npm run images:force` (or the project's force regen).
- **REPORT** before/after bytes for 3 representative widths of one hero, and confirm
  **AVIF < WebP** at each. If any AVIF ≥ WebP, lower AVIF further and regen.

## 2. OG images → JPG + fix 404s + type meta (audit B)
**Cause:** per-page `ogImage` overrides in WebP/AVIF (blank social previews); some 404.
- Set every page's `ogImage` to a **JPG at a generated width** (or a dedicated
  1200×630 JPG per page). The default `og-default.png` is fine — only the overrides are wrong.
- Fix any `ogImage` pointing at a non-generated width/file (404).
- In the layout, ensure: `og:image` (jpg), `og:image:type` = `image/jpeg`,
  `og:image:width`/`height`, `twitter:image` (jpg).
- **Verify:** `grep -rEn 'ogImage.*\.(webp|avif)' src` → empty; each `ogImage` file exists.

## 3. Photo-PNG → JPG fallback, alpha-aware (audit C)
**Cause:** preprocessor keeps the source format → PNG fallback for opaque photos.
- In the preprocessor, choose the fallback by **alpha** (`sharp` `metadata.hasAlpha`):
  opaque → JPG, transparent → PNG. (`optimize-images.mjs` v3.1 already does this.)
- Optionally convert opaque photo-PNG **sources** to JPG to shrink the repo.
- Keep PNG only for true-alpha assets (logos, badges, transparent icons).
- Regen. **Verify:** `find dist -name "*.png" -not -path "*/icons/*" -not -path "*/svg/*"`
  → only legitimate alpha assets.

## 4. Consolidate single-size pipelines (audit D)
**Cause:** a secondary pipeline (e.g. a calculator `PictureImg`) emits fixed-size,
AVIF>WebP, no responsive srcset.
- Migrate those usages to the responsive component (`<Picture>` with a pattern),
  so they get srcset/sizes + per-format quality.
- Remove the bespoke single-size component once unused.

## 5. Raw raster `<img>` → pipeline / SVG (audit E)
- Logos/badges → SVG where available; otherwise `FixedImage`.
- Other raster content `<img>` → `<Picture>`.
- **Verify:** `grep -rEn '<img[^>]+\.(png|jpe?g)' src --include="*.astro" | grep -v FixedImage`
  → only external/SVG/flagged.

## 6. Preload — kill the LCP preload anti-pattern
- Remove fixed-width image preloads (`preloadImage="/img/x-480w.avif"` and the
  `<link rel=preload as=image href=…>` it emits).
- Rely on `lcp` (sets `fetchpriority=high`) on the single hero `<img>`; enforce **one `lcp` per page**.
- Only if a hero is discovered late (CSS background / JS-injected): add a **responsive**
  `<link rel=preload as=image type=image/avif imagesrcset=… imagesizes=…>` matching the picture.

## 7. Image SEO
- Rename image **source** files to kebab-case keyword-locality slugs (no `IMG_*`,
  no spaces, no generic `hero.jpg`); update imports. Astro keeps the basename in the URL.
- **Alt pass:** every content image has accurate, natural-keyword alt (no stuffing,
  no "image of", decorative `alt=""`). Where content/keyword/locality is unknown, **ASK** — don't invent.
- Add `<figure>`/`<figcaption>` where context helps; ensure the hero is in
  `ImageObject`/schema (coordinate with the `schema-audit` skill).
- Ensure `robots.txt` does **not** `Disallow: /_astro/`.

## 8. Verify (build + greps)
Run the build; it must pass. Then run the Validation block from `SKILL.md`.
Spot-check 2–3 built pages: hero `<img>` has `loading=eager` + `fetchpriority=high`,
AVIF < WebP, OG is JPG, no `-480w` preload, no opaque PNG.

## 9. Report
Per fix, list: files changed, **before/after bytes** (fix 1), OG fixes (incl. 404s),
fallback changes, consolidations, SEO renames + alt rewrites, and a **FLAGGED**
section needing human review. Facts only — no "opportunity" framing.

---

## Constraints
- Surgical diffs only. Don't restructure unrelated code.
- **Never** add a fixed-width image preload.
- When unsure whether something is the LCP, which crop is intended, or what alt to
  write → **FLAG, don't guess**.

## Quick command reference
```bash
npm run images:force     # regenerate /public/ sets after AVIF quality is lowered (fix 1 & 3)
npm run build            # must pass
# then run the Validation block from SKILL.md
```
