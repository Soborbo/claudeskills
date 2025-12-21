# Tailwind Config Template

## Full Configuration

```javascript
// tailwind.config.mjs
import defaultTheme from 'tailwindcss/defaultTheme';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // Primary brand color with full scale
        primary: {
          DEFAULT: 'var(--color-primary)',
          50: 'var(--color-primary-50)',
          100: 'var(--color-primary-100)',
          200: 'var(--color-primary-200)',
          300: 'var(--color-primary-300)',
          400: 'var(--color-primary-400)',
          500: 'var(--color-primary-500)',
          600: 'var(--color-primary-600)',
          700: 'var(--color-primary-700)',
          800: 'var(--color-primary-800)',
          900: 'var(--color-primary-900)',
          950: 'var(--color-primary-950)',
        },
        // Accent/CTA color
        accent: {
          DEFAULT: 'var(--color-accent)',
          hover: 'var(--color-accent-hover)',
          light: 'var(--color-accent-light)',
        },
        // Semantic colors
        success: 'var(--color-success)',
        error: 'var(--color-error)',
        warning: 'var(--color-warning)',
      },
      fontFamily: {
        sans: ['Inter Variable', ...defaultTheme.fontFamily.sans],
        heading: ['Inter Variable', ...defaultTheme.fontFamily.sans],
      },
      fontSize: {
        xs: ['var(--font-xs)', { lineHeight: '1.5' }],
        sm: ['var(--font-sm)', { lineHeight: '1.5' }],
        base: ['var(--font-base)', { lineHeight: '1.6' }],
        lg: ['var(--font-lg)', { lineHeight: '1.5' }],
        xl: ['var(--font-xl)', { lineHeight: '1.4' }],
        '2xl': ['var(--font-2xl)', { lineHeight: '1.3' }],
        '3xl': ['var(--font-3xl)', { lineHeight: '1.2' }],
        '4xl': ['var(--font-4xl)', { lineHeight: '1.1' }],
        '5xl': ['var(--font-5xl)', { lineHeight: '1.1' }],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '30': '7.5rem',
      },
      maxWidth: {
        'content': '65ch',
        'wide': '75ch',
      },
      borderRadius: {
        'DEFAULT': '0.5rem',
        'card': '0.75rem',
        'button': '0.5rem',
      },
      boxShadow: {
        'card': '0 2px 8px -2px rgb(0 0 0 / 0.1), 0 4px 12px -4px rgb(0 0 0 / 0.08)',
        'card-hover': '0 4px 12px -2px rgb(0 0 0 / 0.12), 0 8px 24px -4px rgb(0 0 0 / 0.1)',
        'button': '0 2px 4px 0 rgb(0 0 0 / 0.1)',
        'button-hover': '0 4px 8px 0 rgb(0 0 0 / 0.15)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'fade-up': 'fadeUp 0.4s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-10px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
      transitionDuration: {
        DEFAULT: '200ms',
      },
      transitionTimingFunction: {
        DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
};
```

## CSS Variables File

```css
/* src/styles/tokens.css */
:root {
  /* Primary color scale - REPLACE with generated values */
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
  
  /* Accent color */
  --color-accent: #FF6B35;
  --color-accent-hover: #E55A2B;
  --color-accent-light: #FFF0EB;
  
  /* Semantic */
  --color-success: #22c55e;
  --color-error: #ef4444;
  --color-warning: #f59e0b;
  
  /* Typography - Fluid scale */
  --font-xs: clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem);
  --font-sm: clamp(0.875rem, 0.8rem + 0.35vw, 1rem);
  --font-base: clamp(1rem, 0.9rem + 0.5vw, 1.125rem);
  --font-lg: clamp(1.125rem, 1rem + 0.6vw, 1.25rem);
  --font-xl: clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem);
  --font-2xl: clamp(1.5rem, 1.2rem + 1.5vw, 2rem);
  --font-3xl: clamp(1.875rem, 1.4rem + 2.4vw, 2.5rem);
  --font-4xl: clamp(2.25rem, 1.6rem + 3.2vw, 3rem);
  --font-5xl: clamp(3rem, 2rem + 5vw, 4rem);
}

/* Dark mode support (optional) */
@media (prefers-color-scheme: dark) {
  :root {
    /* Override for dark mode if needed */
  }
}
```

## Usage in Components

```astro
---
// Example component using tokens
---

<section class="bg-primary-100 py-12 md:py-20">
  <div class="container mx-auto px-4 md:px-8">
    <h2 class="text-3xl md:text-4xl font-bold text-primary-900">
      Section Title
    </h2>
    <p class="text-base text-primary-700 mt-4 max-w-content">
      Body text using tokens.
    </p>
    <button class="bg-accent hover:bg-accent-hover text-white px-6 py-3 rounded-button shadow-button hover:shadow-button-hover transition-all">
      Call to Action
    </button>
  </div>
</section>
```

## Container Settings

```javascript
// Add to tailwind.config.mjs theme.extend
container: {
  center: true,
  padding: {
    DEFAULT: '1rem',
    sm: '2rem',
    lg: '4rem',
    xl: '5rem',
  },
  screens: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
  },
},
```
