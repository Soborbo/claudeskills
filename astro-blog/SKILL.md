---
name: astro-blog
description: Blog and content patterns for Astro sites. Article pages, listings, categories, author pages, SEO for content. Use for content marketing implementation.
---

# Astro Blog Skill

## Purpose

Provides blog/content patterns for lead generation sites. SEO-focused content marketing.

## Core Rules

1. **Lead gen focused** — Every article should have CTA
2. **SEO optimized** — Proper schema, meta, headings
3. **Fast loading** — Lazy images, minimal JS
4. **Shareable** — Open Graph, Twitter cards
5. **Scannable** — Clear headings, short paragraphs

## Content Collection Setup

```typescript
// src/content/config.ts
import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: ({ image }) => z.object({
    title: z.string(),
    description: z.string().max(160),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author: z.string().default('Team'),
    image: image().optional(),
    imageAlt: z.string().optional(),
    category: z.string(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
```

## Article Page Template

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '@/layouts/BaseLayout.astro';
import { Picture } from 'astro:assets';
import Breadcrumbs from '@/components/Breadcrumbs.astro';
import AuthorCard from '@/components/AuthorCard.astro';
import RelatedPosts from '@/components/RelatedPosts.astro';
import CTABanner from '@/components/CTABanner.astro';

export async function getStaticPaths() {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  return posts.map((post) => ({
    params: { slug: post.slug },
    props: { post },
  }));
}

const { post } = Astro.props;
const { Content } = await post.render();

const readingTime = Math.ceil(post.body.split(/\s+/).length / 200);
---

<BaseLayout
  title={`${post.data.title} | Blog`}
  description={post.data.description}
  image={post.data.image?.src}
>
  <article itemscope itemtype="https://schema.org/Article">
    <div class="container mx-auto px-4 py-8">
      <Breadcrumbs items={[
        { label: 'Home', href: '/' },
        { label: 'Blog', href: '/blog' },
        { label: post.data.title }
      ]} />

      <header class="max-w-3xl mx-auto mb-8">
        <div class="flex items-center gap-4 text-sm text-gray-500 mb-4">
          <a href={`/blog/category/${post.data.category.toLowerCase()}`} class="text-primary">
            {post.data.category}
          </a>
          <span>·</span>
          <time datetime={post.data.pubDate.toISOString()} itemprop="datePublished">
            {post.data.pubDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </time>
          <span>·</span>
          <span>{readingTime} min read</span>
        </div>

        <h1 class="text-4xl md:text-5xl font-bold mb-4" itemprop="headline">
          {post.data.title}
        </h1>

        <p class="text-xl text-gray-600" itemprop="description">
          {post.data.description}
        </p>
      </header>

      {post.data.image && (
        <Picture
          src={post.data.image}
          alt={post.data.imageAlt || ''}
          widths={[640, 1024, 1400]}
          formats={['avif', 'webp']}
          class="w-full max-w-4xl mx-auto rounded-xl mb-8"
          itemprop="image"
        />
      )}

      <div class="max-w-3xl mx-auto">
        <div class="prose prose-lg max-w-none" itemprop="articleBody">
          <Content />
        </div>

        <!-- Mid-article CTA -->
        <CTABanner class="my-12" />

        <!-- Tags -->
        {post.data.tags.length > 0 && (
          <div class="flex flex-wrap gap-2 mt-8 pt-8 border-t">
            {post.data.tags.map((tag) => (
              <a
                href={`/blog/tag/${tag.toLowerCase()}`}
                class="px-3 py-1 bg-gray-100 rounded-full text-sm hover:bg-gray-200"
              >
                {tag}
              </a>
            ))}
          </div>
        )}

        <!-- Author -->
        <AuthorCard author={post.data.author} class="mt-8" />
      </div>
    </div>

    <RelatedPosts currentSlug={post.slug} category={post.data.category} />
  </article>

  <!-- Article Schema -->
  <script type="application/ld+json" set:html={JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post.data.title,
    "description": post.data.description,
    "datePublished": post.data.pubDate.toISOString(),
    "dateModified": (post.data.updatedDate || post.data.pubDate).toISOString(),
    "author": {
      "@type": "Person",
      "name": post.data.author
    },
    "publisher": {
      "@type": "Organization",
      "name": "Your Company",
      "logo": {
        "@type": "ImageObject",
        "url": `${Astro.site}logo.png`
      }
    },
    "image": post.data.image ? `${Astro.site}${post.data.image.src}` : undefined
  })} />
