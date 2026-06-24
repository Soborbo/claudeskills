# astro-images v3.0 → v3.1 — patch overlay

This bundle is an **overlay**: drop these files onto the existing `astro-images/`
folder in the `Soborbo/claudeskills` repo (overwrite the modified ones, add the new
ones), commit, then re-upload the folder to Claude Skills. (Direct repo write was
blocked — the GitHub connector is read-only for this repo — so apply it manually.)

## Modified (overwrite)
- `SKILL.md` — v3.1.0. Per-format quality, alpha-aware fallback, Art Direction section,
  fixed LCP/Preload section, Image SEO section, `og:image:type`, real Validation greps.
- `rules.json` — v3.1.0. Per-format `quality`, new rules (seo-filename, alt-seo-quality,
  per-format-quality, alpha-aware-fallback, art-direction-single-download,
  no-fixed-width-preload, og-format-jpg, no-single-size-content, no-raw-raster-img,
  robots-allow-astro), real `validation` greps.
- `assets/boilerplate/config/image-patterns.ts` — adds `QUALITY` export {avif:50, webp:60, jpg:62, png:80}.
- `assets/boilerplate/components/Picture.astro` — rewritten to `getImage()` per format with
  per-format quality + alpha-aware JPG/PNG fallback (`transparent` prop) + responsive fallback srcset.

## New (add)
- `assets/boilerplate/components/ArtPicture.astro` — art-direction component
  (`<source media>` per breakpoint × format → exactly one download).
- `assets/boilerplate/scripts/optimize-images.mjs` — canonical `/public/` preprocessor:
  per-format quality (AVIF q50, effort 5) + alpha-aware fallback + incremental (mtime) + `--force`.
- `REMEDIATION_PROMPT.md` — the single prompt to run (Claude Code) on any site to fix
  all image defects: AVIF>WebP, OG format/404, PNG-for-photos, single-size, raw `<img>`,
  preload, image SEO.

## Breaking change (call sites)
`quality` on `<Picture>` / `ArtPicture` went from `number` (v3.0) to per-format
(`quality={{ avif: 45 }}`). A bare number is still accepted and applied to all formats
(back-compat shim), so old `quality={60}` call sites keep working instead of silently
losing the override — but migrate them to the object form. Drop `'jpg'` from any
`formats={[...]}`: the JPG/PNG fallback is now automatic and alpha-aware (`'jpg'`/`'png'`
in `formats` are filtered out, not errors).

## Post-review fixes (applied in this revision)
- **Picture/ArtPicture `quality`**: accept `number | object`; a number maps to all formats
  (no more silently-dropped `quality={60}`). `formats` filters non-modern entries.
- **ArtPicture layout**: `class` now lands on the painted `<img>` and `<picture>` is
  `display:contents`, so `w-full` / `aspect-*` / `object-cover` actually size the image
  (per-breakpoint aspect prevents CLS). Previously they sat on `<picture>` and were inert.
- **optimize-images.mjs `--clean`**: now actually deletes `OUT_DIR` before regenerating
  (purges stale variants); `--force` regenerates in place. Documents the `sharp` dep.
- **Docs**: `og:image:type` must match the OG file (PNG default → `image/png`); the
  `og:image:type` validation grep widened from `src/layouts` to `src`; the AVIF<WebP
  spot-check is marked non-auto-runnable in `rules.json`.

## Unchanged (NOT in this bundle — keep your existing copies)
`FixedImage.astro`, `lib/og-image.ts`, `IMAGE_GUIDE.md`, `README.md`, `AUDIT_PROMPT.md`.

## After applying
1. Add to each site's `package.json` (only if using `/public/` sets):
   ```json
   "scripts": {
     "images": "node scripts/optimize-images.mjs",
     "images:force": "node scripts/optimize-images.mjs --force"
   }
   ```
2. Because AVIF quality changed (60 → 50), regenerate with a full rebuild:
   `npm run images:force`.
3. Run `REMEDIATION_PROMPT.md` per site, then the Validation block in `SKILL.md`.

## Root cause (why the audit found defects on an astro-images site)
- The shared `quality=60` for AVIF and WebP lived in **both** the component and the
  manual `optimize-images.mjs` — so the skill itself taught "AVIF q == WebP q" (audit A)
  and "keep source format → PNG fallback for photos" (audit C). Fixed in both.
- The skill had prose "Forbidden" rules for OG format, single-size, and raw `<img>`,
  but the `validation` block never grepped for them — rules without enforcement allowed
  drift (audit B, D, E). `validation` is now real greps.
