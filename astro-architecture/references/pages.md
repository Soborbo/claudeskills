# Required Pages

Every site MUST have these pages.

## 404 Page

Custom branded 404 with image and CTAs.

```astro
---
// src/pages/404.astro
import BaseLayout from '@/layouts/BaseLayout.astro';
import { Picture } from 'astro:assets';
import { t, getLocaleFromUrl } from '@/i18n/ui';
import { site } from '@/config/site';
import errorImg from '@/assets/images/404-illustration.svg';

const locale = getLocaleFromUrl(Astro.url);
---

<BaseLayout 
  title={`Page Not Found | ${site.name}`}
  description="The page you're looking for doesn't exist."
  noindex={true}
>
  <main class="min-h-[70vh] flex items-center justify-center px-4">
    <div class="text-center max-w-lg">
      <!-- Illustration -->
      <Picture
        src={errorImg}
        alt=""
        width={300}
        height={200}
        class="mx-auto mb-8"
      />
      
      <!-- Content -->
      <h1 class="text-4xl font-bold text-gray-900 mb-4">
        {t(locale, 'error.404.title') || "Page Not Found"}
      </h1>
      
      <p class="text-lg text-gray-600 mb-8">
        {t(locale, 'error.404.message') || 
          "Sorry, we couldn't find the page you're looking for."}
      </p>
      
      <!-- Two CTAs -->
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <a 
          href="/"
          class="btn btn-primary"
        >
          {t(locale, 'error.backHome') || "Back to Homepage"}
        </a>
        
        <a 
          href={`tel:${site.phone.replace(/\s/g, '')}`}
          class="btn btn-secondary"
        >
          {t(locale, 'error.callUs') || "Call Us"}
        </a>
      </div>
    </div>
  </main>
</BaseLayout>
```

## 410 Page (Gone)

For permanently removed content.

```astro
---
// src/pages/410.astro
import BaseLayout from '@/layouts/BaseLayout.astro';
import { Picture } from 'astro:assets';
import { t, getLocaleFromUrl } from '@/i18n/ui';
import { site } from '@/config/site';
import goneImg from '@/assets/images/410-illustration.svg';

const locale = getLocaleFromUrl(Astro.url);
---

<BaseLayout 
  title={`Content Removed | ${site.name}`}
  description="This content has been permanently removed."
  noindex={true}
>
  <main class="min-h-[70vh] flex items-center justify-center px-4">
    <div class="text-center max-w-lg">
      <Picture
        src={goneImg}
        alt=""
        width={300}
        height={200}
        class="mx-auto mb-8"
      />
      
      <h1 class="text-4xl font-bold text-gray-900 mb-4">
        {t(locale, 'error.410.title') || "Content No Longer Available"}
      </h1>
      
      <p class="text-lg text-gray-600 mb-8">
        {t(locale, 'error.410.message') || 
          "This page has been permanently removed. It won't be coming back."}
      </p>
      
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <a href="/" class="btn btn-primary">
          {t(locale, 'error.backHome') || "Back to Homepage"}
        </a>
        
        <a 
          href={`tel:${site.phone.replace(/\s/g, '')}`}
          class="btn btn-secondary"
        >
          {t(locale, 'error.callUs') || "Call Us"}
        </a>
      </div>
    </div>
  </main>
</BaseLayout>
```

## Redirect to 410

```typescript
// src/pages/old-service.astro
---
return Astro.redirect('/410', 410);
---
```

## Privacy Policy Page

