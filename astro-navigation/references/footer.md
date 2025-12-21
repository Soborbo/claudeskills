# Footer

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
