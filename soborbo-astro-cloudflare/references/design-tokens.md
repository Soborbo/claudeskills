# Design tokens

## Source of truth

`siteConfig` (`src/config/site.config.ts`) holds the brand: `brand.primary`, `secondary`,
`accent`, `dark`, `light`, optional `surface`, and `fonts.heading` / `fonts.body`. Changing
the look of a site means changing those values, not editing components. Import the real
config (`src/config`), never `siteConfig.example` or a sample file: the example ships
placeholder colours and ids to production.

In the leadgen template, `BaseLayout.astro` injects the values as `--brand-*` variables into
`:root`, and `src/styles/global.css` derives every scale from them, so one hex change moves
the whole palette. Read that file before adding tokens.

## Scale from one brand colour (Tailwind 4)

Tailwind 4 has no `tailwind.config.*` for tokens: theme values are CSS variables in an
`@theme` block, and only `@theme` variables create utilities (`bg-primary-600`). A variable
declared in plain `:root` is usable only as `var(...)`/arbitrary value. Tailwind's own
palette is OKLCH; mix in OKLab so tints and shades stay perceptually even (HSL lightness
steps drift on yellows and blues).

Pure-CSS generator, brand colour = the **500** step (the old HSL generator anchored
nothing, so the brand hex was not in its own scale). `@theme inline` is needed because the
values reference a variable that is injected at runtime:

```css
@import 'tailwindcss';

@theme inline {
  --color-primary-500: var(--brand-primary);
  --color-primary-50:  color-mix(in oklab, var(--brand-primary) 8%,  white);
  --color-primary-100: color-mix(in oklab, var(--brand-primary) 16%, white);
  --color-primary-200: color-mix(in oklab, var(--brand-primary) 32%, white);
  --color-primary-300: color-mix(in oklab, var(--brand-primary) 52%, white);
  --color-primary-400: color-mix(in oklab, var(--brand-primary) 76%, white);
  --color-primary-600: color-mix(in oklab, var(--brand-primary) 86%, black);
  --color-primary-700: color-mix(in oklab, var(--brand-primary) 72%, black);
  --color-primary-800: color-mix(in oklab, var(--brand-primary) 58%, black);
  --color-primary-900: color-mix(in oklab, var(--brand-primary) 44%, black);
  --color-primary-950: color-mix(in oklab, var(--brand-primary) 28%, black);
  /* repeat for secondary / accent */
}
```

If the brand colour is very light or very dark, a 500 anchor leaves one side of the scale
cramped. Then say so and ask whether the brand hex should sit on another step; do not
silently move it. (The template currently anchors primary at 600 and secondary at 700 in
`:root`; follow the project you are in and do not mix the two schemes in one site.)

## Fluid type scale

Put the type scale in the `--text-*` namespace so `text-lg` etc. become fluid:

```css
@theme {
  --text-sm:   clamp(0.875rem, 0.8rem + 0.35vw, 1rem);
  --text-base: clamp(1rem, 0.9rem + 0.5vw, 1.125rem);
  --text-lg:   clamp(1.125rem, 1rem + 0.6vw, 1.25rem);
  --text-xl:   clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem);
  --text-2xl:  clamp(1.5rem, 1.2rem + 1.5vw, 2rem);
  --text-3xl:  clamp(1.875rem, 1.4rem + 2.4vw, 2.5rem);
  --text-4xl:  clamp(2.25rem, 1.6rem + 3.2vw, 3rem);
  --text-5xl:  clamp(3rem, 2rem + 5vw, 4rem);
}
```

Keep the `rem` part in every `clamp()`: a pure `vw` size ignores browser zoom and fails
WCAG 1.4.4. Fonts come through `@theme inline { --font-heading: var(--font-<name>); }`
from the Astro Fonts API `cssVariable` (see `performance.md`).

## Using tokens

- Accent is for CTAs, links and highlights, not body text or large backgrounds. Dark
  steps (`primary-900`, `dark`) carry headings and body text; light steps (`primary-50/100`)
  are section backgrounds, not text.
- No raw hex or arbitrary values in components when a token exists. If no token fits,
  add one to the theme; an arbitrary value hides a design decision in one component.
- **Fixed variants.** Components have a closed set of variants (e.g. Button: primary,
  secondary, outline, ghost). Do not invent a new variant inside a page; if one is needed,
  add it to the component and its type first, so every page stays consistent.

## The contrast trap

The failures we actually shipped:

- White text on a mid-tone accent button (`#C4704B` with white = 3.2:1, below 4.5:1).
- `text-white/80` or `/75` on a coloured section: the opacity lowers contrast further.
- `text-gray-400` on white.

When a client's accent fails with white text, use a darker step for the button background
or dark text on the accent; tell the client rather than shipping the failing pair. Check
every new text/background pair produced by the scale, not just the brand hex.
