# Content Collection Setup

## Collection Schema

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

## Schema Fields

- **title**: Article title (required)
- **description**: Meta description, max 160 chars (required)
- **pubDate**: Publication date (required)
- **updatedDate**: Last updated date (optional)
- **author**: Author name, defaults to 'Team'
- **image**: Featured image (optional)
- **imageAlt**: Image alt text (optional)
- **category**: Article category (required)
- **tags**: Array of tags (optional)
- **draft**: Draft status, defaults to false
