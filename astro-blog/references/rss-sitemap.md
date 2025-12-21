# RSS Feed & Sitemap

## RSS Feed

```typescript
// src/pages/rss.xml.ts
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const posts = await getCollection('blog', ({ data }) => !data.draft);

  return rss({
    title: 'Your Company Blog',
    description: 'Tips and guides for moving home',
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description,
      link: `/blog/${post.slug}/`,
    })),
  });
}
```

## Setup

Install the RSS package:

```bash
npm install @astrojs/rss
```

The RSS feed will be available at `/rss.xml`

## Notes

- Feed automatically includes all non-draft posts
- Posts sorted by publication date (newest first)
- Include site URL in astro.config.mjs
- Feed updates automatically when content changes
