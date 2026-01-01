# Phase 4: Technical Implementation

**⚠️ CRITICAL: All code must comply with HARD-RULES.md (TypeScript strict mode, performance budgets, security)**

---

## TypeScript Requirements (HARD-RULES Compliance)

All blog components and utilities must follow strict TypeScript standards.

### Component Typing

```typescript
// ❌ BAD - No types
export const ExpertInsight = ({ avatar, tip }) => {
  return <aside>...</aside>
}

// ✅ GOOD - Explicit Props interface
interface Props {
  avatar: string;
  tip: string;
}

export const ExpertInsight = ({ avatar, tip }: Props) => {
  return <aside>...</aside>
}
```

### Strict Mode Requirements

- ✅ `strict: true` in `tsconfig.json`
- ❌ NO `any` types (use `unknown` and type guards if needed)
- ❌ NO `@ts-ignore` without GitHub issue link
- ✅ Explicit return types on all functions
- ❌ NO generic variable names: `data`, `result`, `item`, `temp`, `info`, `response`

```typescript
// ❌ BAD
function getPost(slug: any) {
  const data = await fetch(...);
  return data;
}

// ✅ GOOD
interface BlogPost {
  title: string;
  content: string;
  frontmatter: Frontmatter;
}

async function getPost(slug: string): Promise<BlogPost> {
  const post = await fetch(...);
  return post;
}
```

---

## Component Hydration Strategy (HARD-RULES Compliance)

Interactive blog components must use correct hydration directives.

### Forbidden: client:load

❌ **NEVER use `client:load`** (HARD-RULES forbidden - blocks render)

```astro
<!-- ❌ BAD - Blocks rendering -->
<Calculator client:load />
```

### Required: client:visible or client:idle

✅ **Use appropriate directive:**

```astro
<!-- ✅ GOOD - Lazy loads when visible -->
<Calculator client:visible />

<!-- ✅ GOOD - Loads after page interactive -->
<NewsletterForm client:idle />

<!-- ✅ GOOD - Loads when user interacts -->
<CommentSection client:media="(max-width: 768px)" />
```

### Directive Guidelines

| Component Type | Directive | Reason |
|----------------|-----------|--------|
| Above-fold calculator | `client:idle` | Loads after critical content |
| Below-fold interactive | `client:visible` | Loads when scrolled into view |
| Heavy components | `client:visible` | Defers until needed |
| Third-party embeds (video) | `client:visible` | Prevents performance hit |

---

## Security: CSP Headers for Embedded Content

**Content Security Policy headers required for embedded calculators, videos, and third-party content.**

### CSP Configuration

```typescript
// astro.config.mjs
export default defineConfig({
  server: {
    headers: {
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' https://www.youtube.com https://www.googletagmanager.com",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "font-src 'self'",
        "connect-src 'self' https://www.google-analytics.com",
        "frame-src 'self' https://www.youtube.com https://calculator.example.com",
        "object-src 'none'"
      ].join('; ')
    }
  }
});
```

### Embedding Calculators

```astro
<!-- With CSP-compliant iframe -->
<iframe
  src="/calculators/quote-calculator"
  title="Quote Calculator"
  sandbox="allow-scripts allow-same-origin allow-forms"
  loading="lazy"
  width="100%"
  height="600"
  style="border: 0;"
></iframe>
```

**Security checklist for embeds:**
- [ ] `sandbox` attribute limits iframe capabilities
- [ ] `loading="lazy"` for below-fold embeds
- [ ] CSP headers allow the iframe source
- [ ] No sensitive data passed to third-party embeds

### YouTube Video Embeds (Facade Pattern)

```astro
---
// Use facade component to avoid loading YouTube until user clicks
import YouTubeFacade from '@components/YouTubeFacade.astro';
---

<YouTubeFacade
  videoId="dQw4w9WgXcQ"
  title="Video Title for Accessibility"
  thumbnail="/images/video-thumb.webp"
/>
```

**Facade component:**
```astro
---
interface Props {
  videoId: string;
  title: string;
  thumbnail: string;
}

const { videoId, title, thumbnail } = Astro.props;
---

<div class="youtube-facade" data-video-id={videoId}>
  <img src={thumbnail} alt={title} loading="lazy" />
  <button type="button" aria-label={`Play video: ${title}`}>
    <svg><!-- Play icon --></svg>
  </button>
</div>

<script>
  document.querySelectorAll('.youtube-facade button').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const facade = e.target.closest('.youtube-facade');
      const videoId = facade.dataset.videoId;
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
      iframe.allow = 'accelerometer; autoplay; encrypted-media; gyroscope';
      iframe.allowFullscreen = true;
      facade.replaceWith(iframe);
    });
  });
</script>
```

---

## Video Chapters (YouTube SEO + Accessibility)

If embedding video, include chapter timestamps in the content surrounding the video.

### Implementation

**In the article content (before or after video embed):**

```markdown
<YouTubeFacade
  videoId="abc123"
  title="Complete Solar Panel Installation Guide"
  thumbnail="/images/video-thumb.webp"
/>

**Video chapters:**
- 0:00 - Introduction to solar installation costs
- 0:45 - Standard home installation breakdown
- 2:10 - Additional costs to consider (roof repairs, electrical upgrades)
- 3:30 - How to save money on installation
- 5:15 - Getting accurate quotes from installers
- 6:40 - Timeline and what to expect
```

### VideoObject Schema with Chapters

