# Images

Canonical code: `Soborbo/leadgen-template-site` (read `origin/main`, not a stale clone).

| File | Role |
|---|---|
| `src/config/image-patterns.ts` | Patterns (widths, `sizes`) and per-format `QUALITY`. The single source; do not restate the numbers elsewhere. |
| `src/components/images/Picture.astro` | AVIF → WebP → JPG/PNG `<picture>`, per-format quality, alpha-aware fallback, `lcp`/`aboveFold` props. |
| `HeroImage`, `ContentImage`, `CardImage` | `Picture` with FULL / HALF / THIRD defaults. |
| `ArtPicture.astro` | Different image or crop per breakpoint, one download. |
| `FixedImage.astro` | Logos, avatars, icons at a fixed pixel size (1x/2x/3x). |
| `scripts/optimize-images.mjs` | `/public/` image sets (`public/img`), incremental, `--force`, `--clean`. |
| `scripts/generate-og-images.ts` + `src/lib/og-image.ts` | OG/social JPGs from each page's hero master. |
| `scripts/check-og-images.ts` | Fails the build if a page's `og:image`/`twitter:image` file is missing. |

On a site not cloned from the template, copy these files rather than writing new ones.
We keep our own `Picture` instead of Astro's built-in `layout`/`responsiveStyles` because
the built-in one uses a single quality for every format, which makes AVIF heavier than
WebP. Do not "modernise" it back.

## Build time, explicitly

Set `adapter: cloudflare({ imageService: 'compile' })`. The adapter default is
`cloudflare-binding` (runtime transforms through the Images binding, billed per use), and
Workers cannot run Sharp at runtime. `compile` processes images for prerendered routes at
build; on on-demand routes it is a passthrough, so images there are not optimised. Use
`cloudflare-binding` only when images arrive at runtime (user uploads).

## Quality per format

AVIF and WebP quality scales are not comparable. With one shared value (the old
`quality={60}` everywhere) AVIF came out **larger** than WebP. AVIF q50 looks like WebP q60
and is clearly smaller; heavy heroes can go to AVIF 45-48. JPG is the opaque fallback, PNG
only for transparent sources. Never PNG for an opaque photo; never GIF/APNG (use `<video>`).
After changing quality, regenerate with `--force` and check that AVIF < WebP at the same
width for a hero.

## Patterns

Pattern = rendered width, independent of aspect ratio. Every pattern includes 480w,
because it is the width most phones actually request. Map the layout, not the image:
full-bleed hero → FULL; 66/33 → TWO_THIRDS; 60/40 → LARGE; 50/50 and checkerboard → HALF;
50% card with max-height → HALF_CARD; 40/60 → SMALL; 3/4/5/6 columns → THIRD/QUARTER/
FIFTH/SIXTH; logo/avatar/icon → FixedImage. Unknown layout → HALF. `sizes` follows the
**layout** breakpoint (`lg`, 1024px), not the header breakpoint. A master smaller than the
pattern's `minSourceWidth` will look soft on large screens: ask for a bigger original
rather than upscaling.

## One download per slot

- Same image, different size → `<Picture>` (already one download).
- Different image or crop per breakpoint → `ArtPicture`; set `aspect-ratio` per breakpoint
  in `class`, since one width/height cannot cover both.
- Never two `<img>` with `hidden md:block`: `display:none` images still download.
- Checkerboard sections: one image per row, desktop alternation via CSS `order`; on mobile
  the image is always on top (image first in the DOM).

## LCP

One hero per page gets `lcp` (eager + `fetchpriority="high"`); 2-3 above-fold images get
`aboveFold`; everything else stays lazy. Do not add a fixed-width `<link rel="preload">`
for the hero: it rarely matches the width the browser picks (wasted download or a blurry
swap), and hashed `/_astro/` names will not match it. An `<img>` in the initial HTML is
found by the preload scanner anyway. Only a late-discovered hero (CSS background,
JS-injected) gets a preload, and then a responsive one with `imagesrcset`/`imagesizes`
identical to the picture.

## Face focus

Person in frame → `object-position: center 20%` (`class="object-[center_20%]"` or the
`objectPosition` prop). No clear focal point → center. Several people, subject at the edge,
or unsure → ask; do not guess.

## Alt text and file names

- Every content image has `alt`; decorative ones `alt=""`. Describe what is in the picture
  in plain language; a keyword or place name only where it fits naturally. No "image of".
- If you do not know what the image shows, or the page's keyword and locality, ask. Do
  not invent a location or a job that is not in the picture.
- Astro keeps the source basename in the served URL, so name masters as kebab-case
  keyword-locality slugs before import (`bristol-removals-van.jpg`, not `IMG_2041.jpg`).
- `robots.txt` must not block `/_astro/` or the image directories.

## OG images

Social cards must be JPG (or PNG); WebP/AVIF previews render blank on several platforms.
`generate-og-images.ts` writes all variants (1200×630 og, 1200×600 twitter, schema 16:9,
4:3, 1:1) to `public/images/og/` from the page's hero master. `og:image:type`,
`og:image:width` and `og:image:height` must describe the actual file; a `og-default.png`
fallback needs `image/png`. Never point a per-page override at a WebP/AVIF or at a width
that was not generated.

## The `/public/` preprocessor and its `--clean` trap

`optimize-images.mjs` reads masters from `IMG_SRC` (default `src/assets/images`) and writes
`${slug}-${w}w.{avif,webp,jpg|png}` to `IMG_OUT` (default `public/img`). Masters live in the
private repo and are never deleted; the output is disposable and 100% script-generated, so
never hand-place files in `public/img`.

- Default run is incremental (mtime). `--force` regenerates in place after a quality,
  format, width-ladder or Sharp change.
- `--clean` **deletes the whole `IMG_OUT`** first. On a site migrated from an older setup,
  where some files in `public/img` have no master in `IMG_SRC`, those images are gone.
  Use `--clean` only when every output has a master; until then use `--force`.
- Sharp is why the Windows lockfile pitfall hits these projects (`pitfalls.md` #9).

## Post-build image check (to add to each site)

`check-og-images.ts` covers social cards only. Every site should also run a
`check-images` step after `astro build`, in CI, scanning the **prerendered** HTML in `dist`
(zero pages scanned = failure, like `check-og-images`). It is not in the template yet; when
you add it, model it on `check-og-images.ts` and check:

1. **Every referenced image exists** in the build output: `<img src>`, every `srcset`
   candidate, `<source srcset>`, and `og:image`. A 404 image is invisible in review.
2. **Every `<img>` has `width` and `height`** (or the `<picture>` carries an
   `aspect-ratio`), including SVG logos; otherwise layout shift.
3. **Every `<img>` has an `alt` attribute**; empty is allowed only for decorative images,
   so report empty alts for a human to confirm rather than failing on them.
4. **No file is unreasonably large for its slot:** flag an AVIF that is not smaller than the
   WebP of the same width, an opaque PNG photo, and any image above a byte budget set in
   the project (not in this skill; the numbers belong to the client's pages).
5. **The hero is not lazy:** the first `<img>` in `<main>` (or the one marked as LCP) must
   not have `loading="lazy"`, and only one image per page has `fetchpriority="high"`.
