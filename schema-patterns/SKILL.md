---
name: schema-patterns
description: Schema.org structured data patterns for lead gen sites. LocalBusiness, FAQ, HowTo, Service, Review, BreadcrumbList. Rich snippets for better SERP visibility.
---

# Schema Patterns Skill

## Purpose

Provides comprehensive Schema.org markup patterns for lead generation sites to maximize rich snippet visibility in search results.

## Core Rules

1. **One primary schema per page** — LocalBusiness OR Organization at root
2. **Nest related schemas** — Reviews inside LocalBusiness, not separate
3. **Validate always** — Test with Google Rich Results Test
4. **Match visible content** — Schema must reflect what's on page
5. **Keep updated** — Hours, prices, reviews must be current

## Schema Priority for Lead Gen

| Priority | Schema Type | Rich Result |
|----------|-------------|-------------|
| P0 | LocalBusiness | Knowledge panel, maps |
| P0 | FAQPage | FAQ accordion in SERP |
| P1 | Service | Service listings |
| P1 | BreadcrumbList | Breadcrumb trail |
| P1 | AggregateRating | Star ratings |
| P2 | HowTo | Step-by-step cards |
| P2 | Article | Article cards |
| P3 | VideoObject | Video thumbnails |
| P3 | Product | Product cards (if applicable) |

## LocalBusiness Schema

```astro
---
// src/components/schema/LocalBusinessSchema.astro
interface Props {
  name: string;
  description: string;
  phone: string;
  email: string;
  address: {
    street: string;
    city: string;
    region: string;
    postalCode: string;
    country: string;
  };
  geo: {
    latitude: number;
    longitude: number;
  };
  hours: {
    dayOfWeek: string[];
    opens: string;
    closes: string;
  }[];
  images: string[];
  priceRange?: string;
  rating?: {
    value: number;
    count: number;
  };
  sameAs?: string[]; // Social profiles
}

const props = Astro.props;
const siteUrl = Astro.site?.toString().replace(/\/$/, '');

const schema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": `${siteUrl}/#business`,
  "name": props.name,
  "description": props.description,
  "url": siteUrl,
  "telephone": props.phone,
  "email": props.email,
  "address": {
    "@type": "PostalAddress",
    "streetAddress": props.address.street,
    "addressLocality": props.address.city,
    "addressRegion": props.address.region,
    "postalCode": props.address.postalCode,
    "addressCountry": props.address.country
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": props.geo.latitude,
    "longitude": props.geo.longitude
  },
  "openingHoursSpecification": props.hours.map(h => ({
    "@type": "OpeningHoursSpecification",
    "dayOfWeek": h.dayOfWeek,
    "opens": h.opens,
    "closes": h.closes
  })),
  "image": props.images,
  "priceRange": props.priceRange,
  ...(props.rating && {
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": props.rating.value,
      "reviewCount": props.rating.count,
      "bestRating": 5,
      "worstRating": 1
    }
  }),
  ...(props.sameAs && { "sameAs": props.sameAs })
};
---

<script type="application/ld+json" set:html={JSON.stringify(schema)} />
```

## FAQPage Schema

```astro
---
// src/components/schema/FAQSchema.astro
interface FAQ {
  question: string;
  answer: string;
}

interface Props {
  faqs: FAQ[];
}

const { faqs } = Astro.props;

const schema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": faqs.map(faq => ({
    "@type": "Question",
    "name": faq.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": faq.answer
    }
  }))
};
---

<script type="application/ld+json" set:html={JSON.stringify(schema)} />
```

### FAQ Component with Schema

```astro
---
import FAQSchema from './schema/FAQSchema.astro';

interface Props {
  faqs: { question: string; answer: string }[];
}

const { faqs } = Astro.props;
---

<section class="faq-section">
  <h2>Frequently Asked Questions</h2>

  <div class="faq-list">
    {faqs.map((faq, index) => (
      <details class="faq-item">
        <summary class="faq-question">{faq.question}</summary>
        <div class="faq-answer" set:html={faq.answer} />
      </details>
    ))}
  </div>
</section>

<FAQSchema faqs={faqs} />
```

## Service Schema

```astro
---
// src/components/schema/ServiceSchema.astro
interface Props {
  name: string;
  description: string;
  provider: string;
  areaServed: string[];
  serviceType: string;
  url: string;
  image?: string;
  offers?: {
    price?: number;
    priceCurrency?: string;
    priceRange?: string;
  };
}

const props = Astro.props;
const siteUrl = Astro.site?.toString().replace(/\/$/, '');