```json
{
  "@type": "VideoObject",
  "name": "Complete Solar Panel Installation Guide",
  "description": "Comprehensive guide covering solar installation costs, timelines, and money-saving tips for UK homeowners",
  "thumbnailUrl": "https://example.com/images/video-thumb.webp",
  "uploadDate": "2025-01-15",
  "duration": "PT7M20S",
  "contentUrl": "https://youtube.com/watch?v=abc123",
  "embedUrl": "https://youtube.com/embed/abc123",
  "hasPart": [
    {
      "@type": "Clip",
      "name": "Standard home installation breakdown",
      "startOffset": 45,
      "endOffset": 130,
      "url": "https://youtube.com/watch?v=abc123&t=45s"
    },
    {
      "@type": "Clip",
      "name": "Additional costs to consider",
      "startOffset": 130,
      "endOffset": 210,
      "url": "https://youtube.com/watch?v=abc123&t=130s"
    },
    {
      "@type": "Clip",
      "name": "How to save money on installation",
      "startOffset": 210,
      "endOffset": 315,
      "url": "https://youtube.com/watch?v=abc123&t=210s"
    }
  ]
}
```

### Benefits

- **Appears in YouTube search** as video chapters (seekable timeline)
- **Improves accessibility** - users jump to relevant section
- **Increases engagement** - lower bounce rate, higher watch time
- **LLM extraction** - AI can reference specific sections
- **Featured snippets** - Google may show chapter links

### Guidelines

**Number of chapters:**
- Minimum: 3 chapters
- Ideal: 5-8 chapters
- Maximum: 12 chapters (beyond this becomes cluttered)

**Chapter titles:**
- Descriptive, specific (not "Part 1", "Section 2")
- Include keywords naturally
- 3-8 words ideal
- Match actual video content

**Timestamp format:**
- `M:SS` for videos under 10 minutes (0:45, 2:10, 5:15)
- `H:MM:SS` for longer videos (1:05:30)
- Start with 0:00 for introduction

**Video integration:**
- Place video at 40-60% scroll depth (mid-article)
- Surround with contextual text explaining what video covers
- Include transcript link or text summary below video

---

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

## FAQ Schema (Critical for PAA & LLM Extraction)

**Required for commercial/comparison content.**

FAQ schema targets Google's "People Also Ask" boxes and provides clear Q&A for LLMs.

### Implementation

Place FAQ section near end of article (before conclusion):

```markdown
## Frequently Asked Questions

<FAQSchema>
  <FAQ>
    <Question>How long do solar panels last?</Question>
    <Answer>Most solar panels last 25-30 years with minimal degradation. Premium panels come with 25-year performance warranties guaranteeing 80-85% output after 25 years. Inverters typically need replacement after 10-15 years.</Answer>
  </FAQ>

  <FAQ>
    <Question>Do I need planning permission for solar panels?</Question>
    <Answer>Most UK homes don't need planning permission for rooftop solar panels under permitted development rights. Exceptions include listed buildings, conservation areas, and installations exceeding 1 meter beyond the roof slope.</Answer>
  </FAQ>

  <FAQ>
    <Question>What happens during a power cut?</Question>
    <Answer>Standard grid-tied solar systems shut down during power cuts for safety. To maintain power during outages, you need a battery storage system with islanding capability, adding £4,000-£8,000 to installation costs.</Answer>
  </FAQ>
</FAQSchema>
```

### FAQ Schema JSON-LD

```json
{
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How long do solar panels last?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Most solar panels last 25-30 years with minimal degradation. Premium panels come with 25-year performance warranties guaranteeing 80-85% output after 25 years. Inverters typically need replacement after 10-15 years."
      }
    },
    {
      "@type": "Question",
      "name": "Do I need planning permission for solar panels?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Most UK homes don't need planning permission for rooftop solar panels under permitted development rights. Exceptions include listed buildings, conservation areas, and installations exceeding 1 meter beyond the roof slope."
      }
    },
    {
      "@type": "Question",
      "name": "What happens during a power cut?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Standard grid-tied solar systems shut down during power cuts for safety. To maintain power during outages, you need a battery storage system with islanding capability, adding £4,000-£8,000 to installation costs."
      }
    }
  ]
}
```

### FAQ Guidelines

**Number of questions:**
- Standard article: 3-5 FAQs
- Pillar article: 5-8 FAQs

**Answer length:**
- 40-80 words per answer
- Direct, specific, cite sources if using statistics

**Question types:**
- Address real user questions (check "People Also Ask" in Google)
- Include commercial intent questions ("how much", "is it worth")
- Answer objections ("what if", "do I need")

**Benefits:**
- Featured in "People Also Ask" boxes
- LLMs extract for RAG responses
- Improves dwell time (users find quick answers)
- Adds structured data for knowledge graphs

---

## HowTo Schema (For Process/Guide Articles)

Use for articles explaining processes: "How to choose", "How to calculate", "How to compare"

### HowTo Schema JSON-LD

```json
{
  "@type": "HowTo",
  "name": "How to Choose Solar Panel Installers",
  "description": "Step-by-step guide to selecting qualified solar panel installers in the UK",
  "step": [
    {
      "@type": "HowToStep",
      "name": "Verify Certifications",
      "text": "Check installer has MCS certification and NICEIC accreditation. MCS certification is mandatory for government incentives and manufacturer warranties.",
      "url": "https://example.com/blog/choosing-installers#certifications"
    },
    {
      "@type": "HowToStep",
      "name": "Compare Quotes",
      "text": "Get 3-5 quotes, ensuring they include identical specifications. Compare kWp capacity, panel brands, inverter types, and warranty terms.",
      "url": "https://example.com/blog/choosing-installers#quotes"
    },
    {
      "@type": "HowToStep",
      "name": "Check References",
      "text": "Ask for 2-3 recent customer references. Contact them to verify installation quality, timeline adherence, and post-installation support.",
      "url": "https://example.com/blog/choosing-installers#references"
    },
    {
      "@type": "HowToStep",
      "name": "Verify Insurance",
      "text": "Confirm installer has public liability insurance (minimum £5 million) and workmanship warranty (minimum 2 years).",
      "url": "https://example.com/blog/choosing-installers#insurance"
    }
  ],
  "totalTime": "PT2H"
}
```

