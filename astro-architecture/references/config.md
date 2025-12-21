# Config Templates

## site.ts

```typescript
// src/config/site.ts
export const site = {
  // Business info (REQUIRED in footer)
  name: "Business Name",
  tagline: "Short tagline",
  phone: "+44 XXX XXX XXXX",
  email: "info@example.com",
  address: "123 High Street, Bristol, BS1 1AA",
  
  // Brand colors
  colors: {
    primary: "#1C202F",
    secondary: "#E5F2FF", 
    accent: "#FF6B35",
  },
  
  // i18n
  defaultLocale: 'en' as const,
  locales: ['en', 'hu'] as const,
  
  // Social proof
  social: {
    google: { rating: 4.9, count: 270, url: "https://g.page/..." },
  },
  
  // WhatsApp
  whatsapp: {
    number: "44XXXXXXXXXX",
    message: "Hi, I'd like a quote for...",
  },
  
  // GTM & Analytics
  gtm: {
    id: "GTM-XXXXXXX",
  },
  
  // Default meta (fallback)
  meta: {
    title: "Business Name | Main Service in City",
    description: "150-160 char description with keywords",
    ogImage: "/og-image.jpg",
  },
} as const;

export type Site = typeof site;
export type Locale = typeof site.locales[number];
```

## astro.config.mjs

```javascript
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import partytown from '@astrojs/partytown';

export default defineConfig({
  site: 'https://example.com',
  output: 'hybrid',
  adapter: cloudflare({
    mode: 'directory',
    functionPerRoute: false,
  }),
  integrations: [
    tailwind({ applyBaseStyles: false }),
    sitemap({
      i18n: {
        defaultLocale: 'en',
        locales: { en: 'en', hu: 'hu' },
      },
    }),
    partytown({
      config: {
        forward: ['dataLayer.push'],
      },
    }),
  ],
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'hu'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  vite: {
    build: { sourcemap: false },
  },
});
```

## tailwind.config.mjs

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--color-primary)',
          foreground: 'var(--color-primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--color-secondary)',
          foreground: 'var(--color-secondary-foreground)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          foreground: 'var(--color-accent-foreground)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
```

## tsconfig.json

```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    },
    "types": ["@cloudflare/workers-types"]
  }
}
```

## global.css

```css
/* src/styles/global.css */
@import './fonts.css';

@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --color-primary: #1C202F;
  --color-primary-foreground: #FFFFFF;
  --color-secondary: #E5F2FF;
  --color-secondary-foreground: #1C202F;
  --color-accent: #FF6B35;
  --color-accent-foreground: #FFFFFF;
}

@layer base {
  html {
    scroll-behavior: smooth;
    scroll-padding-top: 80px;
  }
  
  @media (prefers-reduced-motion: reduce) {
    html {
      scroll-behavior: auto;
    }
  }
  
  body {
    @apply font-sans text-gray-900 antialiased;
  }
}

@layer components {
  .btn {
    @apply inline-flex items-center justify-center px-6 py-3 
           font-semibold rounded-lg transition-all duration-200
           focus:outline-none focus:ring-2 focus:ring-offset-2;
  }
  
  .btn-primary {
    @apply bg-primary text-white hover:bg-primary/90 
           focus:ring-primary;
  }
  
  .btn-secondary {
    @apply bg-secondary text-primary hover:bg-secondary/80 
           focus:ring-secondary;
  }
  
  .container {
    @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8;
  }
}

@layer utilities {
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
}
```

## .env.example

```bash
# Email (Resend or Brevo)
RESEND_API_KEY=re_xxxxx

# Turnstile (Cloudflare CAPTCHA)
TURNSTILE_SECRET_KEY=0x4AAA...
PUBLIC_TURNSTILE_SITE_KEY=0x4AAA...

# Google Sheets (optional)
GOOGLE_SHEETS_ID=xxxxx
GOOGLE_SERVICE_ACCOUNT_EMAIL=xxx@xxx.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
```

## package.json (partial)

```json
{
  "name": "project-name",
  "type": "module",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview"
  },
  "dependencies": {
    "@astrojs/cloudflare": "latest",
    "@astrojs/partytown": "latest",
    "@astrojs/sitemap": "latest",
    "@astrojs/tailwind": "latest",
    "astro": "latest",
    "tailwindcss": "latest",
    "zod": "latest"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "latest",
    "typescript": "latest"
  }
}
```

## OG Image

Create `public/og-image.jpg`:
- Size: 1200×630px
- Include: Logo, tagline, brand colors
- Keep text minimal
- Test on Facebook Sharing Debugger
