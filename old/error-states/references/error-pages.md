# Error Pages

## 404 Page

```astro
---
// src/pages/404.astro
import BaseLayout from '@/layouts/BaseLayout.astro';
import { getCollection } from 'astro:content';

// Get popular pages for suggestions
const popularPages = [
  { title: 'Home', href: '/' },
  { title: 'Services', href: '/services' },
  { title: 'Get a Quote', href: '/quote' },
  { title: 'Contact Us', href: '/contact' },
];

// Get recent blog posts
const posts = (await getCollection('blog', ({ data }) => !data.draft))
  .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
  .slice(0, 3);
---

<BaseLayout title="Page Not Found" description="The page you're looking for doesn't exist.">
  <main class="min-h-[60vh] flex items-center py-16">
    <div class="container mx-auto px-4 text-center">
      <!-- Error illustration -->
      <div class="mb-8">
        <span class="text-8xl font-bold text-gray-200">404</span>
      </div>

      <h1 class="text-3xl md:text-4xl font-bold mb-4">
        Page not found
      </h1>

      <p class="text-xl text-gray-600 mb-8 max-w-md mx-auto">
        Sorry, we couldn't find the page you're looking for. It may have been moved or deleted.
      </p>

      <!-- Search -->
      <form action="/search" method="get" class="max-w-md mx-auto mb-8">
        <div class="flex gap-2">
          <input
            type="search"
            name="q"
            placeholder="Search our site..."
            class="flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          />
          <button type="submit" class="btn btn-primary">
            Search
          </button>
        </div>
      </form>

      <!-- Popular links -->
      <div class="mb-12">
        <p class="text-gray-500 mb-4">Or try one of these popular pages:</p>
        <div class="flex flex-wrap justify-center gap-3">
          {popularPages.map((page) => (
            <a
              href={page.href}
              class="px-4 py-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
            >
              {page.title}
            </a>
          ))}
        </div>
      </div>

      <!-- Contact info -->
      <p class="text-gray-500">
        Need help? <a href="/contact" class="text-primary hover:underline">Contact us</a>
        or call <a href="tel:+441onal234567890" class="text-primary hover:underline">01onal23 456 890</a>
      </p>
    </div>
  </main>

  <!-- Track 404s -->
  <script>
    if (window.dataLayer) {
      window.dataLayer.push({
        event: 'page_not_found',
        page_url: window.location.href,
        referrer: document.referrer,
      });
    }
  </script>
</BaseLayout>
```

## 500 Error Page

```astro
---
// src/pages/500.astro
import BaseLayout from '@/layouts/BaseLayout.astro';
---

<BaseLayout title="Something went wrong" description="An error occurred on our end.">
  <main class="min-h-[60vh] flex items-center py-16">
    <div class="container mx-auto px-4 text-center">
      <div class="mb-8">
        <span class="text-8xl font-bold text-gray-200">500</span>
      </div>

      <h1 class="text-3xl md:text-4xl font-bold mb-4">
        Something went wrong
      </h1>

      <p class="text-xl text-gray-600 mb-8 max-w-md mx-auto">
        We're experiencing technical difficulties. Our team has been notified and is working on it.
      </p>

      <div class="flex flex-col sm:flex-row gap-4 justify-center mb-12">
        <button
          onclick="window.location.reload()"
          class="btn btn-primary"
        >
          Try again
        </button>
        <a href="/" class="btn btn-secondary">
          Go to homepage
        </a>
      </div>

      <p class="text-gray-500">
        If this problem persists, please <a href="/contact" class="text-primary hover:underline">contact us</a>
      </p>
    </div>
  </main>
</BaseLayout>
```