### When to Use HowTo Schema

✅ **Use for:**
- "How to choose" guides
- Step-by-step instructions
- Process explanations
- Comparison methodologies

❌ **Don't use for:**
- Cost breakdowns (use Article schema)
- Informational content without steps
- FAQs (use FAQPage schema)

### HowTo Guidelines

**Number of steps:**
- Minimum: 3 steps
- Maximum: 10 steps (if more, break into multiple guides)

**Step descriptions:**
- 20-60 words per step
- Specific, actionable
- Include "why" not just "what"

**totalTime field:**
- Use ISO 8601 duration format (PT2H = 2 hours)
- Estimate realistic time to complete all steps

---

## Meta Description (LLM Summarization + CTR Optimization)

Meta descriptions serve dual purpose:
1. Human click-through from search results
2. LLM summary source for AI overviews

### Formula

```
[Direct Answer] + [Key Benefit] + [Social Proof/Number] + [CTA]
```

**Examples:**

✅ **Commercial intent:**
```
UK solar panel installation costs £5,000-£8,000 for standard homes. Get accurate pricing, compare quotes from 200+ verified installers, and calculate your savings in 2 minutes.
```
(159 chars)

✅ **Informational intent:**
```
Solar panels last 25-30 years with minimal maintenance. Learn performance expectations, warranty details, and long-term cost savings from industry experts.
```
(157 chars)

✅ **Comparison intent:**
```
Monocrystalline vs polycrystalline solar panels compared: efficiency, cost, lifespan. Based on 200+ installations, find which suits your roof and budget.
```
(156 chars)

✅ **Transactional intent:**
```
Get instant solar panel quotes from MCS-certified UK installers. Compare prices, check availability, and book surveys online. Free, no-obligation quotes in 24 hours.
```
(159 chars)

### Requirements

