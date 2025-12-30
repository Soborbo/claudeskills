# Phase 4: Technical Implementation

## E-E-A-T Trust Signals (Critical for 2025)

### Proof-of-Experience Blocks

First-hand experience signals are now required for ranking. Include at least ONE:

```markdown
<ExperienceBlock type="case-study">
**Real Client Example:**
When we completed [Project Type] for [Client - anonymized], 
the total cost was £X. Here's the breakdown:
- Service A: £X
- Service B: £X
- Add-ons: £X
</ExperienceBlock>
```

```markdown
<ExperienceBlock type="data">
**Our Data (Jan-Dec 2024):**
Based on [N] projects we completed last year:
- Average cost: £X
- Most common issue: [Issue] (+£X avg)
- Peak season premium: +X%
</ExperienceBlock>
```

```markdown
<ExperienceBlock type="screenshot">
![Actual quote breakdown from our system](/images/quote-example-2025.png)
*Screenshot from our quoting system showing real pricing breakdown*
</ExperienceBlock>
```

### Experience Block Types

| Type | Use When | Example |
|------|----------|---------|
| `case-study` | Specific client story | "When we moved the Johnsons..." |
| `data` | Proprietary statistics | "Our 2024 data shows..." |
| `screenshot` | Visual proof | Quote systems, results, dashboards |
| `before-after` | Transformations | Packing results, organization |
| `process` | Behind-the-scenes | "Here's how our team handles..." |

**Rule:** Every commercial/comparison article MUST have at least one ExperienceBlock.

---

### Reputation Linking (Author Credibility)

Connect authors to external verification:

```yaml
# In authors collection
socials:
  linkedin: https://linkedin.com/in/author-name  # Required
  google_scholar: https://scholar.google.com/...   # If applicable
  industry_profile: https://bar.co.uk/member/...   # Professional body
  twitter: https://twitter.com/...
  
credentials:
  - text: "BAR Certified"
    verify_url: https://bar.co.uk/verify/12345    # Verification link
  - text: "15+ Years Experience"
  - text: "1,200+ Moves Completed"
    
awards:
  - "Which? Trusted Trader 2024"
  - "Industry Excellence Award 2023"
```

### Author Schema with Verification

```json
{
  "@type": "Person",
  "@id": "https://example.com/#author-john-smith",
  "name": "John Smith",
  "jobTitle": "Senior Consultant",
  "worksFor": { "@id": "https://example.com/#organization" },
  "sameAs": [
    "https://linkedin.com/in/john-smith",
    "https://industry-body.org/members/john-smith",
    "https://twitter.com/johnsmith"
  ],
  "hasCredential": [
    {
      "@type": "EducationalOccupationalCredential",
      "name": "Certified Professional",
      "credentialCategory": "Professional Certification",
      "recognizedBy": {
        "@type": "Organization",
        "name": "Industry Association"
      }
    }
  ],
  "knowsAbout": ["primary service", "related service", "industry topic"]
}
```

---

### Trust Badges Component

```astro
---
// src/components/TrustBadges.astro
interface Props {
  badges?: Array<{
    name: string;
    logo: string;
    url: string;
  }>;
}

const { badges } = Astro.props;

const defaultBadges = [
  { name: "BAR Member", logo: "/badges/bar.svg", url: "https://bar.co.uk/verify/..." },
  { name: "Which? Trusted", logo: "/badges/which.svg", url: "https://trustedtraders.which.co.uk/..." },
  { name: "Checkatrade", logo: "/badges/checkatrade.svg", url: "https://checkatrade.com/..." },
];

const displayBadges = badges || defaultBadges;
---

<aside class="trust-badges border rounded-lg p-4 bg-gray-50 my-6">
  <p class="text-sm text-gray-600 mb-3">Verified & Accredited:</p>
  <div class="flex flex-wrap gap-4 items-center">
    {displayBadges.map((badge) => (
      <a href={badge.url} target="_blank" rel="noopener" class="hover:opacity-80">
        <img src={badge.logo} alt={badge.name} class="h-10" />
      </a>
    ))}
  </div>
</aside>
```

**Placement:** After QueryAnswer or in AuthorCard

---

### Review/Testimonial Schema

```json
{
  "@type": "Review",
  "author": {
    "@type": "Person", 
    "name": "Jane Customer"
  },
  "reviewBody": "Excellent service, arrived on time...",
  "reviewRating": {
    "@type": "Rating",
    "ratingValue": 5,
    "bestRating": 5
  },
  "datePublished": "2024-12-15",
  "itemReviewed": {
    "@id": "https://example.com/#organization"
  }
}
```

---

### Aggregate Rating (For Service Pages)

```json
{
  "@type": "LocalBusiness",
  "@id": "https://example.com/#organization",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": 4.8,
    "reviewCount": 347,
    "bestRating": 5
  }
}
```

---

## E-E-A-T Checklist by Content Type

### Informational Content
- [ ] Author with relevant credentials
- [ ] External profile links (LinkedIn minimum)
- [ ] Sources cited for claims

### Commercial Content (YMYL)
- [ ] Named author with verifiable credentials
- [ ] ExperienceBlock with real data/case study
- [ ] Trust badges displayed
- [ ] Credential verification links
- [ ] "Last updated" date shown

