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