- **Length:** 150-160 characters (Google's display limit)
- **Include:** Primary keyword, number/statistic, year (for dated content)
- **Tone:** Direct, benefit-focused, no fluff
- **Avoid:** "Click here", "Learn more", generic phrases
- **First sentence:** Must be a direct answer to title question

### LLM Optimization

LLMs prioritize meta descriptions when summarizing. Ensure:
- First sentence = direct answer to title question
- Includes key entity/topic clearly
- Mentions any unique data points ("based on 200+ installations")
- No marketing fluff that dilutes information density

**Testing:**
Ask yourself: "If an LLM could only read the meta description, would it accurately answer the user's query?"

---

## Image Handling

### Image SEO (Critical for Visual Search & Accessibility)

#### File Naming Convention

❌ **Bad:** `IMG_1234.jpg`, `screenshot.png`, `image-1.webp`

✅ **Good:** `solar-panel-installation-london-2025.webp`

**Rules:**
- Descriptive file names with primary keyword
- Lowercase, hyphens (not underscores)
- Include year for dated content
- Include location for local services
- Avoid generic names: `photo.jpg`, `pic1.jpg`, `final.jpg`

**Examples:**
```
solar-panel-roof-installation-process.webp
cost-breakdown-chart-uk-2025.webp
mcs-certified-installer-badge.svg
before-after-energy-bills-comparison.png
```

#### Image Captions

**Required for:**
- Screenshots of tools/systems (E-E-A-T proof)
- Before/after comparisons
- Case study images
- Data visualizations/charts
- Process photos

**Format:**
```markdown
![Solar panel installation on Victorian terrace roof](/images/solar-victorian-terrace-install.webp)
*Professional installation on a Victorian terrace in Islington, completed in 1.5 days (March 2025)*
```

**Caption guidelines:**
- Provide context beyond alt text
- Include date/location for credibility
- Cite source for third-party images
- Keep under 20 words
- Start with active description

#### Surrounding Text Optimization

Google uses text surrounding images for context. Ensure:
- Primary keyword mentioned within 20 words before/after image
- Image placement logically relates to adjacent paragraph
- Don't orphan images (always surrounded by relevant text)
- Previous paragraph should introduce what image shows

**Example:**
```markdown
The installation process typically takes 1-2 days for standard homes.
Professional teams arrive with all equipment and complete the mounting,
wiring, and commissioning in a single visit.

![Professional team installing solar panels on residential roof](/images/team-install.webp)
*Two-person installation team mounting panels on a south-facing roof (typical 1-day job)*

After mounting the panels, the electrician connects the inverter to your
consumer unit and configures the system for grid connection.
```

#### Image Structured Data

For key images (hero, case studies, results):

```json
{
  "@type": "ImageObject",
  "contentUrl": "https://example.com/images/solar-install.webp",
  "caption": "Solar panel installation on Victorian terrace, Islington 2025",
  "creditText": "Company Name Photography",
  "creator": {
    "@type": "Person",
    "name": "Photographer Name"
  },
  "copyrightNotice": "© 2025 Company Name",
  "license": "https://creativecommons.org/licenses/by/4.0/"
}
```

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

## Multi-Platform Content Strategy (Neil Patel 2025)

In 2025, SEO is evolving to "**Search Everywhere Optimization**" - optimizing across multiple platforms, not just Google.

### Why Multi-Platform Matters

Neil Patel's research shows:
- **Blog articles** generate 29% of organic traffic
- **Tools/calculators** generate 17% of traffic
- AI pulls from multiple sources (ChatGPT uses Bing, Perplexity aggregates)
- Brand mentions across platforms boost overall rankings

### Platform-Specific Strategy

**YouTube (Highest Priority for Long-Form)**
- Quality long-form content thrives on YouTube
- Create video versions of pillar articles
- Include video chapters (min 3) for seekability
- Embed in blog with facade loading (already covered)
- Target: 1 video per 2-3 pillar articles

**LinkedIn (B2B/Professional)**
- Main platform for B2B and enterprise deals
- Repurpose article insights as LinkedIn posts
- Link back to full article for traffic
- Share case studies and data from ExperienceBlocks

**Reddit (Community Engagement)**
- Answer questions in relevant subreddits
- Link to your comprehensive articles when genuinely helpful
- Build reputation, not just links (avoid spam)
- Monitor r/[your_topic] for content ideas

**Platform Content Matrix:**

| Platform | Content Type | Frequency | Purpose |
|----------|--------------|-----------|---------|
| Blog | Full articles | 2-4/month | Main SEO + authority |
| YouTube | Video guides | 1-2/month | Video SEO + engagement |
| LinkedIn | Insights/stats | 3-5/week | Professional reach |
| Reddit | Answers/links | As relevant | Community building |

### Cross-Platform SEO Tactics

**Brand mentions:**
- Encourage customers to mention brand on social platforms
- Monitor brand mentions (Google Alerts, Mention.com)
- Respond to mentions to build visibility

**Bing optimization:**
- Since ChatGPT pulls from Bing, ensure Bing Webmaster Tools setup
- Submit sitemap to Bing
- Optimize for Bing's ranking factors (more keyword-focused than Google)

**Tool/calculator prominence:**
- Interactive tools generate 22% of leads (Neil Patel data)
- Promote calculators across all platforms
- Embed calculators in YouTube video descriptions

---

## Review Integration & Social Proof (Critical for 2025)

Neil Patel's data: **Positive reviews increase organic traffic by 100%+** compared to negative reviews.

### Review Collection Strategy

**Platforms to prioritize:**
1. **Google Business Profile** - Most important for local SEO
2. **Trustpilot/Reviews.io** - Third-party verification
3. **Industry-specific** - Trade body reviews, Which? Trusted Trader
4. **Yelp/Nextdoor** - Local community platforms

**Collection tactics:**
- Email follow-up 7-14 days after service completion
- Make it easy: direct link to review page
- Ask happy customers specifically (NPS 9-10 scores)
- Never incentivize (against most platforms' ToS)

### Integrating Reviews into Content

**Review Schema:**

```json
{
  "@type": "Review",
  "author": {
    "@type": "Person",
    "name": "Sarah Johnson"
  },
  "reviewRating": {
    "@type": "Rating",
    "ratingValue": 5,
    "bestRating": 5
  },
  "reviewBody": "Excellent solar installation service. Team completed our 4kW system in one day, exactly as quoted. System has been generating perfectly for 6 months.",
  "datePublished": "2025-12-15",
  "itemReviewed": {
    "@type": "Service",
    "name": "Solar Panel Installation"
  }
}
```

**Visual review display:**

```markdown
<ReviewHighlight
  rating={4.8}
  reviewCount={347}
  source="Google"
  quote="Professional team, completed on time and on budget"
  author="Michael R., London"
  date="January 2026"
  verified={true}
/>
```

**Placement:**
- After QueryAnswer (builds immediate trust)
- Mid-article before CTA (reinforces credibility)
- Sidebar component (persistent visibility)

### Aggregate Rating Display

**Requirements:**
- Minimum 10 reviews before showing aggregate
- Update monthly (fresh data)
- Show review source (Google, Trustpilot, etc.)
- Link to full review pages

**AggregateRating schema:**

```json
{
  "@type": "LocalBusiness",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": 4.8,
    "reviewCount": 347,
    "bestRating": 5,
    "worstRating": 1
  },
  "review": [
    {
      "@type": "Review",
      "author": {"@type": "Person", "name": "Customer Name"},
      "reviewRating": {"@type": "Rating", "ratingValue": 5}
    }
  ]
}
```

### Review Response Strategy

**Respond to ALL reviews:**
- **Positive reviews:** Thank customer, highlight specific detail they mentioned
- **Neutral reviews:** Address concerns, offer to resolve offline
- **Negative reviews:** Professional response, offer resolution, never defensive

**Response timeframe:**
- Negative reviews: Within 24 hours
- Positive reviews: Within 3-5 days

---

## Content Creation Time Allocation (Neil Patel Method)

Writing is only **35% of content creation**. Research and planning dominate.

### Time Breakdown (Standard 1500-word article)

**Total time:** ~6-8 hours

| Phase | % of Time | Hours | Activity |
|-------|-----------|-------|----------|
| **Research** | 25% | 1.5-2h | SERP analysis, gap identification, data collection |
| **Planning** | 15% | 1-1.2h | Outline, H2 structure, keyword mapping |
| **Writing** | 35% | 2-2.8h | Actual content creation |
| **Editing** | 15% | 1-1.2h | Readability, fact-checking, flow |
| **Technical** | 10% | 0.6-0.8h | Schema, meta, images, internal links |

### Research Phase (Critical - Don't Skip)

**What to research (25% of time):**
1. **SERP analysis** - Top 3 results, identify consensus
2. **Gap identification** - What's missing? Your unique angle
3. **Data collection** - Statistics, case studies, expert quotes
4. **Keyword research** - Primary + semantic keywords
5. **Competitor analysis** - What works, what doesn't
6. **Authority sources** - Find 4+ citable external sources

**Tools for research:**
- Google Search Console (existing rankings)
- AnswerThePublic (questions people ask)
- Google Trends (topic trending data)
- BuzzSumo (most-shared content)

### Writing Efficiency Tips

**Use research to write faster:**
- Detailed outline = faster writing (less thinking mid-draft)
- Collect quotes/stats during research (don't hunt mid-write)
- Draft H2s first, fill in prose after
- Don't edit while writing (separate phases)

**Target pace:**
- **500 words/hour** when properly researched
- **300 words/hour** without research (slower, more stopping)

**Batch similar tasks:**
- Write all articles' outlines in one session
- Collect all images in one session
- Add all schema/technical in one session

---

## Content Decay Monitoring (Ranking Protection)

Content decay occurs when previously high-ranking articles lose positions due to algorithm updates, competitor improvements, or outdated information. Implement systematic monitoring to catch and fix decay early.

### What is Content Decay?

**Definition:** A measurable drop in rankings, traffic, or conversions for previously successful content.

**Common causes:**
- Outdated information (statistics, regulations, pricing from 2+ years ago)
- Competitors publishing more comprehensive content
- Algorithm updates favoring different signals
- Broken external links or outdated sources
- Technical issues (site speed degradation, mobile issues)
- Cannibalization (newer content competing for same keywords)

### Automated Monitoring Setup

**Tools required:**
- Google Search Console (free)
- Google Analytics 4 (free)
- Rank tracker (Ahrefs, SEMrush, or AccuRanker)
- Spreadsheet for tracking

**Monitoring frequency:**
- **Weekly:** Top 10 money pages (high conversion value)
- **Bi-weekly:** Top 20-50 traffic drivers
- **Monthly:** All content library

### Key Metrics to Monitor

#### 1. Ranking Drops (Priority 1)

**Alert triggers:**
- **Critical:** Drop >5 positions for primary keyword
- **Warning:** Drop 3-5 positions for primary keyword
- **Monitor:** Drop 1-2 positions (natural fluctuation)

**Tracking setup:**

```bash
# Weekly rank check for critical keywords
Primary keyword rankings (track in spreadsheet):
- "solar panel costs uk": Position 2 → Position 5 (🔴 CRITICAL)
- "how much solar panels": Position 4 → Position 6 (🟡 WARNING)
- "solar installation guide": Position 3 → Position 4 (🟢 MONITOR)
```

**Action thresholds:**
- **>5 position drop:** Immediate investigation and update within 7 days
- **3-5 position drop:** Schedule update within 2 weeks
- **1-2 position drop:** Monitor for another week (may recover naturally)

#### 2. Traffic Declines (Priority 2)

**Alert triggers:**
- **Critical:** >30% traffic drop month-over-month
- **Warning:** 15-30% traffic drop month-over-month
- **Monitor:** 5-15% traffic drop (seasonal variation possible)

**Google Analytics 4 setup:**

```
Custom Report: Content Decay Alert
- Dimension: Page path
- Metrics: Sessions (current month vs previous month, % change)
- Filter: Organic traffic only
- Alert: Email if >30% decline for any page with >100 sessions/month
```

**Action thresholds:**
- **>30% drop:** Emergency content audit, update within 3 days
- **15-30% drop:** Scheduled update within 1 week
- **5-15% drop:** Investigate cause (algorithm update? seasonality?)

#### 3. Click-Through Rate Drops (Priority 3)

**Alert triggers:**
- **Critical:** CTR drops >20% while maintaining same position
- **Warning:** CTR drops 10-20%

**Google Search Console setup:**

```
Performance Report:
- Date range: Last 28 days vs previous 28 days
- Group by: Page
- Filter: Impressions >1000
- Sort by: CTR % change (descending)
- Alert: Investigate any page with CTR drop >20%
```

**Common causes:**
- **Competitor improved meta descriptions** (more compelling than yours)
- **SERP features changed** (featured snippet now shows, reducing organic CTR)
- **Title no longer matches search intent** (outdated year, obsolete phrasing)

#### 4. Conversion Rate Drops (Priority 4)

**Alert triggers:**
- **Critical:** Conversion rate drops >25% while traffic stable
- **Warning:** Conversion rate drops 10-25%

**Tracking:**
```
GA4 Conversions (by page):
- Goal: Quote form submissions, calculator uses, downloads
- Monitor: Conversion rate per page (not total conversions)
- Alert: >25% drop = investigate page changes, CTA placement, form issues
```

### Content Decay Audit Process

When decay detected, follow this systematic audit:

#### Step 1: Identify Decay Type (10 minutes)

**Questions to answer:**
- Is this keyword-specific (ranking drop) or site-wide (algorithm update)?
- Did traffic drop match ranking drop, or is CTR the issue?
- Did a competitor launch new content on this topic recently?
- Has Google updated its SERP features for this query?

**Tools:**
- Google Search Console (Performance → Queries → filter by page)
- Ahrefs (Site Explorer → Organic Keywords → filter by ranking drop)
- Manual SERP check (search the keyword, see what changed)

#### Step 2: SERP Analysis (15 minutes)

**Current SERP audit:**

```markdown
Target keyword: "solar panel costs uk"

Current SERP (as of [Date]):
1. competitor1.com - Updated Jan 2026, 3,200 words, calculator, video
2. competitor2.com - Published Dec 2025, 2,800 words, comparison table
3. **YOUR SITE** - Last updated Mar 2024, 1,800 words (🚨 OUTDATED)

SERP features present:
- Featured snippet: competitor1.com (paragraph snippet)
- PAA boxes: 8 questions (we answer 2/8)
- Video carousel: Present (we have no video)
- Image pack: Present (our images not showing)

Competitive gap:
- Our content is 2 years outdated
- Competitors have interactive calculators (we don't)
- Competitors targeting PAA questions we missed
- Our title doesn't include "2026" (competitors do)
```

#### Step 3: Content Freshness Check (10 minutes)

**Audit your article for outdated signals:**

- [ ] Title includes old year or no year ("2024 Guide" or no date)
- [ ] Statistics older than 12 months
- [ ] External links to outdated sources or 404s
- [ ] Screenshots showing old UI or pricing
- [ ] Regulatory information changed (building codes, certifications)
- [ ] Examples/case studies older than 18 months
- [ ] No "Last updated" date shown
- [ ] `updatedDate` in frontmatter not recent

#### Step 4: Decide: Update, Consolidate, or Delete (5 minutes)

| Scenario | Action | Timeframe |
|----------|--------|-----------|
| **High traffic + ranking drop** | Update comprehensively | Within 7 days |
| **Medium traffic + content outdated** | Major refresh | Within 14 days |
| **Low traffic + keyword still valuable** | Minor update | Within 30 days |
| **Low traffic + keyword no longer searched** | Consolidate or delete | Within 60 days |
| **Cannibalization (internal competition)** | Consolidate into one article | Within 14 days |

### Update Strategies by Decay Cause

#### Decay Cause: Outdated Information

**Update checklist:**
- [ ] Change year in title (e.g., "2024" → "2026")
- [ ] Update all statistics with latest data
- [ ] Refresh examples/case studies (use recent projects)
- [ ] Check external links (fix 404s, replace outdated sources)
- [ ] Update screenshots if UI changed
- [ ] Add "Last updated: [Month Year]" banner at top
- [ ] Update `updatedDate` in frontmatter
- [ ] Update schema `dateModified` field

**Estimated effort:** 2-4 hours
**Expected recovery:** Rankings stabilize within 2-4 weeks

#### Decay Cause: Competitor Improved Content

**Update checklist:**
- [ ] Audit top 3 competitors (what do they have that you don't?)
- [ ] Add missing sections/topics competitors cover
- [ ] Match or exceed competitor word count (if yours is thinner)
- [ ] Add interactive elements they have (calculators, tools)
- [ ] Improve visuals (custom graphics vs their stock photos)
- [ ] Target PAA questions they answer (but you don't)
- [ ] Add video if competitors have video embeds

**Estimated effort:** 6-12 hours (major content expansion)
**Expected recovery:** Rankings improve within 4-8 weeks

#### Decay Cause: Algorithm Update

**Update checklist:**
- [ ] Review algorithm update focus (E-E-A-T? Helpful Content?)
- [ ] Add/strengthen E-E-A-T signals (author bio, credentials, sources)
- [ ] Improve experience signals (add first-person insights, case studies)
- [ ] Reduce AI-like patterns (vary paragraph structure, add human voice)
- [ ] Add original data/research (surveys, testing, client data)
- [ ] Strengthen expertise signals (detailed how-to, insider tips)

**Estimated effort:** 4-8 hours (E-E-A-T improvements)
**Expected recovery:** Rankings stabilize within 6-12 weeks (algorithm recovery slower)

#### Decay Cause: SERP Features Changed

**Update checklist:**
- [ ] If competitor captured featured snippet: Optimize for Position 0
- [ ] If PAA boxes appeared: Add FAQ section answering those questions
- [ ] If video carousel appeared: Create/embed video content
- [ ] If local pack appeared: Optimize for local SEO (add city names)
- [ ] If image pack appeared: Improve image SEO (file names, alt text)

**Estimated effort:** 2-6 hours (depends on feature type)
**Expected recovery:** SERP feature capture within 2-4 weeks

### Automated Decay Alerts

**Set up these automated alerts:**

#### Google Search Console (free)

```
Email alerts:
1. Performance → Custom report → Filter: Top 20 pages
2. Set alert: Email weekly if any page drops >5 positions
3. Set alert: Email monthly for CTR drops >20%
```

#### Google Analytics 4 (free)

```
Custom alerts:
1. Traffic drops: >30% decline vs previous period (any page with >100 sessions/month)
2. Conversion drops: >25% decline vs previous period (goal completions)
3. Frequency: Weekly emails
```

#### Spreadsheet Tracking (manual but effective)

```markdown
| URL | Primary Keyword | Position (Week 1) | Position (Week 2) | Change | Alert |
|-----|----------------|------------------|------------------|--------|-------|
| /solar-costs | solar panel costs uk | 3 | 7 | -4 | 🔴 UPDATE |
| /installation-guide | solar installation uk | 5 | 6 | -1 | 🟢 MONITOR |
| /best-panels | best solar panels uk | 2 | 2 | 0 | ✅ STABLE |
```

**Update weekly:** Copy-paste from rank tracker → auto-calculate change → conditional formatting highlights declines.

### Content Decay Prevention

**Proactive strategies to minimize decay:**

1. **Scheduled quarterly reviews** (prevent decay before it happens)
   - Commercial content: Review every 6 months
   - Informational content: Review every 12 months
   - YMYL content: Review every 3 months
   - Seasonal content: Review annually before peak season

2. **"Last reviewed" dates visible**
   ```markdown
   > **Last reviewed:** January 2026 - All pricing and statistics verified current.
   ```

3. **Evergreen content strategy**
   - Write timeless core principles (less likely to decay)
   - Separate time-sensitive sections (easier to update)
   - Use relative dates where possible ("in recent years" not "in 2024")

4. **Competitor monitoring**
   - Track when competitors publish on your topics
   - Set Google Alerts for your primary keywords
   - Monthly SERP checks for money keywords

5. **Update calendar**
   ```markdown
   | Article | Last Updated | Next Review Due | Priority |
   |---------|-------------|----------------|----------|
   | Solar Costs Guide | Jan 2026 | Jul 2026 | High |
   | Installation Process | Dec 2025 | Dec 2026 | Medium |
   ```

### Measuring Decay Recovery

**After updating decayed content, track recovery:**

**Week 1-2 after update:**
- Re-crawl requested in Google Search Console (speeds up indexing)
- Monitor rankings daily (expect some volatility)
- Check if featured snippet captured

**Week 3-4:**
- Rankings should stabilize or improve
- Traffic recovery begins (lags rankings by 1-2 weeks)
- Monitor CTR improvements

**Week 5-8:**
- Full traffic recovery expected (if update was comprehensive)
- Conversion rates normalize
- New backlinks may appear (if content significantly improved)

**Success metrics:**
- **Rankings:** Return to within 2 positions of pre-decay ranking
- **Traffic:** Recover to 90%+ of pre-decay traffic
- **CTR:** Match or exceed pre-decay CTR
- **Conversions:** Return to baseline conversion rate

**If recovery doesn't happen within 8 weeks:** Content may have deeper issues (thin content, intent mismatch, technical problems) or competitor advantage is too strong (consider Skyscraper Technique).

---

## Content Pruning Strategy (Quality Over Quantity)

**Content pruning** = systematically removing, consolidating, or improving low-performing content to boost overall site authority.

### Why Prune Content?

**Google's Helpful Content Update** (2022-2024) penalizes sites with high ratios of low-quality to high-quality content. **Better to have 50 excellent pages than 200 mediocre pages.**

**Benefits of pruning:**
- **Crawl budget optimization** — Google spends more time on quality pages
- **Site authority signal** — Higher average page quality improves overall rankings
- **User experience** — Less clutter, easier to find best content
- **Link equity** — Internal links distributed among fewer, better pages
- **Maintenance efficiency** — Less content to update and monitor

**Data:**
- Studies show 10-20% traffic increase after aggressive pruning (removing bottom 30-40% of content)
- Sites with <100 pages often outperform sites with 1000+ thin pages

### Content Audit Process (Quarterly)

#### Step 1: Export All Content Performance (30 minutes)

**Google Analytics 4:**
```
Exploration → Free Form
Dimensions: Page path
Metrics: Sessions, Engaged sessions, Conversions, Avg. engagement time
Date range: Last 12 months
Export: CSV
```

**Google Search Console:**
```
Performance → Pages
Date range: Last 12 months
Export: Sessions, Impressions, Clicks, CTR, Position
```

**Combine data in spreadsheet:**
```markdown
| URL | Sessions (12mo) | Clicks (GSC) | Position | Conversions | Backlinks | Status |
|-----|----------------|-------------|----------|-------------|-----------|--------|
```

#### Step 2: Categorize Every Page (60 minutes)

**Category definitions:**

| Category | Criteria | Action |
|----------|---------|--------|
| **⭐ Winners** | >500 sessions/year OR >10 conversions OR Position 1-5 | Keep, maintain quarterly |
| **📈 Potential** | 100-500 sessions, Position 6-15 | Update/improve, could become winners |
| **🔄 Consolidate** | <100 sessions, overlapping topic with winner | Merge into related winner |
| **🗑️ Delete** | <50 sessions, no backlinks, outdated topic | Delete + 410 Gone |
| **⏳ Seasonal** | Low traffic 9 months, high 3 months | Keep, update before season |

**Example categorization:**

```markdown
⭐ WINNERS (keep, maintain):
- /solar-panel-costs-uk: 2,400 sessions, Position 2, 45 conversions
- /installation-guide: 1,800 sessions, Position 3, 32 conversions

📈 POTENTIAL (improve):
- /solar-panel-types: 320 sessions, Position 8 (could reach top 5 with update)
- /maintenance-guide: 180 sessions, Position 12 (add calculator, improve)

🔄 CONSOLIDATE:
- /monocrystalline-panels: 45 sessions (merge into /solar-panel-types)
- /polycrystalline-panels: 38 sessions (merge into /solar-panel-types)
- /solar-costs-2023: 12 sessions (redirect to /solar-panel-costs-uk)

🗑️ DELETE:
- /solar-news-2022: 5 sessions, no backlinks, outdated news
- /solar-conference-recap: 3 sessions, one-time event, no evergreen value

⏳ SEASONAL:
- /solar-winter-performance: 800 sessions Nov-Jan, 50 sessions rest of year (keep)
```

#### Step 3: Consolidation Strategy (High-Impact Pruning)

**When to consolidate:**
- Multiple thin articles on same topic (each <800 words, low traffic)
- Keyword cannibalization (articles competing for same search terms)
- Outdated versions of updated content

**How to consolidate:**

1. **Identify consolidation target**
   - Choose the highest-traffic or best-positioned article as the "winner"
   - Merge 3-5 related thin articles into this winner

2. **Combine unique content**
   ```markdown
   Winner article: /solar-panel-types (1,200 words, Position 8)

   Merge these into it:
   - /monocrystalline-panels (400 words, Position 35)
   - /polycrystalline-panels (380 words, Position 42)
   - /thin-film-panels (350 words, Position 48)

   Result: /solar-panel-types expands to 2,300 words (comprehensive), consolidates 3 weak pages into 1 strong page
   ```

3. **Preserve backlinks and URL equity**
   ```typescript
   // In astro.config.mjs or middleware
   export const redirects = {
     '/monocrystalline-panels': '/solar-panel-types#monocrystalline',
     '/polycrystalline-panels': '/solar-panel-types#polycrystalline',
     '/thin-film-panels': '/solar-panel-types#thin-film',
   };
   // Use 301 permanent redirects
   ```

4. **Update internal links**
   - Find all internal links pointing to deleted URLs
   - Update to point to new consolidated URL (or remove if redundant)

**Expected impact:** Consolidated pages often jump 5-10 positions within 4-8 weeks (due to increased depth and consolidated authority).

#### Step 4: Deletion Strategy (Removing Dead Weight)

**When to delete (not consolidate):**
- Outdated news/events with no evergreen value
- Duplicate content (exact copies, test pages)
- Thin content (<300 words) with no unique value
- Off-topic content (doesn't fit site purpose)
- Zero traffic for 12+ months AND zero backlinks

**How to delete properly:**

1. **Check for backlinks first**
   ```bash
   # Use Ahrefs/SEMrush
   Backlink check for URL: /solar-news-2022
   - Referring domains: 0
   - Safe to delete

   Backlink check for URL: /old-guide-2020
   - Referring domains: 5 (including 1 DA 60 site)
   - DON'T delete → Consolidate instead (preserve backlinks)
   ```

2. **Use 410 Gone (not 404)**
   ```typescript
   // For permanently removed content, return 410 status
   if (deletedPages.includes(req.url)) {
     return new Response(null, { status: 410 });
   }
   ```
   **Why 410 vs 404:**
   - 410 = "Gone permanently" (search engines remove from index faster)
   - 404 = "Not found" (search engines may keep checking)

3. **Remove from sitemap.xml**
   - Deleted URLs should not appear in sitemap
   - Helps search engines discover removal faster

4. **Monitor for 30 days**
   - Check Google Search Console for errors
   - Verify no unexpected traffic loss
   - Ensure deleted pages de-indexed

**Expected impact:** 5-15% site-wide traffic increase after removing bottom 20-30% of content (improves average page quality signal).

### Pruning Decision Framework

**Use this flowchart for each low-performing page:**

```
Page has <100 sessions/year
    ↓
Does it have backlinks (>3 referring domains)?
    YES → Improve or consolidate (preserve link equity)
    NO → Continue
        ↓
    Is topic still relevant/searched?
        YES → Improve or consolidate
        NO → Continue
            ↓
        Is it seasonal (traffic 3+ months/year)?
            YES → Keep, update before season
            NO → DELETE (410 Gone)
```

### Improvement vs Deletion Criteria

**Improve the page if:**
- Ranking positions 6-20 (close to page 1)
- Has 3+ quality backlinks
- Topic still gets 100+ searches/month
- No better-performing page on same topic
- Can be expanded to 1500+ words with unique value

**Delete/consolidate if:**
- Ranking >50 for all keywords
- Zero backlinks
- Topic gets <50 searches/month
- Duplicate/overlapping with higher-traffic page
- Can't add 500+ words of unique value

### Post-Pruning Actions

**After consolidating or deleting content:**

1. **Submit updated sitemap** to Google Search Console
2. **Request removal** of deleted URLs (Google Search Console → Removals)
3. **Update internal link structure** (remove links to deleted pages)
4. **Monitor for 404 errors** (fix any broken internal links)
5. **Track traffic changes** (expect dip for 1-2 weeks, then recovery with improvement)

### Pruning Schedule

**Recommended frequency:**
- **Quarterly audit:** Review bottom 20% of content, prune/improve as needed
- **Annual deep clean:** Full content library audit, aggressive pruning
- **After algorithm update:** Identify and remove low-quality pages that may be hurting site

**Time investment:**
- Quarterly light prune: 4-6 hours
- Annual deep clean: 12-20 hours
- Expected traffic ROI: 10-20% increase after aggressive pruning

### Measuring Pruning Success

**Track these metrics post-pruning:**

**Week 1-2:**
- Deleted pages de-indexed in Google
- 301 redirects working correctly
- No increase in 404 errors

**Week 3-4:**
- Consolidated pages see ranking improvements (check positions)
- Overall site impressions stable or increasing (GSC)

**Week 5-8:**
- Traffic to consolidated pages increases
- Site-wide traffic recovers and exceeds pre-pruning levels
- Average engagement time increases (fewer low-quality pages diluting metrics)

**Success criteria:**
- 10%+ increase in site-wide organic traffic within 8 weeks
- Improved average position for remaining content
- Higher conversion rate (traffic more focused on quality pages)

**If traffic doesn't recover within 8 weeks:** May have pruned too aggressively (deleted pages with hidden value) or consolidated pages need improvement.

---

## Technical Checklist

Before Phase 5:

**Code Quality:**
- [ ] TypeScript strict mode enabled
- [ ] All components have Props interface
- [ ] No `any` types used
- [ ] Explicit return types on functions
- [ ] NO `client:load` directives (use `client:visible` or `client:idle`)

**Security:**
- [ ] CSP headers configured for embeds
- [ ] Iframe embeds have `sandbox` attribute
- [ ] Video embeds use facade pattern (no auto-load)

**Content:**
- [ ] All frontmatter fields present
- [ ] Intent matches CTA type
- [ ] Entities array populated (5-10)
- [ ] llms.txt entry drafted

**Schema:**
- [ ] @graph schema complete
- [ ] @id references correct
- [ ] Speakable targets QueryAnswer/TL;DR

**Images:**
- [ ] Hero image: eager + high priority
- [ ] Other images: lazy
- [ ] All images have descriptive alt text
