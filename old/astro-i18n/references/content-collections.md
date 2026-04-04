# Translated Content Collections

## Content Config

```typescript
// src/content/config.ts
import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    lang: z.enum(['en', 'de', 'fr']),
    translationOf: z.string().optional(), // Slug of original post
  }),
});

export const collections = { blog };
```

## Blog Post Page

```astro
---
// src/pages/[lang]/blog/[...slug].astro
import { getCollection } from 'astro:content';
import { languages, type Lang } from '@/i18n/config';

export async function getStaticPaths() {
  const posts = await getCollection('blog');
  const paths = [];

  for (const lang of Object.keys(languages)) {
    const langPosts = posts.filter((p) => p.data.lang === lang);
    for (const post of langPosts) {
      paths.push({
        params: { lang, slug: post.slug.replace(`${lang}/`, '') },
        props: { post },
      });
    }
  }

  return paths;
}

const { lang } = Astro.params as { lang: Lang };
const { post } = Astro.props;
const { Content } = await post.render();
---

<article>
  <h1>{post.data.title}</h1>
  <time datetime={post.data.pubDate.toISOString()}>
    {formatDate(lang, post.data.pubDate)}
  </time>
  <Content />
</article>
```

## Content File Structure

```
src/content/blog/
├── en/
│   ├── getting-started.md
│   └── advanced-tips.md
├── de/
│   ├── erste-schritte.md
│   └── fortgeschrittene-tipps.md
└── fr/
    ├── commencer.md
    └── conseils-avances.md
```

## Example Blog Post

```markdown
---
# src/content/blog/en/getting-started.md
title: Getting Started with Our Service
description: Learn the basics in 5 minutes
pubDate: 2024-01-15
lang: en
---

Welcome to our service! This guide will...
```

```markdown
---
# src/content/blog/de/erste-schritte.md
title: Erste Schritte mit unserem Service
description: Lernen Sie die Grundlagen in 5 Minuten
pubDate: 2024-01-15
lang: de
translationOf: getting-started
---

Willkommen zu unserem Service! Diese Anleitung wird...
```

## Finding Translation Alternatives

```typescript
// Get all translations of a post
const allPosts = await getCollection('blog');
const translations = allPosts.filter(
  (p) => p.data.translationOf === currentPost.slug ||
         p.slug === currentPost.data.translationOf
);
```