</BaseLayout>
```

## Blog Listing Page

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '@/layouts/BaseLayout.astro';
import PostCard from '@/components/PostCard.astro';

const posts = (await getCollection('blog', ({ data }) => !data.draft))
  .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

const categories = [...new Set(posts.map(p => p.data.category))];
---

<BaseLayout title="Blog" description="Tips, guides, and news about moving home">
  <section class="py-12">
    <div class="container mx-auto px-4">
      <h1 class="text-4xl font-bold mb-4">Blog</h1>
      <p class="text-xl text-gray-600 mb-8">
        Tips, guides, and advice for your move
      </p>

      <!-- Category Filter -->
      <div class="flex flex-wrap gap-2 mb-8">
        <a href="/blog" class="px-4 py-2 rounded-full bg-primary text-white">
          All
        </a>
        {categories.map((cat) => (
          <a
            href={`/blog/category/${cat.toLowerCase()}`}
            class="px-4 py-2 rounded-full bg-gray-100 hover:bg-gray-200"
          >
            {cat}
          </a>
        ))}
      </div>

      <!-- Posts Grid -->
      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {posts.map((post) => (
          <PostCard post={post} />
        ))}
      </div>
    </div>
  </section>
</BaseLayout>
```

## Post Card Component

```astro
---
import { Picture } from 'astro:assets';
import type { CollectionEntry } from 'astro:content';

interface Props {
  post: CollectionEntry<'blog'>;
}

const { post } = Astro.props;
const readingTime = Math.ceil(post.body.split(/\s+/).length / 200);
---

<article class="bg-white rounded-xl overflow-hidden shadow-card hover:shadow-card-hover transition-shadow">
  {post.data.image && (
    <a href={`/blog/${post.slug}`}>
      <Picture
        src={post.data.image}
        alt={post.data.imageAlt || ''}
        widths={[400, 600]}
        formats={['avif', 'webp']}
        class="aspect-[16/9] object-cover w-full"
        loading="lazy"
      />
    </a>
  )}

  <div class="p-6">
    <div class="flex items-center gap-2 text-sm text-gray-500 mb-2">
      <span class="text-primary">{post.data.category}</span>
      <span>·</span>
      <span>{readingTime} min</span>
    </div>

    <h2 class="text-xl font-bold mb-2">
      <a href={`/blog/${post.slug}`} class="hover:text-primary">
        {post.data.title}
      </a>
    </h2>

    <p class="text-gray-600 line-clamp-2">
      {post.data.description}
    </p>

    <a href={`/blog/${post.slug}`} class="inline-block mt-4 text-primary font-medium">
      Read more →
    </a>
  </div>
</article>
```

## Related Posts

```astro
---
import { getCollection } from 'astro:content';
import PostCard from './PostCard.astro';

interface Props {
  currentSlug: string;
  category: string;
}

const { currentSlug, category } = Astro.props;

const posts = (await getCollection('blog', ({ data }) => !data.draft))
  .filter((post) => post.slug !== currentSlug && post.data.category === category)
  .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
  .slice(0, 3);
---

{posts.length > 0 && (
  <section class="bg-gray-50 py-12">
    <div class="container mx-auto px-4">
      <h2 class="text-2xl font-bold mb-8">Related Articles</h2>
      <div class="grid md:grid-cols-3 gap-8">
        {posts.map((post) => (
          <PostCard post={post} />
        ))}
      </div>
    </div>
  </section>
)}
```

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

## Content Guidelines

### Article Structure

```markdown
# H1: Main Title (matches page title)

Introduction paragraph with hook and promise.

## H2: First Main Section

Content...

### H3: Subsection if needed

Content...

## H2: Second Main Section

Content...

## H2: Conclusion / Next Steps

Summary and CTA.
```

### SEO Checklist

- [ ] Title under 60 characters
- [ ] Description under 160 characters
- [ ] One H1 only
- [ ] Logical heading hierarchy
- [ ] Target keyword in title, H1, first paragraph
- [ ] Internal links to service pages
- [ ] External links to authoritative sources
- [ ] Image alt text with keywords
- [ ] Meta description compelling

## Forbidden

- ❌ Articles without CTA
- ❌ Missing meta description
- ❌ Stock images without customization
- ❌ Thin content (<500 words)
- ❌ Duplicate content
- ❌ Orphan pages (no internal links)

## Definition of Done

- [ ] Content collection configured
- [ ] Article template with schema
- [ ] Listing page with filtering
- [ ] Category pages
- [ ] Related posts working
- [ ] RSS feed
- [ ] Each article has CTA
- [ ] Proper heading hierarchy
