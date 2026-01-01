# Phase 2: Content Structure

**⚠️ CRITICAL: Read `references/human-voice.md` to avoid AI-like component overload.**

## Article Architecture

```
┌─────────────────────────────────────┐
│ H1: Title (max 60 chars)            │
├─────────────────────────────────────┤
│ QueryAnswer: Direct answer <120w    │
├─────────────────────────────────────┤
│ TL;DR: 3 key takeaways (if >1000w)  │
├─────────────────────────────────────┤
│ H2: Specific Question 1             │
│   Content + EngagementHook          │
├─────────────────────────────────────┤
│ H2: Specific Question 2             │
│   Content + InternalLinks           │
├─────────────────────────────────────┤
│ H2: Specific Question 3             │
│   Content + EngagementHook          │
├─────────────────────────────────────┤
│ H2: Conclusion / Next Steps         │
│   Summary + CTA                     │
├─────────────────────────────────────┤
│ Related Posts                       │
└─────────────────────────────────────┘
```

---

## Formatting Requirements (Critical for Readability)

### H2 Section Density

**Minimum:** 2-3 meaningful H2 sections with substantial content between them
**Preferred:** 3-4 H2 sections for standard articles (1000-1500w)
**Pillar articles:** 5-8 H2 sections (2500+w)

Each H2 section should contain:
- 200-400 words of prose minimum
- At least 2-3 paragraphs
- Supporting elements (images, lists, or tables where appropriate)

❌ **Avoid:** Too many short sections (creates choppy reading experience)
✅ **Prefer:** Fewer, meatier sections with depth

---

### Visual Breaking: Images and Videos

**Purpose:** Long blocks of text decrease engagement. Break up content with visual elements.

**Standard article (1000-1500w):**
- Minimum 3-5 images (including hero)
- Optional: 1 video (if relevant)
- Image spacing: Every 250-350 words maximum

**Pillar article (2500+w):**
- Minimum 6-10 images
- Recommended: 1-2 videos
- Image spacing: Every 300-400 words maximum

**Image types to include:**
- Hero image (required, eager loading)
- Process diagrams or infographics
- Before/after comparisons
- Screenshots of tools/systems (for E-E-A-T)
- Team photos (for credibility)
- Product/service examples

**Video placement:**
- Mid-article (after 40-60% of content)
- Use facade loading (no auto-load YouTube iframes)
- Always include transcript link or text summary

---

### Table of Contents (TOC)

**Required for articles >800 words.**

Place immediately after QueryAnswer and TL;DR, before first H2.

```astro
<TableOfContents
  headings={[
    { text: "How much does it cost?", id: "cost" },
    { text: "What factors affect pricing?", id: "factors" },
    { text: "How to save money", id: "savings" },
    { text: "Getting quotes", id: "quotes" }
  ]}
/>
```

**Benefits:**
- Improves scannability for users
- Generates jump links for Google's featured snippets
- Reduces bounce rate (users can navigate directly to relevant section)
- Accessibility improvement (screen readers)

**TOC Rules:**
- Auto-generate from H2 headings only (not H3)
- Include anchor links with smooth scroll
- Sticky on desktop (optional)
- Collapse on mobile below 768px

---

### External Links: Authority & Citation

**Minimum requirement:** 4 external links to very high authority sites per article

**Link types required:**

1. **Citation link** (data/statistics source)
   - Government statistics (ONS, gov.uk)
   - Industry reports (peer-reviewed)
   - Professional body publications

2. **Authority link** (industry credibility)
   - Trade associations (BAR, FMB, etc.)
   - Regulatory bodies
   - Academic institutions

3. **Reputation link** (author/company verification)
   - Author LinkedIn profile
   - Professional credentials verification
   - Company registration (Companies House)

4. **Contextual link** (additional value)
   - Complementary industry resource
   - Consumer protection sites (Which?, Citizens Advice)
   - Tool/calculator from authority site

**External link quality standards:**

✅ **High authority sites:**
- gov.uk, ons.gov.uk (UK government)
- which.co.uk (consumer rights)
- citizensadvice.org.uk
- Industry trade bodies (.org.uk professional associations)
- linkedin.com (author profiles)
- University research (.ac.uk domains)

❌ **Avoid:**
- Low-quality directories
- Competitor sites
- Unverified blogs
- Thin affiliate sites

