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

## Above-the-Fold Optimization (First Impression Critical)

**The first screen determines 80% of bounce rate.** Optimize for immediate value and clarity.

### Desktop Layout (1920x1080 Viewport)

**What MUST appear above the fold (without scrolling):**

1. **H1 title** (50-60 chars, keyword-first)
2. **Meta info** (author, date, read time)
3. **Hero image** (16:9, 1200x675px minimum)
4. **QueryAnswer component** (direct answer in first 40-60 words)
5. **First 2-3 sentences** of introduction

**Pixel budget (approx):**
- Header/nav: 80-100px
- H1 title: 80-120px
- Meta info: 40-50px
- Hero image: 400-500px
- QueryAnswer: 150-200px
- Intro paragraph start: 100-150px

**Total:** 850-1120px (fits within 1080px viewport height)

### Mobile Layout (375x667 iPhone SE)

**What MUST appear above fold:**

1. **H1 title** (2-3 lines max on mobile)
2. **Meta info** (compact: author + date only)
3. **Hero image** (cropped to 4:3 or 1:1 for mobile)
4. **QueryAnswer** (first 40 words visible)

**Pixel budget (approx):**
- Header/nav: 60-80px
- H1 title: 100-140px (2-3 lines)
- Meta info: 30-40px
- Hero image: 250-300px (4:3 ratio)
- QueryAnswer start: 120-150px

**Total:** 560-710px (fits within 667px viewport height)

### Above-Fold Content Strategy

**Hook elements (use 1-2):**

1. **Statistic hook** - Surprising number that grabs attention
   ```markdown
   ## How Much Does Solar Installation Cost in 2026?

   **73% of homeowners overpay** by not comparing quotes. A typical UK solar installation costs £6,200-£8,500...
   ```

2. **Question hook** - Reader's exact question answered immediately
   ```markdown
   ## Best Time to Book Removal Services

   **Short answer: Book 6-8 weeks ahead for 15-20% savings.** Here's why timing matters...
   ```

3. **Value proposition** - Clear benefit statement
   ```markdown
   ## Complete Guide to MCS Certification

   **This guide covers everything you need** to verify installer credentials and avoid cowboys...
   ```

**What NOT to put above fold:**
- Table of Contents (moves QueryAnswer down - place TOC after)
- TL;DR component (redundant with QueryAnswer - place after TOC)
- Long author bios (place at article end)
- Multiple CTAs (1 CTA max above fold, subtle)
- Ads or pop-ups (destroys user experience)

### Above-Fold Checklist

Before publishing, test on actual devices:

- [ ] Desktop (1920x1080): H1 + Hero + QueryAnswer visible without scroll
- [ ] Laptop (1366x768): Same as desktop, check QueryAnswer not cut off
- [ ] Tablet (768x1024): H1 + Hero (cropped) + QueryAnswer start visible
- [ ] Mobile (375x667): H1 + Hero (4:3) + QueryAnswer first sentence visible
- [ ] QueryAnswer contains **direct answer in first 40 words**
- [ ] No unnecessary elements pushing content down (extra CTAs, banners)
- [ ] Hero image loads fast (eager loading, optimized <100KB)
- [ ] H1 communicates exactly what page is about (no clickbait)

### Loading Performance Above Fold

**Critical resources (must load first):**

```html
<!-- Preload hero image -->
<link rel="preload" as="image" href="/hero-image.webp" />

<!-- Critical CSS inline (above-fold styles only) -->
<style>
  /* H1, hero, QueryAnswer styles */
</style>

<!-- Defer non-critical CSS -->
<link rel="stylesheet" href="/main.css" media="print" onload="this.media='all'" />
```

**Lazy load below-fold:**
- All images after hero (use `loading="lazy"`)
- Videos (use facade pattern)
- Heavy components (calculators, interactive tools)

### Above-Fold Examples

❌ **Bad (cluttered, no clear value):**
```
├─ Header/Nav (100px)
├─ Breadcrumbs (40px)
├─ Large decorative banner image (600px)  ← Too large, decorative only
├─ Author bio with photo (150px)  ← Premature, not needed here
├─ Table of Contents (200px)  ← Pushes answer down
├─ Ad banner (120px)  ← Revenue before value
└─ Article start (finally!) ← User has to scroll 1210px to see content
```
**Result:** 90% bounce rate, users never see the answer

✅ **Good (focused, value-first):**
```
├─ Header/Nav (80px)
├─ H1: "How Much Does Solar Cost in 2026?" (100px)
├─ Meta: John Smith · 15 Jan 2026 · 8 min read (40px)
├─ Hero: Solar panels on UK home (450px)
├─ QueryAnswer: "A typical UK solar installation costs £6,200-£8,500..." (180px)
└─ Intro paragraph continues... (150px)
```
**Total:** 1000px = fits above fold, answer immediately visible

### Mobile-First Above-Fold Priority

**Most traffic is mobile. Optimize for small screens first:**

1. **Compress H1** - Use line breaks intelligently to avoid 4+ lines
   ```markdown
   ❌ "The Complete Comprehensive Guide to Understanding Solar Panel Installation Costs in the United Kingdom in 2026"

   ✅ "Solar Panel Installation Costs UK: Complete 2026 Guide"
   ```

2. **Crop hero to 4:3 or 1:1** - 16:9 wastes vertical space on mobile
   ```astro
   <picture>
     <source media="(max-width: 768px)" srcset="/hero-4x3.webp" />
     <source media="(min-width: 769px)" srcset="/hero-16x9.webp" />
     <img src="/hero-16x9.webp" alt="..." />
   </picture>
   ```

