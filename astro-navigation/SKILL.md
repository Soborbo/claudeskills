---
name: astro-navigation
description: Navigation patterns for Astro sites. Header, footer, mobile menu, breadcrumbs, skip links. Use for all navigation implementation.
---

# Astro Navigation Skill

## Purpose

Provides navigation patterns for lead generation sites. Mobile-first, accessible, conversion-focused.

## Core Rules

1. **Mobile-first** — Design for 375px, enhance for desktop
2. **Phone prominent** — Click-to-call in header on mobile
3. **CTA visible** — Primary CTA always accessible
4. **Accessible** — Keyboard navigable, screen reader friendly
5. **Fast** — No layout shift on menu toggle

## Header Structure

### Desktop Header

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

### Mobile Menu

```astro
<!-- Mobile Menu Overlay -->
<div
  id="mobile-menu"
  class="fixed inset-0 z-50 hidden"
  aria-hidden="true"
>
  <!-- Backdrop -->
  <div class="absolute inset-0 bg-black/50" id="mobile-menu-backdrop"></div>

  <!-- Menu Panel -->
  <nav
    class="absolute right-0 top-0 bottom-0 w-80 max-w-full bg-white shadow-xl transform translate-x-full transition-transform duration-300"
    aria-label="Mobile navigation"
  >
    <div class="flex items-center justify-between p-4 border-b">
      <span class="font-semibold">Menu</span>
      <button
        type="button"
        class="p-2 -mr-2"
        aria-label="Close menu"
        id="mobile-menu-close"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>

    <div class="p-4 space-y-4">
      <a href="/" class="block py-2 text-lg">Home</a>
      <a href="/services" class="block py-2 text-lg">Services</a>
      <a href="/areas" class="block py-2 text-lg">Areas</a>
      <a href="/about" class="block py-2 text-lg">About</a>
      <a href="/contact" class="block py-2 text-lg">Contact</a>
    </div>

    <div class="absolute bottom-0 left-0 right-0 p-4 border-t bg-gray-50">
      <a href="/quote" class="btn btn-primary w-full mb-3">
        Free Quote
      </a>
      <a href={`tel:${site.phone.replace(/\s/g, '')}`} class="btn btn-secondary w-full">
        Call {site.phone}
      </a>
    </div>
  </nav>
</div>

<script>
  function initMobileMenu() {
    const button = document.getElementById('mobile-menu-button');
    const menu = document.getElementById('mobile-menu');
    const close = document.getElementById('mobile-menu-close');
    const backdrop = document.getElementById('mobile-menu-backdrop');
    const panel = menu?.querySelector('nav');

    if (!button || !menu || !panel) return;

    function openMenu() {
      menu.classList.remove('hidden');
      menu.setAttribute('aria-hidden', 'false');
      button.setAttribute('aria-expanded', 'true');
      requestAnimationFrame(() => {
        panel.classList.remove('translate-x-full');
      });
      document.body.style.overflow = 'hidden';
    }

    function closeMenu() {
      panel.classList.add('translate-x-full');
      button.setAttribute('aria-expanded', 'false');
      setTimeout(() => {
        menu.classList.add('hidden');
        menu.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      }, 300);
    }

    button.addEventListener('click', openMenu);
    close?.addEventListener('click', closeMenu);
    backdrop?.addEventListener('click', closeMenu);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !menu.classList.contains('hidden')) {
        closeMenu();
      }
    });
  }

  initMobileMenu();
  document.addEventListener('astro:page-load', initMobileMenu);
</script>
```

## Sticky Mobile CTA Bar

```astro
---
import { site } from '@/config/site';
---

<div class="fixed bottom-0 left-0 right-0 md:hidden bg-white border-t shadow-lg z-40 safe-area-pb">
  <div class="grid grid-cols-2 gap-2 p-3">
    <a
      href={`tel:${site.phone.replace(/\s/g, '')}`}
      class="btn btn-secondary flex items-center justify-center gap-2"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
      </svg>
      Call
    </a>
    <a href="/quote" class="btn btn-primary flex items-center justify-center gap-2">
      Free Quote
    </a>
  </div>
</div>

<style>
  .safe-area-pb {
    padding-bottom: max(0.75rem, env(safe-area-inset-bottom));
  }
</style>
```

## Footer

