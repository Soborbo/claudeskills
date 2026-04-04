# Meta Tags Implementation

## SEO Component

Create a reusable SEO component:

```astro
---
// src/components/seo/SEO.astro
import { site } from '@/config/site';

interface Props {
  title?: string;
  description?: string;
  image?: string;
  type?: 'website' | 'article';
  noindex?: boolean;
  publishedTime?: string;
  modifiedTime?: string;
}

const {
  title = site.meta.title,
  description = site.meta.description,
  image = site.meta.ogImage,
  type = 'website',
  noindex = false,
  publishedTime,
  modifiedTime,
} = Astro.props;

const canonicalURL = new URL(Astro.url.pathname, Astro.site);
const ogImageURL = new URL(image, Astro.site);

// Title format: "Page Title | Brand Name"
const fullTitle = title === site.meta.title 
  ? title 
  : `${title} | ${site.name}`;
---

<!-- Primary Meta -->
<title>{fullTitle}</title>
<meta name="description" content={description} />
<link rel="canonical" href={canonicalURL} />

<!-- Robots -->
{noindex ? (
  <meta name="robots" content="noindex, nofollow" />
) : (
  <meta name="robots" content="index, follow" />
)}

<!-- Open Graph -->
<meta property="og:type" content={type} />
<meta property="og:url" content={canonicalURL} />
<meta property="og:title" content={fullTitle} />
<meta property="og:description" content={description} />
<meta property="og:image" content={ogImageURL} />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:site_name" content={site.name} />
<meta property="og:locale" content="en_GB" />

<!-- Article specific -->
{type === 'article' && publishedTime && (
  <meta property="article:published_time" content={publishedTime} />
)}
{type === 'article' && modifiedTime && (
  <meta property="article:modified_time" content={modifiedTime} />
)}

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content={fullTitle} />
<meta name="twitter:description" content={description} />
<meta name="twitter:image" content={ogImageURL} />

<!-- Additional -->
<meta name="author" content={site.name} />
<link rel="sitemap" href="/sitemap-index.xml" />
```

## Usage

```astro
---
// src/pages/services.astro
import BaseLayout from '@/layouts/BaseLayout.astro';
import SEO from '@/components/seo/SEO.astro';
---

<BaseLayout>
  <SEO 
    slot="head"
    title="Our Services"
    description="Professional removal services in Bristol. House moves, office relocations, and packing services. Free quotes available."
  />
  
  <main>...</main>
</BaseLayout>
```

## BaseLayout Integration

```astro
---
// src/layouts/BaseLayout.astro
import { site } from '@/config/site';
---

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  
  <!-- SEO component slot -->
  <slot name="head" />
  
  <!-- Favicon -->
  <link rel="icon" href="/favicon.ico" sizes="32x32" />
  <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
  <link rel="manifest" href="/site.webmanifest" />
  
  <!-- Preconnect -->
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
</head>
<body>
  <slot />
</body>
</html>
```

## Title Best Practices

| Page | Format | Example |
|------|--------|---------|
| Homepage | Brand + Main Keyword | "Painless Removals \| House Moves Bristol" |
| Service | Service + Location + Brand | "House Clearance Bristol \| Painless Removals" |
| Location | Service + Location + Brand | "Removals in Bath \| Painless Removals" |
| About | "About Us \| Brand" | "About Us \| Painless Removals" |
| Contact | "Contact \| Brand" | "Contact Us \| Painless Removals" |

**Rules:**
- 50-60 characters max
- Primary keyword near start
- Brand at end
- No keyword stuffing

## Description Best Practices

| Page | Include |
|------|---------|
| Homepage | Main service + location + USP + CTA hint |
| Service | Specific service + benefits + location |
| Location | Service + specific area + local proof |

**Rules:**
- 150-160 characters
- Include primary keyword naturally
- Include call-to-action hint
- Unique per page

**Example:**
> "Professional house removals in Bristol. Fully insured, 5-star rated. Free quotes in 60 seconds. Call now or book online."

## noindex Pages

Always noindex:
- Thank you pages
- Admin pages
- Search results
- Paginated archives (page 2+)
- Staging/dev environments

```astro
<SEO noindex={true} title="Thank You" />
```
