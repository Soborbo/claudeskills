# Desktop Header

```astro
---
import { site } from '@/config/site';
---

<header class="sticky top-0 z-50 bg-white shadow-sm">
  <div class="container mx-auto px-4">
    <div class="flex items-center justify-between h-16 md:h-20">
      <!-- Logo -->
      <a href="/" class="flex-shrink-0">
        <img src="/logo.svg" alt={site.name} class="h-8 md:h-10" width="120" height="40">
      </a>

      <!-- Desktop Nav -->
      <nav class="hidden md:flex items-center gap-8" aria-label="Main navigation">
        <a href="/" class="text-gray-700 hover:text-primary transition-colors">Home</a>
        <a href="/services" class="text-gray-700 hover:text-primary transition-colors">Services</a>
        <a href="/areas" class="text-gray-700 hover:text-primary transition-colors">Areas</a>
        <a href="/about" class="text-gray-700 hover:text-primary transition-colors">About</a>
        <a href="/contact" class="text-gray-700 hover:text-primary transition-colors">Contact</a>
      </nav>

      <!-- Desktop CTA -->
      <div class="hidden md:flex items-center gap-4">
        <a href={`tel:${site.phone.replace(/\s/g, '')}`} class="text-primary font-semibold">
          {site.phone}
        </a>
        <a href="/quote" class="btn btn-primary">
          Free Quote
        </a>
      </div>

      <!-- Mobile Menu Button -->
      <button
        type="button"
        class="md:hidden p-2 -mr-2"
        aria-expanded="false"
        aria-controls="mobile-menu"
        aria-label="Open menu"
        id="mobile-menu-button"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
        </svg>
      </button>
    </div>
  </div>
</header>
```
