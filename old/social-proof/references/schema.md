# Review Schema Markup

## Review Schema Component

```astro
---
const aggregateRating = {
  "@type": "AggregateRating",
  "ratingValue": "4.9",
  "reviewCount": "127",
  "bestRating": "5",
  "worstRating": "1"
};
---

<script type="application/ld+json" set:html={JSON.stringify({
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Bristol Removals",
  "aggregateRating": aggregateRating
})} />
```