3. **Collapse meta info** - Author + date only, hide category/tags
   ```
   ✅ Mobile: John Smith · 15 Jan 2026
   ✅ Desktop: John Smith · 15 Jan 2026 · 8 min read · Solar · Installation
   ```

4. **QueryAnswer stays full** - Don't truncate the answer, keep complete

### A/B Testing Recommendations

Test these variations to optimize bounce rate:

**Hero image size:**
- Variant A: 400px height (more content above fold)
- Variant B: 500px height (more visual impact)

**QueryAnswer style:**
- Variant A: Plain text paragraph
- Variant B: Highlighted box with background color
- Variant C: Callout with icon

**CTA placement:**
- Variant A: No CTA above fold (pure content)
- Variant B: Subtle text link CTA after QueryAnswer
- Variant C: Button CTA at top-right corner

**Expected impact:** 10-20% bounce rate reduction with optimized above-fold layout.

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

### Pillar-Cluster Architecture (Topic Authority Strategy)

**Pillar-cluster model** = comprehensive content hub (pillar) supported by detailed subtopic articles (clusters), all interlinked to establish topic authority.

#### What is Pillar-Cluster Architecture?

**Pillar page:** 3,000-5,000 word comprehensive guide covering ALL aspects of a broad topic
**Cluster pages:** 1,000-1,500 word focused articles diving deep into specific subtopics
**Internal linking:** Bidirectional links connecting pillar ↔ clusters and clusters ↔ clusters

**Purpose:**
- Signal topical authority to search engines (comprehensive coverage)
- Improve rankings for competitive head terms (pillar targets these)
- Capture long-tail traffic (clusters target specific queries)
- Distribute link equity effectively across related content

#### Pillar-Cluster Structure

```
                    ┌─────────────────┐
                    │  PILLAR PAGE    │
                    │  "Solar Panels" │
                    │   (3500 words)  │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
   ┌────▼─────┐       ┌─────▼──────┐      ┌─────▼──────┐
   │ Cluster 1│       │ Cluster 2  │      │ Cluster 3  │
   │ "Costs"  │◄──────┤"Installation"◄─────┤"Types"     │
   │ (1200w)  │       │  (1400w)   │      │  (1100w)   │
   └──────────┘       └────────────┘      └────────────┘
        │                    │                    │
        │                    │                    │
   ┌────▼─────┐       ┌─────▼──────┐      ┌─────▼──────┐
   │Sub-cluster│      │Sub-cluster │      │Sub-cluster │
   │"ROI Calc"│       │"Permits"   │      │"Mono vs    │
   │          │       │            │      │ Poly"      │
   └──────────┘       └────────────┘      └────────────┘
```

**Linking rules:**
- Pillar links to ALL clusters (contextual, not just list at end)
- Each cluster links back to pillar (introduction or conclusion)
- Related clusters link to each other (e.g., "Installation" links to "Costs")
- Sub-clusters link to parent cluster + pillar

#### Choosing Pillar Topics

**Criteria for good pillar topics:**

✅ **Broad search volume** (1,000+ monthly searches for head term)
✅ **Business relevance** (topic aligns with your products/services)
✅ **Subtopic potential** (can be broken into 5-15 detailed cluster articles)
✅ **Competitive opportunity** (top results are thin or outdated)

**Examples:**

| Pillar Topic | Monthly Searches | Cluster Potential | Business Fit |
|--------------|-----------------|-------------------|--------------|
| "Solar Panels" | 12,000 | Costs, Types, Installation, Maintenance, ROI (12 clusters) | ✅ High |
| "Kitchen Renovation" | 8,500 | Costs, Timeline, Permits, Contractors, Design (10 clusters) | ✅ High |
| "Moving House" | 15,000 | Costs, Checklist, Insurance, Packing, Timeline (15 clusters) | ✅ High |

