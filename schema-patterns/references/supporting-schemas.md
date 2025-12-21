# Supporting Schemas

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
