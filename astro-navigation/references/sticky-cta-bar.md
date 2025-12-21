# Sticky Mobile CTA Bar

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