**Bad pillar topics:**
- ❌ Too narrow: "Monocrystalline panels" (should be a cluster, not pillar)
- ❌ Too broad: "Home improvement" (can't comprehensively cover in 5000 words)
- ❌ Low search volume: "Solar panel recycling" (100 searches/month, not worth pillar)

#### Pillar Page Requirements

**Structure:**
```markdown
# [Topic]: Complete Guide (2026)

## Table of Contents
[Jump links to all H2 sections]

## What is [Topic]? (Overview)
[200-300 words: Definition, purpose, key benefits]
**Link to:** Overview cluster (if you have one)

## How much does [Topic] cost?
[400-500 words: Pricing ranges, factors, ROI]
**Link to:** "Costs" cluster article (detailed breakdown)

## Types of [Topic]
[400-500 words: Overview of main types]
**Link to:** "Types" cluster article (detailed comparisons)

## How to choose [Topic]
[400-500 words: Decision framework]
**Link to:** "Buying guide" cluster article

## Installation/Implementation process
[400-500 words: High-level steps]
**Link to:** "Installation" cluster article (detailed process)

## Maintenance and care
[300-400 words: Ongoing requirements]
**Link to:** "Maintenance" cluster article

## FAQ
[300-400 words: 5-8 common questions]
**Link to:** Relevant clusters for detailed answers

## Next steps
[CTA + summary]
```

**Pillar content rules:**
- **Word count:** 3,000-5,000 words (comprehensive but not exhausting)
- **Depth:** Broad overview of ALL subtopics (not deep dives)
- **Links:** Link to clusters 8-15 times (contextual, natural)
- **Visuals:** 8-12 images/graphics (more than standard articles)
- **CTAs:** 3-4 CTAs placed strategically (after key sections)
- **Updates:** Quarterly refresh (pillar pages are high-maintenance)

#### Cluster Page Requirements

**Structure:**
```markdown
# [Specific Subtopic]: Detailed Guide

[Intro paragraph with link to pillar within first 100 words]

## H2 covering aspect 1
[Deep dive content]

## H2 covering aspect 2
[Deep dive content]

## H2 covering aspect 3
[Deep dive content]

## How this relates to [broader topic]
[Link back to pillar + related clusters]

## Next steps
[CTA]
```

**Cluster content rules:**
- **Word count:** 1,000-1,500 words (focused depth)
- **Specificity:** Answer one specific question deeply
- **Links:** Link to pillar (1-2 times) + related clusters (2-3 times)
- **Keyword targeting:** Long-tail variations ("solar panel installation costs london" not generic "solar")
- **Purpose:** Capture specific search intent, support pillar authority

#### Linking Strategy (Critical for Success)

**Pillar → Cluster links:**

✅ **Good (contextual integration):**
```markdown
The cost varies significantly based on your roof size, panel quality, and whether you add battery storage. For a detailed breakdown of all cost factors and regional pricing variations, see our [complete solar panel cost guide](/solar-panel-costs).
```

❌ **Bad (list at end):**
```markdown
Related articles:
- Solar panel costs
- Solar panel types
- Solar panel installation
```

**Cluster → Pillar links:**

✅ **Good (natural reference):**
```markdown
Solar panel installation typically costs £6,200-£8,500 in the UK. This guide focuses specifically on cost factors, but if you're new to solar energy, start with our [comprehensive solar panel guide](/solar-panels-complete-guide) for full context.
```

**Cluster → Cluster links:**

✅ **Good (related topics):**
```markdown
Once you've budgeted for installation costs, you'll also need to consider [ongoing maintenance expenses](/solar-panel-maintenance-costs) and [insurance requirements](/solar-panel-insurance-guide).
```

**Link placement rules:**
- **Pillar to cluster:** Within relevant sections (not all at top or bottom)
- **Cluster to pillar:** Early (within first 100-200 words) or conclusion
- **Cluster to cluster:** Mid-article where topics naturally connect
- **Anchor text:** Descriptive, includes target keyword ("solar panel costs" not "this article")

#### Building Your Pillar-Cluster Content Plan

**Step 1: Keyword research for pillar (2-3 hours)**

```bash
Primary keyword: "solar panels"
Monthly searches: 12,000

Related keywords (cluster opportunities):
- "solar panel costs": 2,400 searches → CLUSTER
- "solar panel installation": 1,800 searches → CLUSTER
- "types of solar panels": 950 searches → CLUSTER
- "solar panel maintenance": 720 searches → CLUSTER
- "solar panel ROI": 580 searches → CLUSTER
- "solar panel grants UK": 820 searches → CLUSTER
- "monocrystalline vs polycrystalline": 340 searches → SUB-CLUSTER
```

**Step 2: Map cluster hierarchy (1 hour)**

```markdown
PILLAR: Solar Panels - Complete Guide (3,500 words)
  ├─ How Much Do Solar Panels Cost? (1,400 words) ← CLUSTER
  │   └─ Solar Panel ROI Calculator (800 words) ← SUB-CLUSTER
  ├─ Solar Panel Installation Process (1,300 words) ← CLUSTER
  │   ├─ Planning Permission for Solar Panels (900 words) ← SUB-CLUSTER
  │   └─ Finding Solar Panel Installers (1,000 words) ← SUB-CLUSTER
  ├─ Types of Solar Panels (1,200 words) ← CLUSTER
  │   └─ Monocrystalline vs Polycrystalline (800 words) ← SUB-CLUSTER
  ├─ Solar Panel Maintenance (1,100 words) ← CLUSTER
  └─ Solar Panel Grants and Incentives UK (1,200 words) ← CLUSTER
```

**Step 3: Publication timeline (3-6 months)**

```markdown
Month 1:
- Week 1-2: Write pillar page (placeholder links to future clusters)
- Week 3-4: Publish pillar + write Cluster 1 (Costs)

Month 2:
- Week 1-2: Publish Cluster 1, write Cluster 2 (Installation)
- Week 3-4: Publish Cluster 2, write Cluster 3 (Types)

Month 3-4:
- Continue publishing 1-2 clusters per month

Month 5-6:
- Add sub-clusters
- Update pillar with new sections as clusters expand
- Internal linking audit (ensure all connections made)
```

**Publication order priority:**
1. **Pillar first** (establishes hub)
2. **High-traffic clusters** (Costs, Installation)
3. **Medium-traffic clusters** (Types, Maintenance)
4. **Sub-clusters and niche topics** (specific comparisons)

#### Measuring Pillar-Cluster Success

**Track these metrics:**

**1. Pillar page performance**
- Target: Position 1-5 for head term within 6-12 months
- Target: 1,000+ organic sessions/month
- Current: Track weekly in rank tracker

**2. Cluster page performance**
- Target: Average position <15 for all clusters within 3-6 months
- Target: Combined cluster traffic > pillar traffic (2:1 ratio ideal)
- Measure: Total organic sessions to all cluster pages

**3. Internal link strength**
- Check: All clusters link to pillar (100% compliance)
- Check: Pillar links to all clusters (100% compliance)
- Check: Related clusters link to each other (70%+ pairs connected)

**4. Topic authority signals**
- Ranking for related keywords (not just primary)
- Featured snippets captured (pillar or clusters)
- "People Also Ask" appearances

**Example success metrics (Solar Panels pillar after 6 months):**

```
Pillar page: /solar-panels-complete-guide
- Ranking: Position 3 for "solar panels" (from Position 18 before pillar strategy)
- Traffic: 1,800 sessions/month
- Backlinks: 12 referring domains

Cluster pages (5 published):
- Combined ranking: Average Position 8 across primary keywords
- Combined traffic: 3,200 sessions/month (1.78:1 cluster:pillar ratio)
- Backlinks: 23 referring domains across all clusters

Total pillar-cluster traffic: 5,000 sessions/month
Previous traffic (before pillar strategy): 800 sessions/month
Increase: 525% traffic increase
```

#### Common Pillar-Cluster Mistakes

❌ **Writing pillar too late**
- Build pillar FIRST, then clusters (establishes hub early)

❌ **Thin pillar pages**
- <2,500 words = not comprehensive enough to be authority hub

❌ **No internal linking**
- Pillar-cluster only works with bidirectional links (pillar ↔ cluster)

❌ **Duplicate content**
- Pillar = broad overview, Cluster = deep dives (different angles, not copy-paste)

❌ **Abandoning pillar**
- Pillar pages need quarterly updates as new clusters added

❌ **Too many clusters too fast**
- Quality over speed: 1-2 clusters/month = sustainable, 10 clusters at once = overwhelm

#### Quick-Win Pillar-Cluster Strategy

**Start small (3-6 month project):**

1. **Choose 1 pillar topic** (your most important service/product)
2. **Write pillar page** (3,000 words minimum)
3. **Identify 5-7 cluster opportunities** (existing thin content to expand OR new articles)
4. **Publish 1 cluster every 2-3 weeks** (maintain quality)
5. **Update pillar quarterly** (add new sections, refresh stats)

**Expected ROI:** 2-3x traffic increase for pillar topic within 6-12 months.

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

## H3 Subheadings (Optional but Recommended)

H3s break up long H2 sections into scannable chunks for better readability.

### When to Use H3s

✅ **Use when:**
- H2 section exceeds 400 words
- Multiple sub-topics within one H2
- Step-by-step instructions need clear stages
- Before/after comparisons
- Breaking down complex concepts

❌ **Don't use when:**
- H2 section is under 300 words (unnecessary fragmentation)
- Only one sub-point to make (keep as prose)
- Already using lists or tables for structure

### H3 Rules

- **Length:** 2-4 words maximum (shorter than H2s)
- **Descriptive:** Must indicate what the subsection covers
- **Not generic:** Avoid "Details", "More", "Additional Info"
- **Visual breaks:** Use for scanability, not SEO keyword stuffing
- **Frequency:** Maximum 3-4 H3s per H2 section

### Example Structure

```markdown
## How Much Does Solar Installation Cost? (H2 - 800 words total)

### Standard Home (H3)
[150-200 words about typical 3-bed semi costs]

### Large Property (H3)
[150-200 words about detached/4-bed+ costs]

### Cost Breakdown (H3)
[200-250 words itemizing panels, inverter, labor, scaffolding]

### Hidden Costs (H3)
[150-200 words about roof repairs, electrical upgrades, planning fees]
```

### H3 Best Practices

✅ **Good H3s (specific):**
- "Standard Home" (clear scope)
- "Premium Materials" (defines category)
- "Off-Peak Discounts" (actionable topic)
- "Warranty Coverage" (clear benefit)

❌ **Bad H3s (vague):**
- "More Details" (what details?)
- "Important Info" (too generic)
- "Things to Consider" (not specific)
- "Additional Notes" (filler)

### Mobile Consideration

H3s are especially valuable on mobile where:
- Users scan headings to jump to relevant sections
- Long paragraphs feel overwhelming
- Quick answers are preferred

**Avoid:** Too many H3s create choppy experience. If you have 6+ H3s in one H2, consider splitting into multiple H2 sections instead.

---

## White Space & Visual Breathing Room (Mobile Readability)

Dense text blocks reduce engagement, especially on mobile where screens are smaller.

### Maximum Text Block Rule

**Never exceed 3 paragraphs without a visual break.**

Visual breaks include:
- Images
- Lists (bulleted or numbered)
- Tables
- Components (EngagementHook, ExpertInsight, InternalLinks)
- Blockquotes
- H3 subheadings

### List Preference

When presenting **3+ related items**, prefer lists over paragraph form:

❌ **Dense paragraph:**
```markdown
The installation includes solar panels and mounting hardware, an inverter and optimizers for maximum efficiency, all electrical wiring and connection to your consumer unit, scaffolding and safety equipment for the installation team, MCS certification paperwork for your records, and building control notification.
```
(94 words, hard to scan)

✅ **Scannable list:**
```markdown
**What's Included:**
- Solar panels and mounting hardware
- Inverter and optimizers
- Electrical wiring and consumer unit connection
- Scaffolding and safety equipment
- MCS certification paperwork
- Building control notification
```
(36 words, immediately scannable)

### Blockquote Usage

Use blockquotes for important callouts or emphasis (1-2 per article maximum):

```markdown
> **Important:** All UK solar installations require MCS certification to qualify for the Smart Export Guarantee and manufacturer warranties.
```

**When to use:**
- Critical warnings or requirements
- Key takeaway summaries
- Memorable expert quotes

**Don't overuse:** More than 2 blockquotes per article = loses impact.

### Horizontal Rules

Use sparingly (`---`) for major section breaks:

✅ **Good use:** Between major topic shifts (intro → main content → FAQ)
❌ **Overuse:** After every H2 or between paragraphs (creates fragmented feel)

### Mobile-Specific Formatting

**Paragraph breaks display larger on mobile:**
- Standard desktop paragraph spacing: 1.5em
- Mobile paragraph spacing: 2em (feels more open)
- Keep paragraphs to 2-3 sentences on mobile

**Images should be full-width on mobile:**
- Desktop: Images can be 60-80% width with text wrap
- Mobile (<768px): Images should be 100% width for clarity

**No side-by-side content:**
- Tables must be responsive (scroll horizontally or stack on mobile)
- Two-column layouts must stack to single column
- Comparison sections should use vertical layout on mobile

### White Space Checklist

- [ ] No more than 3 consecutive paragraphs without visual break
- [ ] Lists used for 3+ related items (instead of prose)
- [ ] Images placed every 250-350 words
- [ ] H3s used to break sections over 400 words
- [ ] Blockquotes limited to 1-2 per article
- [ ] Tables are mobile-responsive
- [ ] No horizontal rules between every section

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

### Bucket Brigades (Engagement Transitions)

Bucket brigades are transitional phrases that create mini cliffhangers, keeping readers engaged and scrolling. They create curiosity gaps that compel readers to continue.

**Purpose:** Reduce bounce rate, increase dwell time, maintain reading momentum

**Common bucket brigade phrases:**

```markdown
Here's the thing:
But wait, there's more.
Now here's the kicker:
You might be wondering:
Here's what that means for you:
The bottom line?
Here's the deal:
Want to know the best part?
But here's what's interesting:
Sound familiar?
Here's why this matters:
Let me explain:
Check this out:
```

**Usage guidelines:**

✅ **Good placement:**
- Before revealing key information
- Transitioning between major points
- Before case studies or examples
- Introducing surprising statistics

❌ **Avoid:**
- Using same phrase repeatedly (vary your transitions)
- Every single paragraph (loses impact)
- In QueryAnswer or H2 headings (be direct there)

**Example in context:**

```markdown
Most homeowners budget £5,000-£8,000 for solar installation. They account for panels, inverters, and labor costs.

But here's what most people miss:

Hidden costs like roof repairs and electrical upgrades add £800-£2,000 to the final bill. In our 200+ installations last year, 15% of clients needed unexpected structural work before panels could be mounted.
```

**Frequency:** 2-4 bucket brigades per standard article, 5-8 per pillar article

---

### Content Upgrades (Lead Generation)

**Content upgrades** are article-specific lead magnets that convert readers into subscribers by offering enhanced value related to the specific article they're reading.

**Why they work:** Neil Patel's data shows content upgrades are "the quickest way to build your email list" because they're highly relevant to what the reader is currently interested in.

**Types of content upgrades:**

1. **PDF Download** - Convert article to downloadable PDF report
2. **Checklist** - Actionable checklist based on article content
3. **Template** - Editable template (spreadsheet, document, calculator)
4. **Cheat Sheet** - Quick reference guide for article topic
5. **Resource List** - Curated list of tools/links mentioned
6. **Extended Guide** - Deeper dive with additional examples
7. **Video/Webinar** - Video version explaining content

**Implementation:**

```markdown
<ContentUpgrade
  type="checklist"
  title="Free Download: Complete Solar Installation Checklist"
  description="Get our step-by-step checklist covering quotes, certifications, and timeline—used by 500+ homeowners."
  ctaText="Download Free Checklist"
  leadMagnetId="solar-installation-checklist"
/>
```

**Placement:**
- **Mid-article** (40-60% scroll depth) - highest conversion
- **End of article** (before related posts) - secondary CTA
- **Sidebar** (desktop only) - persistent visibility

**Quick creation strategy (Neil Patel method):**
Convert your blog post to PDF with added checklist/summary section. Takes 10-15 minutes vs hours creating separate resource.

**Requirements:**
- **Commercial/transactional intent**: MUST have content upgrade
- **Informational intent**: RECOMMENDED for pillar content
- **Comparison intent**: RECOMMENDED (comparison matrix PDF)

**Tracking:** Link to email automation system, track conversion rate by article

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

### Social Proof Elements (Beyond Reviews)

**Social proof** = evidence that other people trust your business, strengthening E-E-A-T and increasing conversion rates. Neil Patel's research shows social proof increases conversion rates by 15-300% depending on type and placement.

#### Types of Social Proof (Beyond Customer Reviews)

**1. Client Logos / "As Seen In"**

**Purpose:** Demonstrate established clientele or media coverage

**Implementation:**
```astro
<ClientLogos
  heading="Trusted by Industry Leaders"
  logos={[
    { name: "BBC", image: "/clients/bbc-logo.svg", url: "https://..." },
    { name: "Guardian", image: "/clients/guardian-logo.svg", url: "https://..." },
    { name: "Which? Magazine", image: "/clients/which-logo.svg", url: "https://..." }
  ]}
/>
```

**Best practices:**
- **Minimum 6 logos** (fewer looks unprofessional)
- **High-authority brands** (BBC, Guardian, Which?, government bodies)
- **Grayscale logos** (consistent visual, less cluttered)
- **Link to features** (not just logo, link to actual article/mention)

**When to use:**
- Service-based businesses with notable clients
- Published media mentions or features
- B2B contexts (client logos more impactful than consumer reviews)

❌ **Don't:**
- Display competitor logos unless you've worked with them
- Use "certified by" when you just used their product
- Include logos of companies that don't know you exist

**2. Case Study Counts / Volume Metrics**

**Purpose:** Demonstrate scale and experience without detailed case studies

**Implementation:**
```markdown
## Why Choose [Company]?

Since 2014, we've completed **500+ solar installations** across Greater Manchester, helping homeowners save an average of **£1,200 annually** on energy bills.
```

**Effective volume metrics:**
- Projects completed ("500+ installations")
- Years in business ("10+ years serving Manchester")
- Money saved/earned ("£2.5M saved for clients")
- Geographic reach ("Operating across 15 UK cities")
- Team size ("12 certified installers on staff")

**Display options:**
```astro
<StatsHighlight
  stats={[
    { number: "500+", label: "Installations Completed" },
    { number: "10 Years", label: "In Business" },
    { number: "£1,200", label: "Average Annual Savings" },
    { number: "4.9/5", label: "Customer Rating" }
  ]}
/>
```

**Placement:** Near QueryAnswer (builds immediate credibility)

**3. Media Mentions / Press Coverage**

**Purpose:** Third-party validation from authoritative sources

**Implementation:**
```markdown
<PressHighlight>
**Featured in:**
- [The Guardian](https://...) - "Leading UK Solar Installer"
- [Which? Magazine](https://...) - "Best Solar Panel Guide 2026"
- [BBC Radio Manchester](https://...) - Interview on renewable energy
</PressHighlight>
```

**Types of media mentions:**
- **Direct quotes:** "[Company] offers the most comprehensive service in the UK" — Which? Magazine
- **Features:** "Featured in BBC's Renewable Energy Guide 2026"
- **Expert commentary:** "Quoted as industry expert in The Guardian"
- **Awards:** "Winner: Best Solar Installer 2025 (Consumer Choice Awards)"

**Verification required:**
- Link to actual article (not just logo)
- Include publication date
- Quote accurately (don't misrepresent)

**4. Live Activity Indicators**

**Purpose:** Create urgency and social validation through real-time activity

**Implementation:**
```astro
<LiveActivity>
  <ActivityFeed items={[
    { text: "Sarah from London requested a quote", time: "2 minutes ago" },
    { text: "Mike from Manchester booked installation", time: "15 minutes ago" },
    { text: "Emma from Birmingham downloaded guide", time: "1 hour ago" }
  ]} />
</LiveActivity>
```

**Types:**
- Recent quote requests (anonymized)
- Recent purchases/bookings
- Download counts ("Downloaded 1,247 times this month")
- Active users ("23 people viewing this page")

⚠️ **Ethical requirements:**
- MUST be real data (fake activity = deceptive marketing)
- Anonymize customer names (GDPR compliance)
- Recent timeframes only (nothing older than 24 hours)
- Optional feature (don't rely on it as primary social proof)

**5. Trust Seals / Certifications**

**Purpose:** Regulatory compliance and industry recognition

**Display prominently:**
- Industry certifications (MCS, Gas Safe, NICEIC, etc.)
- Consumer protection (Which? Trusted Trader, Checkatrade)
- Security badges (SSL, payment processor logos)
- Guarantees ("30-day money-back guarantee", "Lifetime warranty")

**Example:**
```astro
<TrustBadges
  badges={[
    { name: "MCS Certified", logo: "/badges/mcs.svg", verified: true },
    { name: "Which? Trusted Trader", logo: "/badges/which.svg", verified: true },
    { name: "10-Year Guarantee", logo: "/badges/guarantee.svg", type: "guarantee" }
  ]}
  verifiedLabel="Independently Verified"
/>
```

**6. Testimonial Highlights (Strategic Placement)**

**Purpose:** Specific customer validation for objections/concerns

Different from review aggregation—these are targeted quotes addressing specific concerns.

**Format:**
```markdown
<TestimonialHighlight
  quote="I was worried about the installation disrupting our daily routine. The team finished in one day with minimal noise—we barely noticed they were there."
  author="Michael B."
  location="Manchester"
  context="Installation completed October 2025"
  concern="Installation disruption"
/>
```

**Placement strategy:**
- After addressing objection (e.g., quote about disruption after "Installation Process" section)
- Before CTA (final social proof push)
- After pricing section (quote about value)

**Effective testimonials include:**
- **Specific concern addressed** (not generic "great service")
- **Measurable outcome** ("£1,200 annual savings" not "saved money")
- **Credibility markers** (location, date, context)
- **Authentic language** (real quotes, not marketing speak)

**7. Social Media Follower Counts**

**Purpose:** Demonstrate community and ongoing engagement

**When to display:**
- If followers >1,000 (lower numbers look weak)
- If engagement rate is high (many followers, few likes = hollow metric)
- If accounts are active (last post <1 week old)

**Example:**
```astro
<SocialProof>
  Follow us: 12,000 on Instagram | 8,500 on LinkedIn
</SocialProof>
```

**DON'T display if:**
- Followers <500 (hurts credibility)
- Account inactive (last post >1 month ago)
- Low engagement (follower count doesn't match post interactions)

#### Social Proof Hierarchy (By Impact)

| Type | Conversion Impact | Credibility Signal | Implementation Effort |
|------|------------------|-------------------|---------------------|
| **Customer reviews** | ★★★★★ (Highest) | ★★★★☆ | Low (collect via email) |
| **Volume metrics** | ★★★★☆ | ★★★★★ | Low (count projects) |
| **Media mentions** | ★★★★☆ | ★★★★★ | Medium (earn coverage) |
| **Client logos** | ★★★☆☆ | ★★★★☆ | Medium (get permission) |
| **Trust seals** | ★★★☆☆ | ★★★★★ | Low (display certifications) |
| **Testimonials** | ★★★★☆ | ★★★☆☆ | Low (collect quotes) |
| **Live activity** | ★★☆☆☆ | ★★☆☆☆ | High (build real-time system) |
| **Social followers** | ★★☆☆☆ | ★☆☆☆☆ | Low (display count) |

**Priority order:**
1. Customer reviews (aggregate rating + recent reviews)
2. Volume metrics (projects completed, years in business)
3. Trust seals (MCS, Which?, certifications)
4. Media mentions (if you have them)
5. Client logos (B2B contexts)

#### Social Proof Placement Strategy

**Homepage/Service pages:**
- Above fold: Trust seals + aggregate rating
- Mid-page: Volume metrics ("500+ projects")
- Before CTA: Testimonial highlight or recent reviews

**Blog articles (informational):**
- After QueryAnswer: Trust badges (establishes credibility early)
- Mid-article: Volume metrics woven into prose ("In our 500+ installations, we've found...")
- Before author bio: Media mentions (if featured in relevant publication)

**Commercial/Comparison articles:**
- After pricing section: Testimonial about value
- Before CTA: Reviews + trust seals
- Footer area: Client logos or certifications

#### Social Proof Density (Don't Overdo It)

**Maximum per page:**
- **Standard article:** 2-3 social proof elements total
- **Commercial page:** 4-5 social proof elements
- **Homepage:** 6-8 social proof elements

❌ **Avoid:**
- Social proof in every section (feels desperate)
- Repeating same proof type (3 testimonials = redundant)
- Unverified claims ("UK's #1 Installer" without source)
- Fake indicators (made-up live activity, paid followers)

#### Measuring Social Proof Impact

**A/B test social proof elements:**

**Test 1: Volume metrics**
- Variant A: No metrics
- Variant B: "500+ installations completed"
- Measure: Conversion rate to quote form

**Test 2: Trust seal placement**
- Variant A: Trust seals below fold
- Variant B: Trust seals above fold (near CTA)
- Measure: CTA click-through rate

**Test 3: Testimonial style**
- Variant A: Generic testimonial ("Great service!")
- Variant B: Specific outcome ("Saved £1,200 in first year")
- Measure: Time on page + conversions

**Expected uplift:**
- Reviews (displayed prominently): 10-30% conversion increase
- Volume metrics: 5-15% conversion increase
- Trust seals: 8-12% conversion increase
- Media mentions: 15-25% conversion increase (if high-authority)

#### Social Proof Authenticity Checklist

Before displaying any social proof:

- [ ] Can you prove it's real? (screenshots, links, data)
- [ ] Can customers verify it? (link to review site, media article)
- [ ] Is it recent? (<12 months old for testimonials, <6 months for metrics)
- [ ] Is it specific? (real numbers, names, outcomes)
- [ ] Does it comply with regulations? (ASA guidelines, GDPR)
- [ ] Would you personally trust it? (passes "sniff test")

**Red flags (fake social proof):**
- Stock photo testimonials
- No last names or locations
- Generic praise without specifics
- Round numbers that don't vary ("exactly 100 happy customers")
- No way to verify claims

**Result:** Authentic social proof builds trust. Fake social proof destroys it permanently when discovered.

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

## Author Bio Component (E-E-A-T Signal)

**Place at the end of every article** to establish author expertise, authoritativeness, and trustworthiness.

### Purpose

- **E-E-A-T signal:** Proves a real, qualified person wrote the content
- **Reputation linking:** Connects to external verification sources
- **Conversion element:** Subtle CTA encouraging further engagement
- **Google requirement:** "About the author" is an explicit quality rater guideline factor

### Component Structure

```astro
---
// src/components/AuthorBio.astro
interface Props {
  name: string;
  role: string;
  avatar: string;
  bio: string; // 50-80 words
  credentials?: string[]; // Optional certifications/achievements
  linkedin?: string;
  twitter?: string;
  email?: string;
}

const { name, role, avatar, bio, credentials, linkedin, twitter, email } = Astro.props;
---

<aside class="author-bio" role="complementary" aria-labelledby="author-bio-heading">
  <div class="author-bio__header">
    <img
      src={avatar}
      alt={`${name}, ${role}`}
      class="author-bio__avatar"
      width="80"
      height="80"
      loading="lazy"
    />
    <div class="author-bio__meta">
      <h3 id="author-bio-heading" class="author-bio__name">{name}</h3>
      <p class="author-bio__role">{role}</p>
    </div>
  </div>

  <p class="author-bio__description">{bio}</p>

  {credentials && credentials.length > 0 && (
    <ul class="author-bio__credentials">
      {credentials.map(cred => <li>{cred}</li>)}
    </ul>
  )}

  <div class="author-bio__links">
    {linkedin && (
      <a
        href={linkedin}
        rel="noopener noreferrer"
        data-link-type="reputation"
        aria-label={`${name} on LinkedIn`}
      >
        LinkedIn
      </a>
    )}
    {twitter && (
      <a
        href={twitter}
        rel="noopener noreferrer"
        aria-label={`${name} on Twitter`}
      >
        Twitter
      </a>
    )}
    {email && (
      <a
        href={`mailto:${email}`}
        aria-label={`Email ${name}`}
      >
        Contact
      </a>
    )}
  </div>
</aside>
```

### Usage in Content

```markdown
## Conclusion

[Final thoughts and summary...]

<AuthorBio
  name="John Smith"
  role="Senior Solar Installation Consultant"
  avatar="/authors/john-smith.webp"
  bio="John has overseen 500+ solar installations across the UK since 2014. He holds MCS certification and regularly contributes to Which? Magazine on renewable energy topics. Based in Manchester, he specializes in helping homeowners navigate the solar installation process from quote to commission."
  credentials={[
    "MCS Certified Installer (2014-present)",
    "Institute of Solar Technology Member",
    "Featured in Which? Magazine, The Guardian"
  ]}
  linkedin="https://linkedin.com/in/johnsmith"
  email="john@example.com"
/>
```

### Bio Writing Formula (50-80 words)

**Structure:**
1. **Experience statement** (what they do + how long)
2. **Credentials** (certifications, memberships, education)
3. **Social proof** (media mentions, publications, notable work)
4. **Location/specialization** (adds local relevance)

**Example breakdown:**

```
John has overseen 500+ solar installations across the UK since 2014.  [Experience: 13 words]
He holds MCS certification and regularly contributes to Which? Magazine on renewable energy topics.  [Credentials + Social proof: 17 words]
Based in Manchester, he specializes in helping homeowners navigate the solar installation process from quote to commission.  [Location + Specialization: 20 words]
```
**Total:** 50 words, hits all E-E-A-T elements

### What to Include in Credentials

✅ **Strong credentials:**
- Professional certifications (MCS, Gas Safe, NICEIC, etc.)
- Industry body memberships (professional associations)
- Media mentions (Which?, Guardian, BBC, trade publications)
- Awards or recognitions
- Years of experience (if 5+)
- Volume metrics ("500+ projects completed")
- Academic qualifications (if relevant to topic)

❌ **Weak credentials:**
- "Expert" without proof
- Generic claims ("passionate about X")
- Irrelevant certifications
- Self-awarded titles

### E-E-A-T Requirements by Content Type

| Content Type | Author Detail Required | Credentials Needed |
|--------------|----------------------|-------------------|
| **YMYL** (health, finance, legal) | Named author REQUIRED | Professional license/certification REQUIRED |
| **Commercial** (service recommendations) | Named author recommended | Industry certification recommended |
| **Comparison** (product/service reviews) | Named author recommended | Testing experience, credentials preferred |
| **Informational** (how-to guides) | Can use "team" | Helpful but not required |

### LinkedIn Linking Strategy (Reputation Signal)

**Every author bio should link to LinkedIn** (highest-value reputation link).

```html
<a
  href="https://linkedin.com/in/johnsmith"
  rel="noopener noreferrer"
  data-link-type="reputation"
>
  LinkedIn Profile
</a>
```

**Why LinkedIn matters:**
- External verification of employment and credentials
- Connection graph signals (industry connections)
- Endorsements and recommendations
- Publication history
- Google prioritizes LinkedIn for author verification

**LinkedIn Profile Requirements:**
- Photo matching author bio avatar
- Current role matches author role in bio
- Experience section completed
- Minimum 50+ connections (shows active professional)
- Recommendations from colleagues/clients (optional but valuable)

### Placement Rules

**Location:** End of article, before related posts

**DON'T place:**
- At the very top (delays value delivery)
- Mid-article (interrupts flow)
- In sidebar (desktop-only, lower visibility)

**Visual separation:**
- Border or background color distinct from main content
- Clear heading "About the Author"
- Avatar/photo for immediate recognition

### Schema Markup for Author

Include Person schema in article's JSON-LD:

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      "author": {
        "@type": "Person",
        "@id": "https://example.com/authors/john-smith",
        "name": "John Smith",
        "jobTitle": "Senior Solar Installation Consultant",
        "description": "John has overseen 500+ solar installations...",
        "image": "https://example.com/authors/john-smith.webp",
        "sameAs": [
          "https://linkedin.com/in/johnsmith",
          "https://twitter.com/johnsmith"
        ],
        "credential": [
          "MCS Certified Installer",
          "Institute of Solar Technology Member"
        ]
      }
    }
  ]
}
```

### Multi-Author Content

For articles with multiple contributors:

```markdown
<AuthorBio
  name="Contributors"
  role="Expert Team"
  avatar="/team-avatar.webp"
  bio="This guide was written by our expert team: John Smith (MCS Certified Installer, 500+ projects), Sarah Jones (Building Regulations Specialist), and Michael Brown (Solar Finance Advisor). Combined, our team has 40+ years of experience in the UK solar industry."
/>
```

**Or list individually:**
```markdown
## About the Authors

<AuthorBio name="John Smith" ... />
<AuthorBio name="Sarah Jones" ... />
```

### CTA Integration (Optional)

**Subtle CTA** can be included at the end of bio:

```markdown
bio="John has overseen 500+ solar installations across the UK since 2014. He holds MCS certification and regularly contributes to Which? Magazine. **Need help with your solar project? [Get a free quote](/quote).**"
```

**Rules:**
- Maximum 1 sentence CTA
- Relevant to author's expertise
- Not pushy sales language
- Optional—not required for E-E-A-T

### Author Bio Checklist

Before publishing:

- [ ] Author bio present at end of article
- [ ] Bio is 50-80 words (not too long)
- [ ] Includes specific credentials/certifications
- [ ] LinkedIn profile linked (if available)
- [ ] LinkedIn profile matches name/role/photo
- [ ] Credentials are verifiable (not generic claims)
- [ ] Avatar photo is professional quality
- [ ] Schema markup includes author Person object
- [ ] "sameAs" property links to external profiles
- [ ] For YMYL content: named author with professional credentials

**Expected impact:** Improves E-E-A-T scoring, reduces "thin content" perception, builds reader trust.

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