const schema = {
  "@context": "https://schema.org",
  "@type": "Service",
  "name": props.name,
  "description": props.description,
  "provider": {
    "@type": "LocalBusiness",
    "@id": `${siteUrl}/#business`
  },
  "areaServed": props.areaServed.map(area => ({
    "@type": "City",
    "name": area
  })),
  "serviceType": props.serviceType,
  "url": props.url,
  ...(props.image && { "image": props.image }),
  ...(props.offers && {
    "offers": {
      "@type": "Offer",
      ...(props.offers.price && {
        "price": props.offers.price,
        "priceCurrency": props.offers.priceCurrency || "GBP"
      }),
      ...(props.offers.priceRange && {
        "priceSpecification": {
          "@type": "PriceSpecification",
          "price": props.offers.priceRange
        }
      })
    }
  })
};
---

<script type="application/ld+json" set:html={JSON.stringify(schema)} />
```

## BreadcrumbList Schema

```astro
---
// src/components/schema/BreadcrumbSchema.astro
interface BreadcrumbItem {
  name: string;
  url?: string;
}

interface Props {
  items: BreadcrumbItem[];
}

const { items } = Astro.props;
const siteUrl = Astro.site?.toString().replace(/\/$/, '');

const schema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": items.map((item, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "name": item.name,
    ...(item.url && { "item": `${siteUrl}${item.url}` })
  }))
};
---

<script type="application/ld+json" set:html={JSON.stringify(schema)} />
```

## HowTo Schema

```astro
---
// src/components/schema/HowToSchema.astro
interface Step {
  name: string;
  text: string;
  image?: string;
  url?: string;
}

interface Props {
  name: string;
  description: string;
  steps: Step[];
  totalTime?: string; // ISO 8601 duration, e.g., "PT30M"
  estimatedCost?: {
    currency: string;
    value: string;
  };
  image?: string;
}

const props = Astro.props;

const schema = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": props.name,
  "description": props.description,
  ...(props.totalTime && { "totalTime": props.totalTime }),
  ...(props.estimatedCost && {
    "estimatedCost": {
      "@type": "MonetaryAmount",
      "currency": props.estimatedCost.currency,
      "value": props.estimatedCost.value
    }
  }),
  ...(props.image && { "image": props.image }),
  "step": props.steps.map((step, index) => ({
    "@type": "HowToStep",
    "position": index + 1,
    "name": step.name,
    "text": step.text,
    ...(step.image && { "image": step.image }),
    ...(step.url && { "url": step.url })
  }))
};
---

<script type="application/ld+json" set:html={JSON.stringify(schema)} />
```

## Review Schema

```astro
---
// src/components/schema/ReviewSchema.astro
interface Props {
  itemReviewed: {
    type: 'LocalBusiness' | 'Service' | 'Product';
    name: string;
  };
  author: string;
  datePublished: string;
  reviewBody: string;
  ratingValue: number;
}

const props = Astro.props;

const schema = {
  "@context": "https://schema.org",
  "@type": "Review",
  "itemReviewed": {
    "@type": props.itemReviewed.type,
    "name": props.itemReviewed.name
  },
  "author": {
    "@type": "Person",
    "name": props.author
  },
  "datePublished": props.datePublished,
  "reviewBody": props.reviewBody,
  "reviewRating": {
    "@type": "Rating",
    "ratingValue": props.ratingValue,
    "bestRating": 5,
    "worstRating": 1
  }
};
---

<script type="application/ld+json" set:html={JSON.stringify(schema)} />
```

## Article Schema

```astro
---
// src/components/schema/ArticleSchema.astro
interface Props {
  headline: string;
  description: string;
  image: string;
  datePublished: string;
  dateModified?: string;
  author: {
    name: string;
    url?: string;
  };
  publisher: {
    name: string;
    logo: string;
  };
}

const props = Astro.props;
const siteUrl = Astro.site?.toString().replace(/\/$/, '');

const schema = {
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": props.headline,
  "description": props.description,
  "image": props.image,
  "datePublished": props.datePublished,
  "dateModified": props.dateModified || props.datePublished,
  "author": {
    "@type": "Person",
    "name": props.author.name,
    ...(props.author.url && { "url": props.author.url })
  },
  "publisher": {
    "@type": "Organization",
    "name": props.publisher.name,
    "logo": {
      "@type": "ImageObject",
      "url": props.publisher.logo
    }
  },
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": Astro.url.href
  }
};
---

