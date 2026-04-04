# Font Loading

## Self-Host Fonts

Always self-host. Never use Google Fonts CDN (extra DNS lookup + privacy).

```astro
---
// In BaseLayout.astro — font name comes from siteConfig.fonts
---
<link rel="preload" as="font" type="font/woff2" href="/fonts/{body-font}-var.woff2" crossorigin>
```

## Font-Display Strategy

**Not all fonts are equal.** Apply different strategies based on criticality:

### Primary font (body text, headings) — `font-display: swap`

This font is critical for readability. Preload it and use swap:

```css
/* Font family name comes from siteConfig.fonts.body / siteConfig.fonts.heading */
@font-face {
  font-family: 'BodyFont'; /* Replace with siteConfig.fonts.body value */
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
  src: url('/fonts/body-font-var.woff2') format('woff2');
}
```

```html
<link rel="preload" as="font" type="font/woff2" href="/fonts/body-font-var.woff2" crossorigin>
```

### Non-critical variants (italic, display, decorative) — `font-display: optional` + lazy CSS

These fonts are NOT needed for initial render. Loading them in the main CSS adds them to the critical path chain (HTML → CSS → font = +300-500ms LCP).

**Step 1:** Move the @font-face to a separate CSS file:
```css
/* /public/fonts/body-font-italic.css */
@font-face {
  font-family: 'BodyFont'; /* Same family as primary */
  font-style: italic;
  font-weight: 100 900;
  font-display: optional;
  src: url('/fonts/body-font-var-italic.woff2') format('woff2');
}
```

**Step 2:** Load it non-blockingly in the Layout:
```html
<link rel="stylesheet" href="/fonts/body-font-italic.css" media="print" onload="this.media='all'">
<noscript><link rel="stylesheet" href="/fonts/body-font-italic.css"></noscript>
```

**Do NOT preload non-critical font files** — preloading defeats the purpose of lazy loading.

## Decision Table

| Font variant | font-display | Preload? | In main CSS? |
|-------------|-------------|----------|-------------|
| Primary (regular) | swap | YES | YES |
| Primary (bold) | swap | Only if above-fold | YES |
| Italic | optional | NO | NO — separate lazy CSS |
| Display/decorative | optional | NO | NO — separate lazy CSS |
| Heading font (if different) | swap | YES | YES |

## Subset Fonts

```bash
# Only include characters you need — use the actual font file from siteConfig.fonts
npx glyphhanger --whitelist="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,!?@£$%&()+-=:;'\"" --subset=YourFont.ttf
```

## Variable Fonts

Use variable fonts instead of multiple weight files:
- `FontName-var.woff2` instead of `FontName-400.woff2` + `FontName-700.woff2`
- Reduces total font payload by 40-60%

## Forbidden

- Google Fonts CDN (`fonts.googleapis.com`)
- Non-critical font variants in render-blocking CSS
- `font-display: block` (blocks rendering up to 3s)
- Preloading fonts that are loaded via lazy CSS
- More than 2 font families per site