**Link attributes:**
```html
<!-- Citation/Authority links -->
<a href="https://..." rel="noopener noreferrer" data-link-type="citation">

<!-- Affiliate links (if any) -->
<a href="https://..." rel="noopener noreferrer nofollow sponsored" data-link-type="affiliate">

<!-- Reputation links -->
<a href="https://linkedin.com/in/..." rel="noopener noreferrer" data-link-type="reputation">
```

**Context requirement:** Every external link must have explanatory context

❌ Bad: "According to this source, costs vary."
✅ Good: "According to the Office for National Statistics' 2024 Housing Survey, UK home service costs increased 12% year-over-year."

---

### Internal Links

**Standard article:** 2-4 internal links
**Pillar article:** 8-12 internal links

**Link types:**

1. **Cluster links** - Related topic articles in same pillar
2. **Pillar links** - Main pillar page if this is cluster content
3. **Service links** - Commercial pages relevant to content
4. **Tool links** - Calculators, quote forms, booking pages
5. **Related posts** - Complementary content

**Placement rules:**
- First internal link within first 100 words
- Spread naturally throughout content (not clustered at end)
- Use InternalLinks component for 3+ related links mid-article
- Anchor text must be descriptive (no "click here")

**Example distribution (1500w article):**
```
0-100 words: 1 link to pillar or related guide
400-600 words: InternalLinks component (3 links)
1200 words: 1 link to calculator/tool
End: Related Posts component (auto-generated)
```

---

## H2 Rules (Flexible Guidelines)

**PREFER specific questions** (they rank better):
- "How much does [service] cost in 2025?"
- "What's included in a typical quote?"
- "When is the best time to book?"
- "Do I need insurance for this?"

**ALLOW contextual headings** when natural:
- "Understanding Your Options" (if followed by clear breakdown)
- "Why This Matters for Your Home"
- "Our Approach to Pricing Transparency"
- "The Hidden Costs Nobody Mentions"

**STILL FORBIDDEN** (too generic):
- "Overview" / "Introduction" / "Details"
- "Things to Know" / "More Information"
- "Summary" (at start)

### Requirements
- Minimum 4 words
- Understandable out of context
- Self-contained answer follows

**Test:** Can someone scan just H2s and understand article structure? If yes, it works.

---

## Components

### QueryAnswer
First component after H1. Direct answer to the query.

```markdown
<QueryAnswer>
[Service] costs in the UK range from **£X for basic** to **£Y+ for premium**. 
The exact price depends on scope, location, and specific requirements.
</QueryAnswer>
```

**Rules:**
- Under 120 words
- Specific numbers/facts
- No fluff or preamble

---

### TL;DR Block
Required for articles over 1000 words. Placed after QueryAnswer.

```markdown
<TLDRBlock>
**Key Takeaways:**
- Average cost for standard service: £X-£Y (London +30%)
- Book 4-6 weeks ahead for best rates
- Off-peak timing saves 10-15%
</TLDRBlock>
```

**Rules:**
- Exactly 3 points
- Each under 15 words
- Specific facts/numbers
- Actionable

---

### EngagementHook
Use **sparingly** to break up long sections. **Not every 300-400 words.**

**Maximum per article:**
- Standard (1000-1500w): 0-2 hooks
- Pillar (2500+w): 2-4 hooks

```markdown
<EngagementHook type="stat">
**Did you know?** 73% of customers underestimate project costs by 20-30%.
</EngagementHook>

<EngagementHook type="question">
**Ask yourself:** Have you compared at least 3 quotes?
</EngagementHook>

<EngagementHook type="tip">
**Pro tip:** Book 4-6 weeks ahead for the best rates.
</EngagementHook>
```

**Types:** `stat`, `question`, `tip`, `quote`

**⚠️ Overuse warning:** Hooks every 300-400 words creates AI-like template feel. Use only where genuinely valuable.

---

### InternalLinks
Contextual link block, placed mid-article.

```markdown
<InternalLinks links={[
  { text: "Complete buyer's guide", href: "/blog/buyers-guide" },
  { text: "Cost comparison tool", href: "/blog/cost-comparison" },
  { text: "Get a quote", href: "/calculator" }
]} />
```

---

### CTABanner
Intent-matched CTA. Placements:
1. After intro (soft, contextual)
2. Mid-article (~50% scroll)
3. End (before related posts)

```markdown
<CTABanner type="commercial" ctaId="quote-calculator" />
```

**Maximum 3 CTAs per article.**

---

### ExperienceBlock (E-E-A-T Critical)

Proof of first-hand experience. **Required for commercial/comparison content.**

**PREFER:** Weave experience into prose naturally (sounds more human)

