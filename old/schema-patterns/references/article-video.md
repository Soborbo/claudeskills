# Article and VideoObject Schemas

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
