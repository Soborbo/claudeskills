# Font Loading Optimization

## Strategy: Self-Host + Subset

For best performance and old device compatibility:
1. Self-host fonts (no Google Fonts API)
2. Subset to used characters only
3. WOFF2 primary, WOFF fallback
4. `font-display: swap`

## File Structure

```
src/assets/fonts/
├── inter-latin.woff2
├── inter-latin.woff
├── inter-latin-ext.woff2    # Hungarian/Polish chars
└── inter-latin-ext.woff
```

## Font Face Declarations

```css
/* src/styles/fonts.css */

/* Latin subset - loads first */
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('/fonts/inter-400-latin.woff2') format('woff2'),
       url('/fonts/inter-400-latin.woff') format('woff');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, 
                 U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, 
                 U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}

/* Latin Extended - Hungarian, etc */
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('/fonts/inter-400-latin-ext.woff2') format('woff2'),
       url('/fonts/inter-400-latin-ext.woff') format('woff');
  unicode-range: U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, 
                 U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF;
}

/* Bold weight */
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url('/fonts/inter-700-latin.woff2') format('woff2'),
       url('/fonts/inter-700-latin.woff') format('woff');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, 
                 U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, 
                 U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
```

## Preload Critical Fonts

In BaseLayout `<head>`:

```astro
<!-- Preload only the most critical font file -->
<link 
  rel="preload" 
  href="/fonts/inter-400-latin.woff2" 
  as="font" 
  type="font/woff2" 
  crossorigin 
/>
```

Only preload ONE font file (the body text regular weight).

## Tailwind Config

```javascript
// tailwind.config.mjs
export default {
  theme: {
    fontFamily: {
      sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      heading: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
    },
  },
};
```

## Fallback Stack

Always include system fonts as fallback:

```css
font-family: 'Inter', 
             system-ui, 
             -apple-system, 
             BlinkMacSystemFont, 
             'Segoe UI', 
             Roboto, 
             'Helvetica Neue', 
             Arial, 
             sans-serif;
```

## Subsetting Fonts

Use `glyphhanger` or `fonttools` to subset:

```bash
# Install
npm install -g glyphhanger

# Subset to Latin + Latin Extended
glyphhanger --subset=inter.woff2 \
  --US_ASCII \
  --LATIN \
  --formats=woff2,woff \
  --output=src/assets/fonts/
```

## Hungarian Character Support

Hungarian needs these extra characters:
`Á á É é Í í Ó ó Ö ö Ő ő Ú ú Ü ü Ű ű`

Include `latin-ext` unicode range.

## Performance Checklist

- [ ] Fonts self-hosted (not Google Fonts API)
- [ ] WOFF2 format primary
- [ ] WOFF fallback for old browsers
- [ ] `font-display: swap` on all
- [ ] Only critical font preloaded
- [ ] Subset to used characters
- [ ] System font fallback stack
- [ ] Max 2-3 font weights total
