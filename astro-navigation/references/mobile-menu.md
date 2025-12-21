# Mobile Menu

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
