# Performance: our decisions

Measure first with the `web-perf` skill (DevTools trace, insights, CrUX). Field data decides;
a single lab Lighthouse run moves by several points between runs, so compare medians.
This file lists only what is specific to our sites.

## Fonts: Astro Fonts API, self-hosted

Use the built-in Fonts API (top-level `fonts` in `astro.config.mjs` + `<Font />` from
`astro:assets`). It downloads the files at build, serves them from our domain, and
generates fallback metrics, which removes the font-swap layout shift we used to fight with
hand-written `@font-face` + `preload` + `media="print" onload` tricks.

```js
import { defineConfig, fontProviders } from 'astro/config';
export default defineConfig({
  fonts: [{
    provider: fontProviders.google(),   // or fontsource(); both self-host at build
    name: 'Inter',
    cssVariable: '--font-inter',
    subsets: ['latin', 'latin-ext'],    // latin-ext carries ő/ű for Hungarian sites
  }],
});
```
```astro
<Font cssVariable="--font-inter" preload />
```

- **Never load fonts from the Google Fonts CDN** (`fonts.googleapis.com` `<link>`): it sends
  every visitor's IP to Google before consent (a GDPR problem on UK and HU sites) and adds a
  third-party connection to the critical path. The Fonts API's google provider is fine
  because it self-hosts.
- Hungarian sites need `latin-ext`. The old glyphhanger whitelist was ASCII-only and cut
  ő/ű out of the subset; check any custom subsetting with a Hungarian test string.
- `preload` only the main body family; headings can swap.

## CSS

Tailwind 4 already ships only used utilities. Leave `build.inlineStylesheets` at `'auto'`,
or `'always'` to remove the render-blocking stylesheet request. Never a critical-CSS
extractor (`pitfalls.md` #7).

## Layout shift: SVG logos and review badges

The usual CLS source on our pages is review and trust logos (Google, Trustpilot, Yell,
Which?) as SVG `<img>` without `width`/`height`. Take the numbers from the SVG `viewBox`.
Find them with:
```bash
grep -rn --include='*.astro' -E '<img[^>]+\.svg' src/ | grep -v 'width='
```

## Cloudflare Tag Gateway (`/ry2s/`)

On sites using Google tag gateway through Cloudflare, Google's scripts are served from
our own domain under `/ry2s/`. Lighthouse then reports them as first-party unused JS.
That is tracking infrastructure, configured in the Cloudflare dashboard, not in the
repo: do not defer, rewrite or self-host those scripts in the HTML, and do not count them
against our own JS. `/ry2s/` is not Zaraz; they are separate products. Their cache
headers are set by the gateway.

## Third parties we cannot fix

Lighthouse "inefficient cache policy" on the tag gateway, Meta Pixel
(`connect.facebook.net`), CookieYes and the Cloudflare beacon is expected; their TTLs are
set by the vendor. Do not spend time on them. GTM loading and any delay are owned by the
tracking package (Soborbo/Serverside `soborbo-tracking`), not by the layout.

## Caching with `_headers`

`public/_headers` applies only to responses served by the asset layer, never to responses
the Worker renders (SSR pages, `/api/*`, the SSR 404). SSR security and cache headers belong
in `src/middleware.ts`. There is no `[[headers]]` section in the wrangler config.

- `/_astro/*` → `Cache-Control: public, max-age=31536000, immutable` (hashed names).
- `/img/*`, `/images/*` → cacheable but **not** immutable: the names are stable across
  regeneration, so immutable would pin a stale image.

## Which pages to test

Never just the homepage. Each type has its own failure:

- homepage;
- the longest service page (most content and images);
- an area/location page;
- the reviews page (large DOM from review cards);
- the calculator / quote page (most JS).

Typical subpage findings: a very large inline JSON-LD block, hundreds of review cards
rendered at once, a hero that is not marked `lcp`, many small `<style is:inline>` blocks
from repeated components.
