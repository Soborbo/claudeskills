# Schema.org Implementation

## LocalBusiness Schema (Homepage)

```astro
---
// src/components/seo/LocalBusinessSchema.astro
import { site } from '@/config/site';
---

<script type="application/ld+json" set:html={JSON.stringify({
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": `${Astro.site}#business`,
  "name": site.name,
  "description": site.meta.description,
  "url": Astro.site,
  "telephone": site.phone,
  "email": site.email,
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "123 High Street",
    "addressLocality": "Bristol",
    "addressRegion": "England",
    "postalCode": "BS1 1AA",
    "addressCountry": "GB"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 51.4545,
    "longitude": -2.5879
  },
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "opens": "08:00",
      "closes": "18:00"
    },
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": "Saturday",
      "opens": "09:00",
      "closes": "16:00"
    }
  ],
  "priceRange": "££",
  "areaServed": [
    { "@type": "City", "name": "Bristol" },
    { "@type": "City", "name": "Bath" }
  ],
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": site.social.google.rating,
    "reviewCount": site.social.google.count,
    "bestRating": 5
  },
  "sameAs": [
    site.social.facebook,
    site.social.instagram
  ].filter(Boolean)
})} />
```

## WebSite Schema (Homepage)

```astro
---
// src/components/seo/WebSiteSchema.astro
import { site } from '@/config/site';
---

<script type="application/ld+json" set:html={JSON.stringify({
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${Astro.site}#website`,
  "name": site.name,
  "url": Astro.site,
  "publisher": {
    "@id": `${Astro.site}#business`
  }
})} />
```

## Service Schema

```astro
---
// src/components/seo/ServiceSchema.astro
import { site } from '@/config/site';

interface Props {
  name: string;
  description: string;
  price?: string;
  image?: string;
  url?: string;
}

const { name, description, price, image, url } = Astro.props;
const serviceUrl = url || Astro.url.href;
---

<script type="application/ld+json" set:html={JSON.stringify({
  "@context": "https://schema.org",
  "@type": "Service",
  "name": name,
  "description": description,
  "url": serviceUrl,
  "provider": {
    "@type": "LocalBusiness",
    "@id": `${Astro.site}#business`
  },
  "areaServed": {
    "@type": "City",
    "name": "Bristol"
  },
  ...(price && {
    "offers": {
      "@type": "Offer",
      "price": price,
      "priceCurrency": "GBP"
    }
  }),
  ...(image && { "image": new URL(image, Astro.site).href })
})} />
```

## FAQPage Schema

```astro
---
// src/components/seo/FAQSchema.astro
interface Props {
  items: Array<{
    question: string;
    answer: string;
  }>;
}

const { items } = Astro.props;
---

<script type="application/ld+json" set:html={JSON.stringify({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": items.map(item => ({
    "@type": "Question",
    "name": item.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": item.answer
    }
  }))
})} />
```

**Usage:**

```astro
<FAQSchema items={[
  { 
    question: "How much does a house move cost?", 
    answer: "House moves typically cost between £300-£800 depending on size and distance." 
  },
  { 
    question: "Do you provide packing materials?", 
    answer: "Yes, we provide all packing materials including boxes, tape, and bubble wrap." 
  }
]} />
```

## BreadcrumbList Schema

```astro
---
// src/components/seo/BreadcrumbSchema.astro
interface Props {
  items: Array<{
    name: string;
    url: string;
  }>;
}

const { items } = Astro.props;
---

<script type="application/ld+json" set:html={JSON.stringify({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": items.map((item, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "name": item.name,
    "item": new URL(item.url, Astro.site).href
  }))
})} />
```

**Usage:**

```astro
<BreadcrumbSchema items={[
  { name: "Home", url: "/" },
  { name: "Services", url: "/services" },
  { name: "House Removals", url: "/services/house-removals" }
]} />
```

## Organization Schema

```astro
---
// src/components/seo/OrganizationSchema.astro
import { site } from '@/config/site';
---

<script type="application/ld+json" set:html={JSON.stringify({
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${Astro.site}#organization`,
  "name": site.name,
  "url": Astro.site,
  "logo": new URL('/logo.png', Astro.site).href,
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": site.phone,
    "contactType": "customer service",
    "availableLanguage": ["English"]
  }
})} />
```

## Article Schema (Blog)

```astro
---
// src/components/seo/ArticleSchema.astro
import { site } from '@/config/site';

interface Props {
  title: string;
  description: string;
  image: string;
  publishedTime: string;
  modifiedTime?: string;
  author?: string;
}

const { title, description, image, publishedTime, modifiedTime, author = site.name } = Astro.props;
---

<script type="application/ld+json" set:html={JSON.stringify({
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": title,
  "description": description,
  "image": new URL(image, Astro.site).href,
  "datePublished": publishedTime,
  "dateModified": modifiedTime || publishedTime,
  "author": {
    "@type": "Organization",
    "name": author
  },
  "publisher": {
    "@type": "Organization",
    "@id": `${Astro.site}#organization`
  },
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": Astro.url.href
  }
})} />
```

## Page Type → Schema Mapping

| Page | Schemas to Include |
|------|-------------------|
| Homepage | LocalBusiness + WebSite |
| About | Organization + BreadcrumbList |
| Service page | Service + BreadcrumbList |
| FAQ page/section | FAQPage + BreadcrumbList |
| Contact | LocalBusiness + BreadcrumbList |
| Blog post | Article + BreadcrumbList |
| Location page | LocalBusiness (location-specific) + BreadcrumbList |

## Validation

Always validate at:
1. https://validator.schema.org/
2. https://search.google.com/test/rich-results

No errors allowed. Warnings acceptable but should be minimized.