```astro
---
// src/pages/privacy-policy.astro
import BaseLayout from '@/layouts/BaseLayout.astro';
import { t, getLocaleFromUrl } from '@/i18n/ui';
import { site } from '@/config/site';

const locale = getLocaleFromUrl(Astro.url);
const lastUpdated = "December 2024";
---

<BaseLayout 
  title={`Privacy Policy | ${site.name}`}
  description={`Privacy Policy for ${site.name}. Learn how we collect, use, and protect your data.`}
>
  <main class="py-16 px-4">
    <article class="max-w-3xl mx-auto prose prose-lg">
      <h1>Privacy Policy</h1>
      
      <p class="text-gray-500">Last updated: {lastUpdated}</p>
      
      <h2>1. Who We Are</h2>
      <p>
        This website is operated by <strong>{site.name}</strong>.<br />
        Address: {site.address}<br />
        Email: <a href={`mailto:${site.email}`}>{site.email}</a><br />
        Phone: <a href={`tel:${site.phone.replace(/\s/g, '')}`}>{site.phone}</a>
      </p>
      
      <h2>2. Information We Collect</h2>
      <p>We collect information you provide directly:</p>
      <ul>
        <li>Name and contact details when you fill out forms</li>
        <li>Email address when you subscribe or enquire</li>
        <li>Phone number when you request a callback</li>
        <li>Messages you send us</li>
      </ul>
      
      <p>We automatically collect:</p>
      <ul>
        <li>Device and browser information</li>
        <li>IP address (anonymised)</li>
        <li>Pages visited and time spent</li>
        <li>Referral source</li>
      </ul>
      
      <h2>3. How We Use Your Information</h2>
      <ul>
        <li>To respond to your enquiries</li>
        <li>To provide quotes and services</li>
        <li>To improve our website</li>
        <li>To send relevant updates (with consent)</li>
      </ul>
      
      <h2>4. Cookies</h2>
      <p>
        We use cookies to improve your experience. You can manage cookie 
        preferences via our cookie banner. We use CookieYes for consent management.
      </p>
      
      <h2>5. Third-Party Services</h2>
      <ul>
        <li><strong>Google Analytics:</strong> Website analytics (anonymised)</li>
        <li><strong>Google Tag Manager:</strong> Tag management</li>
        <li><strong>Cloudflare:</strong> Hosting and security</li>
      </ul>
      
      <h2>6. Your Rights (GDPR)</h2>
      <p>You have the right to:</p>
      <ul>
        <li>Access your personal data</li>
        <li>Correct inaccurate data</li>
        <li>Request deletion of your data</li>
        <li>Object to processing</li>
        <li>Data portability</li>
        <li>Withdraw consent</li>
      </ul>
      
      <p>
        To exercise these rights, contact us at 
        <a href={`mailto:${site.email}`}>{site.email}</a>.
      </p>
      
      <h2>7. Data Retention</h2>
      <p>
        We retain your data for as long as necessary to provide services 
        and comply with legal obligations, typically 6 years.
      </p>
      
      <h2>8. Security</h2>
      <p>
        We use SSL encryption and secure hosting. However, no method 
        of transmission is 100% secure.
      </p>
      
      <h2>9. Changes to This Policy</h2>
      <p>
        We may update this policy. Changes will be posted on this page 
        with an updated date.
      </p>
      
      <h2>10. Contact</h2>
      <p>
        For privacy-related questions:<br />
        Email: <a href={`mailto:${site.email}`}>{site.email}</a><br />
        Phone: <a href={`tel:${site.phone.replace(/\s/g, '')}`}>{site.phone}</a><br />
        Address: {site.address}
      </p>
    </article>
  </main>
</BaseLayout>
```

## Footer Business Data

Footer MUST include:

```astro
---
// src/components/layout/Footer.astro
import { site } from '@/config/site';
import { t, getLocaleFromUrl } from '@/i18n/ui';

const locale = getLocaleFromUrl(Astro.url);
const year = new Date().getFullYear();
---

<footer class="bg-gray-900 text-white py-12">
  <div class="container mx-auto px-4">
    <div class="grid md:grid-cols-3 gap-8">
      <!-- Business Info -->
      <div>
        <h3 class="font-bold text-lg mb-4">{site.name}</h3>
        <address class="not-italic text-gray-400">
          <p>{site.address}</p>
          <p class="mt-2">
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
      
      <!-- Quick Links -->
      <div>
        <h3 class="font-bold text-lg mb-4">Quick Links</h3>
        <ul class="space-y-2 text-gray-400">
          <li><a href="/" class="hover:text-white">Home</a></li>
          <li><a href="/services" class="hover:text-white">Services</a></li>
          <li><a href="/contact" class="hover:text-white">Contact</a></li>
        </ul>
      </div>
      
      <!-- Legal -->
      <div>
        <h3 class="font-bold text-lg mb-4">Legal</h3>
        <ul class="space-y-2 text-gray-400">
          <li>
            <a href="/privacy-policy" class="hover:text-white">
              {t(locale, 'footer.privacy') || "Privacy Policy"}
            </a>
          </li>
        </ul>
      </div>
    </div>
    
    <!-- Copyright -->
    <div class="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500">
      <p>© {year} {site.name}. All rights reserved.</p>
    </div>
  </div>
</footer>
```

## Translation Strings

```json
// src/i18n/en.json
{
  "error": {
    "404": {
      "title": "Page Not Found",
      "message": "Sorry, we couldn't find the page you're looking for."
    },
    "410": {
      "title": "Content No Longer Available",
      "message": "This page has been permanently removed."
    },
    "backHome": "Back to Homepage",
    "callUs": "Call Us"
  },
  "footer": {
    "privacy": "Privacy Policy"
  }
}
```

## Placeholder Images

Create for 404/410:
- `404-illustration.svg` (300×200)
- `410-illustration.svg` (300×200)

Use simple, on-brand illustrations.