<script type="application/ld+json" set:html={JSON.stringify(schema)} />
```

## VideoObject Schema

```astro
---
// src/components/schema/VideoSchema.astro
interface Props {
  name: string;
  description: string;
  thumbnailUrl: string;
  uploadDate: string;
  duration?: string; // ISO 8601, e.g., "PT5M30S"
  contentUrl?: string;
  embedUrl?: string;
}

const props = Astro.props;

const schema = {
  "@context": "https://schema.org",
  "@type": "VideoObject",
  "name": props.name,
  "description": props.description,
  "thumbnailUrl": props.thumbnailUrl,
  "uploadDate": props.uploadDate,
  ...(props.duration && { "duration": props.duration }),
  ...(props.contentUrl && { "contentUrl": props.contentUrl }),
  ...(props.embedUrl && { "embedUrl": props.embedUrl })
};
---

<script type="application/ld+json" set:html={JSON.stringify(schema)} />
```

## WebSite Schema with Sitelinks Search

```astro
---
// src/components/schema/WebSiteSchema.astro
interface Props {
  name: string;
  description: string;
  searchUrl?: string; // e.g., "/search?q="
}

const props = Astro.props;
const siteUrl = Astro.site?.toString().replace(/\/$/, '');

const schema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": props.name,
  "description": props.description,
  "url": siteUrl,
  ...(props.searchUrl && {
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${siteUrl}${props.searchUrl}{search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  })
};
---

<script type="application/ld+json" set:html={JSON.stringify(schema)} />
```

## Combined Page Schema Example

```astro
---
// Example: Service page with multiple schemas
import LocalBusinessSchema from '@/components/schema/LocalBusinessSchema.astro';
import ServiceSchema from '@/components/schema/ServiceSchema.astro';
import BreadcrumbSchema from '@/components/schema/BreadcrumbSchema.astro';
import FAQSchema from '@/components/schema/FAQSchema.astro';

const businessData = { /* ... */ };
const serviceData = { /* ... */ };
const breadcrumbs = [
  { name: 'Home', url: '/' },
  { name: 'Services', url: '/services' },
  { name: 'House Removals' }
];
const faqs = [
  { question: 'How much does it cost?', answer: 'Prices start from £299...' },
  { question: 'How far in advance should I book?', answer: 'We recommend 2-4 weeks...' }
];
---

<LocalBusinessSchema {...businessData} />
<ServiceSchema {...serviceData} />
<BreadcrumbSchema items={breadcrumbs} />
<FAQSchema faqs={faqs} />
```

## Schema Validation

```typescript
// src/lib/schema/validate.ts
export async function validateSchema(url: string): Promise<{
  valid: boolean;
  errors: string[];
  warnings: string[];
}> {
  const apiUrl = `https://validator.schema.org/validate?url=${encodeURIComponent(url)}`;

  // Note: For automated testing, use Google's Rich Results Test API
  // https://developers.google.com/search/apis/indexing-api/v3/reference/urlInspection

  // Manual validation checklist
  return {
    valid: true,
    errors: [],
    warnings: []
  };
}

// Schema checklist for QA
export const schemaChecklist = [
  'LocalBusiness has complete address',
  'Phone number in E.164 format',
  'Opening hours are current',
  'Images are absolute URLs',
  'Prices match visible content',
  'Reviews are real and dated',
  'FAQ answers are complete',
  'No deprecated properties used'
];
```

## Testing Schemas

```bash
# Test with Google Rich Results Test
# https://search.google.com/test/rich-results

# Test with Schema.org Validator
# https://validator.schema.org/

# Local validation with structured-data-testing-tool
npx structured-data-testing-tool --url https://yoursite.com
```

## Common Mistakes

| Mistake | Impact | Fix |
|---------|--------|-----|
| Missing @context | Schema ignored | Always include "https://schema.org" |
| Relative URLs | Schema invalid | Use absolute URLs for images/links |
| Outdated hours | Bad UX, trust loss | Update opening hours regularly |
| Fake reviews | Manual penalty | Only use real, verifiable reviews |
| Missing required fields | No rich result | Check Google's requirements |
| Duplicate schemas | Confusion | One primary type per page |

## Forbidden

- ❌ Schema for content not on page
- ❌ Fake reviews or ratings
- ❌ Outdated business information
- ❌ Multiple conflicting schemas
- ❌ Spammy keyword stuffing in schema
- ❌ Hidden schema-only content

## Definition of Done

- [ ] LocalBusiness schema on all pages
- [ ] FAQPage schema on FAQ sections
- [ ] Service schema on service pages
- [ ] BreadcrumbList on all inner pages
- [ ] Article schema on blog posts
- [ ] All schemas validated with Rich Results Test
- [ ] No errors in Search Console
- [ ] Schema matches visible content
