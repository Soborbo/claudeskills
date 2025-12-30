# Phase 2: Content Structure

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

## H2 Rules (Critical)

H2s must be **specific questions or statements**, not vague labels.

### Forbidden H2s
- "Overview"
- "Introduction"
- "Details"
- "Things to Know"
- "More Information"
- "Summary" (at start)

### Good H2s
- "How much does [service] cost in 2025?"
- "What's included in a typical quote?"
- "When is the best time to book?"
- "Do I need insurance for this?"

### Requirements
- Minimum 4 words
- Contains verb or question word
- Understandable out of context
- Self-contained answer follows

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
Break up content every 300-400 words.

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

- End of each major H2 section (not H3s)
- Before the next H2 heading
- Typically 2-4 ExpertInsights per standard article
- 5-8 for pillar articles

### Content Guidelines

**Length:** 2-4 sentences (40-80 words)

**Formula:**
```
[Specific action] + [Why it works/insider reason] + [Concrete benefit]
```

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

TL;DR: (if >1000 words)
- [Takeaway 1]
- [Takeaway 2]
- [Takeaway 3]

H2: [Specific question 1]
- Key points to cover
- EngagementHook: [type] at [position]

H2: [Specific question 2]
- Key points to cover
- InternalLinks block here

H2: [Specific question 3]
- Key points to cover
- EngagementHook: [type] at [position]

H2: [Conclusion heading]
- Summary points
- CTA placement

WORD COUNT TARGET: [500-1500 standard / 2500+ pillar]
```
