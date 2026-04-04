# CSS Tokens Template

## tokens.css

```css
/* src/styles/tokens.css */
/* Generated for [PROJECT NAME] */
/* Primary: #XXXXXX | Accent: #XXXXXX */

:root {
  /* ============================================
     PRIMARY COLOR SCALE
     ============================================ */
  --color-primary: #1C202F;
  --color-primary-50: #f5f6f8;
  --color-primary-100: #e8eaef;
  --color-primary-200: #d1d5df;
  --color-primary-300: #a9b1c4;
  --color-primary-400: #7d89a3;
  --color-primary-500: #5c6a88;
  --color-primary-600: #4a5672;
  --color-primary-700: #3d475d;
  --color-primary-800: #353d4f;
  --color-primary-900: #1C202F;
  --color-primary-950: #12151d;
  
  /* ============================================
     ACCENT COLOR (CTAs)
     ============================================ */
  --color-accent: #FF6B35;
  --color-accent-hover: #E55A2B;
  --color-accent-light: #FFF0EB;
  
  /* ============================================
     NEUTRAL SCALE
     ============================================ */
  --color-neutral-50: #fafafa;
  --color-neutral-100: #f5f5f5;
  --color-neutral-200: #e5e5e5;
  --color-neutral-300: #d4d4d4;
  --color-neutral-400: #a3a3a3;
  --color-neutral-500: #737373;
  --color-neutral-600: #525252;
  --color-neutral-700: #404040;
  --color-neutral-800: #262626;
  --color-neutral-900: #171717;
  
  /* ============================================
     SEMANTIC COLORS
     ============================================ */
  --color-success: #22c55e;
  --color-error: #ef4444;
  --color-warning: #f59e0b;
  
  /* ============================================
     TYPOGRAPHY - FLUID SCALE
     ============================================ */
  --font-xs: clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem);     /* 12-14px */
  --font-sm: clamp(0.875rem, 0.8rem + 0.35vw, 1rem);        /* 14-16px */
  --font-base: clamp(1rem, 0.9rem + 0.5vw, 1.125rem);       /* 16-18px */
  --font-lg: clamp(1.125rem, 1rem + 0.6vw, 1.25rem);        /* 18-20px */
  --font-xl: clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem);       /* 20-24px */
  --font-2xl: clamp(1.5rem, 1.2rem + 1.5vw, 2rem);          /* 24-32px */
  --font-3xl: clamp(1.875rem, 1.4rem + 2.4vw, 2.5rem);      /* 30-40px */
  --font-4xl: clamp(2.25rem, 1.6rem + 3.2vw, 3rem);         /* 36-48px */
  --font-5xl: clamp(3rem, 2rem + 5vw, 4rem);                /* 48-64px */
}
```

## Import in Astro

```astro
---
// src/layouts/BaseLayout.astro
---
<html>
  <head>
    <link rel="stylesheet" href="/styles/tokens.css" />
  </head>
</html>
```

Or import in global CSS:

```css
/* src/styles/global.css */
@import './tokens.css';
```

## Usage Examples

### Correct ✅

```astro
<h1 class="text-4xl md:text-5xl text-primary-900 font-bold">
  Headline
</h1>

<p class="text-base text-primary-700">
  Body text
</p>

<button class="bg-accent hover:bg-accent-hover text-white">
  CTA
</button>

<section class="bg-primary-100 py-12 md:py-20">
  Content
</section>
```

### Forbidden ❌

```astro
<!-- FAIL: Hardcoded color -->
<h1 class="text-[#1C202F]">Bad</h1>

<!-- FAIL: Arbitrary spacing -->
<div class="mt-[23px]">Bad</div>

<!-- FAIL: Fixed font size -->
<p class="text-[18px]">Bad</p>

<!-- FAIL: Inline style -->
<div style="background: #FF6B35">Bad</div>
```

## Contrast Verification

| Combo | Foreground | Background | Ratio | Pass |
|-------|------------|------------|-------|------|
| Body on white | primary-900 | white | 15.8:1 | ✅ AA |
| Body on light | primary-900 | primary-100 | 12.1:1 | ✅ AA |
| Body on dark | white | primary-900 | 15.8:1 | ✅ AA |
| CTA text | white | accent | 4.5:1 | ✅ AA |
| Link | accent | white | 4.5:1 | ✅ AA |

**Test at:** https://webaim.org/resources/contrastchecker/

## Industry Presets

### Home Services (Removals, Cleaning, Trades)
```css
--color-primary: #1C202F;  /* Dark slate */
--color-accent: #FF6B35;   /* Orange */
```

### Professional (Law, Finance)
```css
--color-primary: #1e3a5f;  /* Navy */
--color-accent: #c9a227;   /* Gold */
```

### Healthcare
```css
--color-primary: #0d9488;  /* Teal */
--color-accent: #22c55e;   /* Green */
```

### Tech / Modern
```css
--color-primary: #0f172a;  /* Slate */
--color-accent: #3b82f6;   /* Blue */
```