Example of woven-in experience:
```markdown
In the 200+ installations we completed last year, the biggest cost
surprise came from roof repairs. About 15% of our clients needed
additional work before panels could be mounted, adding £800-£1,500
to the final bill. Always get a roof survey first.
```

**RESERVE component for:** Detailed case studies with data tables, screenshots, or structured proof

```markdown
<ExperienceBlock type="case-study">
**Real Example:** When we worked with [Client] on their [project type],
the total cost was £X. The biggest factor was [specific detail] (+£Y).
</ExperienceBlock>
```

```markdown
<ExperienceBlock type="data">
**From Our 2024 Data ([N] projects):**
- Average project cost: £X
- Peak season (month-month): +X% premium
- Most common add-on: [Service] (X% of customers)
</ExperienceBlock>
```

**Types:** `case-study`, `data`, `screenshot`, `before-after`, `process`

**Placement:** Within first 500 words for maximum E-E-A-T signal.

**⚠️ Don't box every mention:** "We've found..." or "Our clients..." can be woven into prose without component boxes.

---

### TrustBadges

Display verification and accreditation.

```markdown
<TrustBadges badges={[
  { name: "BAR Member", logo: "/badges/bar.svg", url: "https://..." },
  { name: "Which? Trusted", logo: "/badges/which.svg", url: "https://..." }
]} />
```

**Placement:** After QueryAnswer or in sidebar.

---

## CTA Placement by Length

### Standard Article (1000-1500 words)
1. Soft CTA in QueryAnswer context
2. Mid-article after valuable content
3. End CTA before related posts

### Pillar Article (3000+ words)
1. After intro
2. At 25% point
3. At 50% point
4. End CTA

---

## ExpertInsight Component (Section Closer)

Every major H2 section should end with a practical expert tip from the article author. This builds E-E-A-T and provides genuine value.

### Purpose

- Demonstrates real-world experience
- Provides insider knowledge readers can't find elsewhere
- Builds trust through author visibility
- Differentiates from generic AI content

### Rules

1. **Practical only** — Must be actionable, not generic advice
2. **Insider knowledge** — Something only an expert would know
3. **Specific** — Include numbers, timeframes, or concrete steps
4. **Minimal attribution** — Just photo + "Pro Tip" label (name/role shown once at article top)
5. **Visually distinct** — Separated from main content

### Component Structure

```astro
---
// src/components/ExpertInsight.astro
interface Props {
  avatar: string;
  tip: string;
}

const { avatar, tip } = Astro.props;
---

<aside class="expert-insight" role="complementary" aria-label="Pro tip from the author">
  <div class="expert-insight__header">
    <img 
      src={avatar} 
      alt=""
      class="expert-insight__avatar"
      width="48"
      height="48"
      aria-hidden="true"
    />
    <span class="expert-insight__label">Pro Tip</span>
  </div>
  <blockquote class="expert-insight__content">
    {tip}
  </blockquote>
</aside>
```

### Usage in Content

```markdown
## How to Choose the Right Provider?

[Section content...]

<ExpertInsight 
  avatar="/authors/john-smith.webp"
  tip="Always ask for the supervisor's direct number before the job starts. 
       If anything goes wrong on the day, you want to reach decision-makers, 
       not a call center. In 15 years, this one tip has saved my clients 
       countless hours of frustration."
/>

## Next Section...
```

### What Makes a GOOD Expert Tip

| ✅ Good (Insider Knowledge) | ❌ Bad (Generic) |
|----------------------------|------------------|
| "Book for Tuesday-Wednesday — teams are freshest after the weekend rush" | "Book in advance for better rates" |
| "Ask for photos of the actual team, not stock images — high turnover companies won't show them" | "Check reviews before booking" |
| "The 3pm-5pm slot is cheapest — you'll save 15-20%" | "Compare multiple quotes" |
| "Request the same team lead from your quote visit — different estimators = different expectations" | "Get everything in writing" |

### Tip Categories

| Category | Example |
|----------|---------|
| **Timing** | Best days, times, seasons |
| **Negotiation** | What to ask for, what's negotiable |
| **Red flags** | Warning signs only experts notice |
| **Shortcuts** | Faster/cheaper ways to achieve result |
| **Prevention** | How to avoid common expensive mistakes |
| **Insider process** | How the industry actually works |

### Placement

- End of select major H2 sections (**not every H2**)
- Before the next H2 heading
- **Maximum per article:**
  - Standard (1000-1500w): 1-2 ExpertInsights
  - Pillar (2500+w): 2-3 ExpertInsights