```astro
---
import { site } from '@/config/site';
const year = new Date().getFullYear();
---

<footer class="bg-gray-900 text-white pt-12 pb-24 md:pb-12">
  <div class="container mx-auto px-4">
    <div class="grid md:grid-cols-4 gap-8 mb-8">
      <!-- Company Info -->
      <div class="md:col-span-1">
        <img src="/logo-white.svg" alt={site.name} class="h-8 mb-4" width="120" height="32">
        <address class="not-italic text-gray-400 text-sm space-y-1">
          <p>{site.address}</p>
          <p>
            <a href={`tel:${site.phone.replace(/\s/g, '')}`} class="hover:text-white">
              {site.phone}
            </a>
          </p>
          <p>
            <a href={`mailto:${site.email}`} class="hover:text-white">
              {site.email}
            </a>
          </p>
        </address>
      </div>

      <!-- Services -->
      <div>
        <h3 class="font-semibold mb-4">Services</h3>
        <ul class="space-y-2 text-gray-400 text-sm">
          <li><a href="/services/house-removals" class="hover:text-white">House Removals</a></li>
          <li><a href="/services/office-removals" class="hover:text-white">Office Removals</a></li>
          <li><a href="/services/packing" class="hover:text-white">Packing Service</a></li>
          <li><a href="/services/storage" class="hover:text-white">Storage</a></li>
        </ul>
      </div>

      <!-- Areas -->
      <div>
        <h3 class="font-semibold mb-4">Areas We Cover</h3>
        <ul class="space-y-2 text-gray-400 text-sm">
          <li><a href="/areas/bristol" class="hover:text-white">Bristol</a></li>
          <li><a href="/areas/bath" class="hover:text-white">Bath</a></li>
          <li><a href="/areas/gloucester" class="hover:text-white">Gloucester</a></li>
          <li><a href="/areas/swindon" class="hover:text-white">Swindon</a></li>
        </ul>
      </div>

      <!-- Quick Links -->
      <div>
        <h3 class="font-semibold mb-4">Quick Links</h3>
        <ul class="space-y-2 text-gray-400 text-sm">
          <li><a href="/about" class="hover:text-white">About Us</a></li>
          <li><a href="/quote" class="hover:text-white">Get a Quote</a></li>
          <li><a href="/contact" class="hover:text-white">Contact</a></li>
          <li><a href="/faq" class="hover:text-white">FAQ</a></li>
        </ul>
      </div>
    </div>

    <!-- Bottom Bar -->
    <div class="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
      <p class="text-gray-500 text-sm">
        © {year} {site.name}. All rights reserved.
      </p>
      <div class="flex gap-6 text-gray-500 text-sm">
        <a href="/privacy-policy" class="hover:text-white">Privacy Policy</a>
        <a href="/cookie-policy" class="hover:text-white">Cookies</a>
      </div>
    </div>
  </div>
</footer>
```

## Breadcrumbs

```astro
---
interface Props {
  items: Array<{ label: string; href?: string }>;
}

const { items } = Astro.props;
---

<nav aria-label="Breadcrumb" class="text-sm text-gray-500 mb-4">
  <ol class="flex items-center gap-2" itemscope itemtype="https://schema.org/BreadcrumbList">
    {items.map((item, index) => (
      <li
        class="flex items-center gap-2"
        itemprop="itemListElement"
        itemscope
        itemtype="https://schema.org/ListItem"
      >
        {index > 0 && <span aria-hidden="true">/</span>}
        {item.href ? (
          <a href={item.href} itemprop="item" class="hover:text-primary">
            <span itemprop="name">{item.label}</span>
          </a>
        ) : (
          <span itemprop="name" aria-current="page" class="text-gray-900 font-medium">
            {item.label}
          </span>
        )}
        <meta itemprop="position" content={String(index + 1)} />
      </li>
    ))}
  </ol>
</nav>
```

## Skip Link

```astro
<a
  href="#main-content"
  class="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-primary focus:text-white focus:px-4 focus:py-2 focus:rounded"
>
  Skip to main content
</a>
```

## Active Link Styling

```astro
---
const pathname = Astro.url.pathname;

function isActive(href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname.startsWith(href);
}
---

<a
  href="/services"
  class:list={[
    "transition-colors",
    isActive('/services') ? "text-primary font-semibold" : "text-gray-700 hover:text-primary"
  ]}
  aria-current={isActive('/services') ? 'page' : undefined}
>
  Services
</a>
```

## Forbidden

- ❌ Hamburger menu on desktop
- ❌ Navigation without keyboard support
- ❌ Missing aria-expanded on toggles
- ❌ Logo without link to homepage
- ❌ Phone number not clickable on mobile
- ❌ Footer hidden by sticky mobile bar

## Definition of Done

- [ ] Mobile menu works (open/close/escape)
- [ ] Phone number clickable on mobile
- [ ] CTA visible on all viewports
- [ ] Skip link present
- [ ] Keyboard navigable
- [ ] Active page indicated
- [ ] Footer above mobile sticky bar
- [ ] Breadcrumbs on inner pages