### Comparison Content
- [ ] Author expertise in compared areas
- [ ] First-hand testing evidence
- [ ] Methodology explained
- [ ] No undisclosed affiliations

---

## Frontmatter Schema

```yaml
---
# Required
title: "How Much Does [Service] Cost in 2025?"  # max 60 chars
description: "UK [service] costs range from £X-£Y. Get pricing breakdown, cost factors, and money-saving tips."  # max 160 chars
pubDate: 2025-01-15
intent: commercial  # informational | commercial | comparison | transactional
topic: service-costs  # for pillar/cluster linking
primaryCTA: quote-calculator  # GTM tracking identifier
category: Pricing
author: john-smith  # reference to authors collection, or 'team'

# Recommended
entities:
  - primary service
  - cost factors
  - industry association
  - service options
  - insurance/guarantee

# Optional
updatedDate: 2025-01-20  # if content updated
pillar: false  # true for pillar pages
calculatorLink: /calculator  # for commercial intent
tags: [costs, budgeting, planning]
noindex: false  # true to exclude from search
ymyl: false  # true requires named author
experienceVerified: false  # true after human checks data
---
```

### Field Rules
- `title`: Include year for commercial content
- `description`: Start with key answer, include numbers
- `intent`: Must match CTA type
- `author`: Named author required if `ymyl: true`
- `entities`: 5-10 relevant entities

---

## Connected @graph Schema

Single JSON-LD block connecting Organization → Person → Article.

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://example.com/#organization",
      "name": "Company Name",
      "url": "https://example.com",
      "logo": {
        "@type": "ImageObject",
        "url": "https://example.com/logo.png"
      }
    },
    {
      "@type": "Person",
      "@id": "https://example.com/#author-john-smith",
      "name": "John Smith",
      "jobTitle": "Senior Moving Consultant",
      "worksFor": { "@id": "https://example.com/#organization" }
    },
    {
      "@type": "Article",
      "@id": "https://example.com/blog/service-costs#article",
      "headline": "How Much Does [Service] Cost in 2025?",
      "description": "UK service costs explained...",
      "datePublished": "2025-01-15",
      "dateModified": "2025-01-20",
      "author": { "@id": "https://example.com/#author-john-smith" },
      "publisher": { "@id": "https://example.com/#organization" },
      "about": [
        { "@type": "Thing", "name": "service costs" },
        { "@type": "Thing", "name": "pricing factors" }
      ],
      "speakable": {
        "@type": "SpeakableSpecification",
        "cssSelector": [".query-answer", ".tldr-block"]
      }
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://example.com" },
        { "@type": "ListItem", "position": 2, "name": "Blog", "item": "https://example.com/blog" },
        { "@type": "ListItem", "position": 3, "name": "Pricing" },
        { "@type": "ListItem", "position": 4, "name": "Service Costs 2025" }
      ]
    }
  ]
}
```

### Key Points
- Use `@id` references to connect nodes
- `worksFor` links Person to Organization
- `author` and `publisher` reference by `@id`
- `speakable` targets QueryAnswer and TL;DR for LLMs
- `about` contains main entities

---

## Image Handling

### Hero Image
```astro
<Picture
  src={post.data.image}
  alt="Descriptive alt with context"
  widths={[640, 1024, 1400]}
  formats={['avif', 'webp']}
  loading="eager"
  fetchpriority="high"
  class="aspect-[16/9]"
/>
```

### Inline Images
```astro
<Picture
  src={image}
  alt="What is shown and why it matters"
  widths={[400, 800]}
  formats={['avif', 'webp']}
  loading="lazy"
/>
```

### Rules

| Type | Loading | Priority |
|------|---------|----------|
| Hero | eager | high |
| Above fold (max 3) | eager | - |
| Below fold | lazy | - |

### Alt Text
- Describe what's shown AND why
- Include keyword naturally
- Under 125 characters
- No "image of" prefix

✅ "Professional team completing service with specialized equipment"
❌ "image of workers"

---

## llms.txt Update

After publishing, add entry to `/public/llms.txt`:

```markdown
## Latest Content

- [How Much Does [Service] Cost in 2025?](/blog/service-costs-2025): UK pricing £X-£Y by project type. Includes breakdown, saving tips, and quote calculator link.
```

### Entry Rules
- Title as link text
- URL path
- Summary under 100 tokens (~400 chars)
- Lead with key data/numbers

---

## Multilingual (If Applicable)

### hreflang Tags
```html
<link rel="alternate" hreflang="en" href="https://example.com/blog/post" />
<link rel="alternate" hreflang="hu" href="https://example.com/hu/blog/post" />
<link rel="alternate" hreflang="x-default" href="https://example.com/blog/post" />
```

### Frontmatter
```yaml
lang: en  # or 'hu'
translationOf: hungarian-post-slug  # if this is a translation
```

### Reading Time
- English: 200 words/minute
- Hungarian: 180 words/minute (longer compound words)

---

## Technical Checklist

Before Phase 5:

- [ ] All frontmatter fields present
- [ ] Intent matches CTA type
- [ ] Entities array populated (5-10)
- [ ] @graph schema complete
- [ ] @id references correct
- [ ] Speakable targets QueryAnswer/TL;DR
- [ ] Hero image: eager + high priority
- [ ] Other images: lazy
- [ ] All images have descriptive alt text
- [ ] llms.txt entry drafted