**⚠️ Don't overuse:** One per H2 section = template-like. Reserve for genuinely insightful tips only.

### Content Guidelines

**Length:** 2-4 sentences (40-80 words)

**Formula:**
```
[Specific action] + [Why it works/insider reason] + [Concrete benefit]
```

## Comparison Tables - Strategic Use

**DON'T table every comparison.** The old rule "For ANY comparison (X vs Y), include a table" creates spec-sheet feel.

**USE tables for:**
- Comparing 3+ options across 4+ factors
- Pricing tiers or packages
- Data genuinely hard to parse in prose

**USE prose for:**
- Comparing 2 options with 1-2 differences
- Building narrative around trade-offs
- Explaining nuanced decisions

Example where prose works better than table:
```markdown
DIY installation saves £1,500-£2,000 but takes 2-3 days of your time and
carries all the risk if something fails. Professional installation costs
more upfront but includes insurance, warranty, and—crucially—you're not
the one on the roof in February.
```

---

## Media & Interactive Elements

Different intents require different media types to maximize engagement.

### Media by Intent

| Intent | Required Media | Optional |
|--------|---------------|----------|
| informational | Images, infographics | Video explainer |
| commercial | **Calculator/Quote tool** | Comparison tables |
| comparison | Comparison tables | Video review |
| transactional | **Interactive tool**, trust badges | Video testimonial |

### Transactional Pages (Critical)

Transactional intent pages MUST include at least ONE interactive element:

```markdown
<InteractiveElement type="calculator">
  <CalculatorEmbed 
    src="/calculators/quote-calculator"
    title="Get Your Instant Quote"
    height="600"
  />
</InteractiveElement>
```

**Options:**
- Embedded calculator
- Quote request form
- Booking widget
- Instant price estimator
- Availability checker

### Video Embed Requirements

When including video:

```astro
<VideoEmbed
  type="youtube"
  id="VIDEO_ID"
  title="Descriptive title for accessibility"
  thumbnail="/images/video-thumb.webp"
  loading="lazy"
/>
```

**Rules:**
- Use facade/thumbnail (don't auto-load iframe)
- Include VideoObject schema
- Provide text alternative/transcript link
- Track play events in GTM

### Video Schema

```json
{
  "@type": "VideoObject",
  "name": "Video Title",
  "description": "Video description",
  "thumbnailUrl": "https://example.com/thumb.jpg",
  "uploadDate": "2025-01-15",
  "duration": "PT5M30S",
  "contentUrl": "https://youtube.com/watch?v=..."
}
```

### Engagement Metrics Boost

| Media Type | Avg. Time on Page | Conversion Lift |
|------------|-------------------|-----------------|
| Text only | Baseline | Baseline |
| + Images | +15% | +5% |
| + Calculator | +45% | +25% |
| + Video | +60% | +15% |
| + Interactive tool | +80% | +35% |

---

## Phase 2 Output Template

Create outline before writing:

```
H1: [Title - max 60 chars]

QueryAnswer:
[Direct answer - max 120 words]

TL;DR: (required if >1000 words)
- [Takeaway 1]
- [Takeaway 2]
- [Takeaway 3]

TableOfContents: (required if >800 words)
- Auto-generate from H2 headings

H2: [Specific question 1] (~200-400 words)
- Key points to cover
- Image placement: [describe image type]
- ExpertInsight or EngagementHook (if valuable)
- Internal link: [to related content] within first 100 words

H2: [Specific question 2] (~200-400 words)
- Key points to cover
- Image placement: [describe image type]
- InternalLinks component (3+ related links)
- External link: [citation to authority source with context]

H2: [Specific question 3] (~200-400 words)
- Key points to cover
- Image/Video placement: [describe visual element]
- External link: [authority link with context]
- ExpertInsight or EngagementHook (if valuable)

H2: [Conclusion heading] (~150-250 words)
- Summary points
- External link: [contextual resource]
- CTA placement

FORMATTING CHECKLIST:
- [ ] H2 sections: 2-3 minimum (prefer 3-4)
- [ ] Images: 3-5 standard / 6-10 pillar (every 250-350 words)
- [ ] Videos: 0-1 standard / 1-2 pillar (with facade loading)
- [ ] TOC: Required if >800 words
- [ ] External links: Minimum 4 to high-authority sites
- [ ] Internal links: 2-4 standard / 8-12 pillar
- [ ] Component density: 5-7 total components max standard / 8-12 pillar

WORD COUNT TARGET: [500-1500 standard / 2500+ pillar]
```
