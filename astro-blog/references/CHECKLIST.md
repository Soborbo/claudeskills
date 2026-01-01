# Blog Creation Master Checklist

**Priority Legend:**
- ⭐ **ALWAYS** - Every article, non-negotiable
- 🎯 **HIGH-VALUE** - Competitive keywords, commercial/pillar content
- 📅 **PERIODIC** - Quarterly maintenance, not per-article
- 💡 **OPTIONAL** - Enhancement when relevant

**How to use:** Work through each phase sequentially. All essential guidance is inline. Only read detailed reference files if you need edge case examples or deeper implementation details.

---

## PHASE 1: SEO & INTENT RESEARCH

### ⭐ Core SEO (Every Article)
- [ ] **Information Gain analysis** - Article must add unique value beyond existing content. Ask: What do we know that competitors don't? (original data, case studies, insider tips, unique framework)
- [ ] **Intent declared** - Classify as: informational (learning), commercial (comparing options), comparison (this vs that), or transactional (ready to buy)
- [ ] **Headline formula** - Use odd numbers (7, 11, 13) OR power words (proven, secret, complete, ultimate, essential)
- [ ] **Title optimization** - 50-60 chars, keyword-first, include year (2026). Example: "Solar Panel Cost UK 2026: 11 Ways to Save £3,000+"
- [ ] **Entity salience** - Main entity (product/service) in subject position: first 100 words + first sentence after each H2
- [ ] **CTA matches intent** - informational→Newsletter/Guide, commercial→Calculator/Quote, comparison→Consultation, transactional→Contact/Book

### 🎯 SERP Dominance (High-Value Articles)
- [ ] **SERP feature audit** - Google your keyword, note what appears: Featured snippets? PAA boxes? Video carousel? Image pack? Target these formats
- [ ] **Featured snippet targeting** - Identify format: Paragraph (40-60 words), List (5-8 items), or Table (3-4 columns, 5-7 rows)
- [ ] **PAA question identification** - List all "People Also Ask" questions. Use as H2s in your article

### 🎯 Pillar Strategy Decision
- [ ] **Pillar vs cluster** - Pillar = 3000-5000 words, broad topic, 8-12 internal links. Cluster = 1000-1500 words, specific subtopic, 2-4 internal links
- [ ] **Skyscraper candidate?** - If competitive topic with existing content that has 50+ backlinks, plan to create 10x better version + outreach campaign

**CTA Mapping Table:**
| Intent | Primary CTA | Secondary CTA |
|--------|-------------|---------------|
| Informational | Newsletter signup | Download guide |
| Commercial | Get quote | Use calculator |
| Comparison | Book consultation | Download comparison |
| Transactional | Contact us | Book service |

**Output:** Intent type, primary keyword, unique angle, CTA type, pillar/cluster designation

---

## PHASE 2: CONTENT STRUCTURE

**⚠️ CRITICAL:** Read `human-voice.md` NOW before planning structure to avoid AI-like patterns

### ⭐ Core Structure (Every Article)
- [ ] **H2 section density** - 3-4 sections (standard 1000-1500w) OR 5-8 sections (pillar 3000-5000w)
- [ ] **H2s are questions** - Prefer specific questions users actually ask. Example: "How much does solar panel installation cost in the UK?" NOT "Pricing Overview"
- [ ] **H3 subheadings** - Use only for H2 sections >400 words. Max 3-4 H3s per H2. Keeps content scannable
- [ ] **TOC required** - If article >800 words, add table of contents after intro
- [ ] **Component density limits** - Max 5-7 components (standard) or 8-12 (pillar). Components = QueryAnswer, TL;DR, ExpertInsight, EngagementHook, etc.
- [ ] **Visual breaks** - No more than 3 paragraphs (150-300 words) without image/list/table/component

### ⭐ Above-the-Fold Optimization (Every Article)
Must appear without scrolling:
- [ ] **Desktop layout (1920x1080)** - H1 (80-120px) + Hero image (400-500px) + QueryAnswer (150-200px) = ~850px total
- [ ] **Mobile layout (375x667)** - H1 (100-140px) + Hero 4:3 ratio (280-300px) + QueryAnswer first sentence (120-160px) = ~600px total
- [ ] **Hero image optimization** - Eager loading (`loading="eager"`), <100KB filesize, descriptive filename (solar-panels-uk-2026.webp)
- [ ] **QueryAnswer placement** - Immediately after hero image, contains direct answer in first 40-60 words

### ⭐ Required Components
- [ ] **QueryAnswer** - Direct answer <120 words with specific numbers. Example: "Solar panels cost £5,000-£8,000 in the UK (2026). A typical 4kW system saves £600/year..."
- [ ] **TL;DR** - If >1000 words, exactly 3 key takeaways in bullet list
- [ ] **ExpertInsight** - 1-2 (standard) or 2-3 (pillar). Practical insider tips, NOT generic advice
- [ ] **Author Bio** - 50-80 words at end. Format: [Experience] + [Credentials] + [Social proof] + [Location/specialization] + LinkedIn link

### ⭐ Internal Linking (Every Article)
- [ ] **Minimum links** - 2-4 (standard) or 8-12 (pillar) contextual internal links
- [ ] **First link placement** - Within first 100 words to related article
- [ ] **Descriptive anchors** - "solar panel installation costs" NOT "click here" or "this article"

### 🎯 Pillar-Cluster Linking (Pillar/Cluster Articles Only)
- [ ] **Bidirectional links** - Pillar links to ALL clusters (woven into sections). Each cluster links back to pillar (intro or conclusion). Related clusters link to each other
- [ ] **Contextual integration** - Links woven into prose with context. NOT listed at end. Example: "Understanding solar panel installation costs helps budget for the broader solar investment strategy."
- [ ] **Publication order** - Publish pillar first (establishes authority), then add 1-2 cluster articles per month

### ⭐ External Links (Every Article)
Minimum 4 external links:
- [ ] **1 citation link** - Academic/research supporting a claim (journal, .ac.uk, official study)
- [ ] **1 authority link** - Industry authority site (trade body, gov.uk, certification body)
- [ ] **1 reputation link** - High-authority mention (Which?, BBC, Guardian, LinkedIn profile)
- [ ] **1 contextual link** - Related resource that adds value for reader
- [ ] **Authority sites** - Prefer: gov.uk, .ac.uk, Which?, trade bodies, professional LinkedIn profiles
- [ ] **Context sentences** - Every link needs explanatory sentence. NO "source" or "here" as anchor text
- [ ] **Rel attributes** - All external links: `rel="noopener noreferrer"`. Affiliate links add: `rel="nofollow sponsored"`

### ⭐ Images & Video (Every Article)
- [ ] **Image count** - 3-5 images (standard) or 6-10 images (pillar). Roughly every 250-350 words
- [ ] **Descriptive filenames** - solar-panel-installation-uk-2026.webp NOT IMG_1234.jpg or image-1.webp
- [ ] **Image captions** - REQUIRED for: screenshots, before/after comparisons, case studies, charts/graphs
- [ ] **Video** - 0-1 video (standard) or 1-2 videos (pillar). Use facade loading (thumbnail + play button, loads on click). Include min 3 chapter timestamps

### 🎯 Conversion Elements (Commercial/Transactional)
- [ ] **Content upgrade** - REQUIRED for commercial/transactional. Offer gated PDF checklist, template, or detailed guide related to article topic
- [ ] **Interactive tool** - REQUIRED for transactional, strongly recommended for commercial. Calculator generates 22% of leads
- [ ] **Social proof** - 2-3 elements: Volume metrics ("500+ installations"), trust seals (MCS, Which?, certifications), testimonials with names
- [ ] **Review integration** - Display review snippets near QueryAnswer AND before primary CTA. Increases traffic 100%+

**Output:** Full outline with H2s, component placement, internal link targets, image descriptions, CTA placement

---

## PHASE 3: WRITING

**⚠️ CRITICAL:** Read `human-voice.md` BEFORE writing this phase. Contains AI pattern avoidance strategies.

### ⭐ Human Voice (CRITICAL - Every Article)
- [ ] **Paragraph variety** - Mix 3 styles: (1) Answer-first for key points, (2) Narrative for stories/examples, (3) Build-up for engagement. NOT all answer-first (=robotic)
- [ ] **Component density check** - Article should feel natural, NOT template-like. If reader can "see the formula", you've overused components
- [ ] **Intentional imperfection** - 2-4 typing errors per article: thier, recieve, definately, enviroment, seperate, occured. NOT grammar errors (no "They was")

**Common AI patterns to AVOID:**
- Starting every paragraph with answer/conclusion
- Transition phrases: "Moreover," "Furthermore," "Additionally," "In conclusion,"
- Meta-commentary: "It's important to note," "It's worth mentioning," "Let's explore,"
- Overuse of "comprehensive," "robust," "delve into," "landscape," "realm"

### ⭐ Readability Standards (Every Article)
- [ ] **Paragraph length** - Max 100 words, prefer 50-80 words (2-3 sentences). Mobile-friendly
- [ ] **Sentence variety** - Mix lengths: Short (5-10 words), Medium (15-20 words), Long (25-30 words). Avoid monotony
- [ ] **Readability targets** - Hemingway Grade 6-8 (max 10), Flesch Reading Ease 60-70, <20% sentences >25 words, <10% passive voice
- [ ] **Technical definitions** - First mention of technical term: **bold** + 15-25 word definition. Example: "**Photovoltaic cells** convert sunlight directly into electricity using semiconductor materials."
- [ ] **List preference** - 3+ related items = use list format (NOT prose). Scannability + LLM extraction

### ⭐ Featured Snippet Optimization (Every Article)

**Paragraph snippets (40-60 words):**
Place immediately after relevant H2. Format:
```
## How much do solar panels cost in the UK?

Solar panels cost £5,000-£8,000 for a typical UK home in 2026. This includes panels, inverter, and installation. A 4kW system (standard 3-bed house) costs £6,500 on average and saves £600/year on electricity bills.
```
Character count: 280-320 chars. Structure: Answer → Evidence → Context

**List snippets:**
- [ ] **5-8 items** - Google truncates at 8
- [ ] **Parallel structure** - Each item starts same way (verb, noun, "How to")
- [ ] **Bolded labels** - **Item name:** Description (10-15 words)

Example:
```
## What are the types of solar panels?

1. **Monocrystalline panels:** Highest efficiency (18-22%), best for limited roof space, premium price
2. **Polycrystalline panels:** Mid-range efficiency (15-17%), good value, blue appearance
3. **Thin-film panels:** Flexible, lowest efficiency (10-12%), cheapest option
```

**Table snippets:**
- [ ] **3-4 columns max** - Mobile rendering limit
- [ ] **5-7 rows max** - Snippet height limit
- [ ] **Specific data** - NO "varies", "depends", "contact for quote". Use exact numbers or ranges
- [ ] **Bold final row** - For "Best for" or "Our recommendation"

### ⭐ Citations & Entity (Every Article)
- [ ] **All statistics sourced** - Every number/stat has citation. Format: "Solar panels save £600/year on average (Energy Saving Trust, 2026)." Link "Energy Saving Trust" to source
- [ ] **Entity salience** - Main entity (service/product) prominent in: First 100 words, first sentence after each H2, meta description
- [ ] **Semantic keywords** - Use related terms naturally. Example: Solar panels article uses: photovoltaic, PV system, inverter, installation, renewable energy. NO keyword stuffing

### 🎯 Engagement (High-Value Articles)
- [ ] **Bucket brigades** - 2-4 (standard) or 5-8 (pillar). Curiosity transitions that hold attention. Examples: "Here's the thing:", "But wait—there's more:", "The bottom line?", "Want to know the secret?"
- [ ] **EngagementHooks** - 0-2 (standard) or 2-4 (pillar) MAX. Use sparingly. These are formatted callout boxes with surprising stats or contrarian statements

**Output:** Full article draft with human voice, proper citations, optimized for featured snippets

---

## PHASE 4: TECHNICAL IMPLEMENTATION

### ⭐ Frontmatter (Every Article)
```yaml
---
title: "Solar Panel Cost UK 2026: Complete Guide"  # 50-60 chars
description: "Solar panels cost £5,000-£8,000 in the UK. Compare prices, savings, and grants for 2026. Get accurate quotes in 60 seconds."  # 150-160 chars
pubDate: 2026-01-15
intent: commercial  # informational | commercial | comparison | transactional
topic: solar-panels  # For pillar-cluster linking
primaryCTA: quote-calculator  # GTM tracking
category: solar-energy
author: team  # Use named author for YMYL content
entities: [solar panels, installation cost, energy savings, government grants, ROI, inverter, monocrystalline, payback period]  # 5-10 items
pillar: false  # true = 2500+ words + 8-12 internal links
experienceVerified: false  # true ONLY after human verifies ExperienceBlock data
---
```

**Meta description formula:** [Answer] + [Benefit] + [Proof] + [CTA]
Example: "Solar panels cost £5,000-£8,000 in the UK (2026). Save £600/year on energy bills. Compare quotes from MCS-certified installers. Get accurate pricing in 60 seconds."

### ⭐ Structured Data (@graph Schema)
Required schema markup for every article:

**Article schema (always required):**
```json
{
  "@type": "Article",
  "headline": "Solar Panel Cost UK 2026: Complete Guide",
  "description": "...",
  "datePublished": "2026-01-15",
  "dateModified": "2026-01-15",
  "author": { "@type": "Person", "name": "...", "sameAs": "https://linkedin.com/in/..." }
}
```

**FAQ schema (REQUIRED for commercial/comparison):**
- [ ] 3-5 questions (standard) or 5-8 questions (pillar)
- [ ] Use actual PAA questions from Google
- [ ] Each answer 40-60 words

**HowTo schema (REQUIRED for process/guide articles):**
- [ ] 3-10 steps
- [ ] Each step has name + text
- [ ] Include time estimates if applicable

**Author Person schema:**
```json
{
  "@type": "Person",
  "name": "John Smith",
  "jobTitle": "Solar Energy Consultant",
  "sameAs": "https://linkedin.com/in/johnsmith",
  "image": "/authors/john-smith.jpg"
}
```

**VideoObject schema (if video present):**
- [ ] Include chapter timestamps (min 3)
- [ ] Format: "0:00 Introduction, 2:15 Cost Breakdown, 5:40 Savings Calculator"

### ⭐ Technical Quality (Every Article)
- [ ] **TypeScript strict** - No `any` types, explicit return types on functions
- [ ] **Component hydration** - NEVER use `client:load`. ONLY `client:visible` (on scroll) or `client:idle` (after page interactive)
- [ ] **Performance budgets** - <100KB JavaScript, <50KB CSS, ≥90 mobile Lighthouse score, ≥95 desktop Lighthouse score
- [ ] **Image optimization** - Hero: `loading="eager"` + `fetchpriority="high"`. All others: `loading="lazy"`. Descriptive alt text on ALL images
- [ ] **ARIA labels** - Complex components (calculators, tabs, accordions) need `role` and `aria-label` attributes

### ⭐ E-E-A-T Signals (Every Article)
- [ ] **Author credentials** - Verifiable via LinkedIn + industry profile. For YMYL (health, finance), use named expert author
- [ ] **Experience content** - ExperienceBlock data must be real (verified case studies) OR marked as placeholder. NO fabricated data
- [ ] **Trust badges** - Display certifications, Which? Trusted Trader, trade body memberships near bio and CTAs

### 💡 llms.txt Update (Optional)
Add entry to `/public/llms.txt`:
```
# Solar Panel Cost UK 2026
Solar panels cost £5,000-£8,000 in the UK (2026). 4kW system saves £600/year. Compare monocrystalline vs polycrystalline. Government grants available.
> /blog/solar-panel-cost-uk-2026
```
Keep under 100 tokens per entry.

**Output:** Complete frontmatter, schema markup in article, optimized performance

---

## PHASE 5: VALIDATION

### ⭐ Critical Checks (Must Pass - Every Article)
- [ ] **Human voice test** - Read first 3 paragraphs aloud. Would someone guess AI wrote this? If yes, rewrite with more variety and imperfection
- [ ] **Component density** - Count all components (QueryAnswer, TL;DR, ExpertInsight, EngagementHook, etc). Max 5-7 (standard), 8-12 (pillar)
- [ ] **Intentional typos** - Count typing errors. Need 2-4 per article (thier, recieve, definately). NOT grammar errors
- [ ] **AI pattern detection** - Check for: All answer-first paragraphs? Transition words (Moreover, Furthermore)? Meta-commentary (It's important to note)? If yes, fix

### ⭐ Readability Scores (Every Article)
Use hemingwayapp.com or readabilityformulas.com:
- [ ] **Hemingway Grade: 6-8** (max 10 acceptable)
- [ ] **Flesch Reading Ease: 60-70** (Plain English)
- [ ] **Flesch-Kincaid Grade: 8-10** (max 12 for technical)
- [ ] **Sentence length: <20%** of sentences exceed 25 words
- [ ] **Passive voice: <10%** of sentences

### ⭐ Content Quality (Every Article)
- [ ] **Intent declared** - Frontmatter has `intent` field
- [ ] **CTA matches intent** - Check mapping table (informational→Newsletter, commercial→Quote, etc)
- [ ] **Answer in first 120 words** - QueryAnswer contains specific, direct answer with numbers
- [ ] **TL;DR present** - If >1000 words, TL;DR with exactly 3 bullet points
- [ ] **TOC present** - If >800 words, table of contents after intro
- [ ] **H2 density** - 3-4 H2 sections (standard) or 5-8 H2 sections (pillar)
- [ ] **ExpertInsight count** - 1-2 (standard) or 2-3 (pillar). NOT one per H2 (too formulaic)

### ⭐ Structure (Every Article)
- [ ] **Internal links: 2-4** (standard) or 8-12 (pillar)
- [ ] **First link position** - Within first 100 words
- [ ] **Anchor text quality** - Descriptive phrases, no "click here" or "this article"
- [ ] **Images: 3-5** (standard) or 6-10 (pillar)
- [ ] **Image filenames** - Descriptive with keywords (solar-panels-uk-2026.webp)
- [ ] **Image captions** - Present on screenshots, case studies, charts
- [ ] **Visual spacing** - No text blocks >350 words without image/list/table
- [ ] **Paragraph length** - Max 100 words, prefer 50-80 words

### ⭐ External Links (Every Article)
- [ ] **Minimum 4 links** - 1 citation + 1 authority + 1 reputation + 1 contextual
- [ ] **Authority quality** - At least 2 links to: gov.uk, .ac.uk, Which?, trade bodies, or professional LinkedIn profiles
- [ ] **Context sentences** - Every external link has explanatory sentence (no "source" or "here" anchors)
- [ ] **Rel attributes** - All external links have `rel="noopener noreferrer"`. Affiliate links add `rel="nofollow sponsored"`

### ⭐ Technical Validation (Every Article)
- [ ] **Required frontmatter** - All fields present: title, description, pubDate, intent, topic, primaryCTA, category, author, entities
- [ ] **Meta description: 150-160 chars** - Use formula: [Answer] + [Benefit] + [Proof] + [CTA]
- [ ] **FAQ schema** - Required for commercial/comparison intent. 3-5 questions (standard), 5-8 (pillar)
- [ ] **HowTo schema** - Required for process/guide articles. 3-10 steps
- [ ] **TypeScript strict** - No `any` types in components
- [ ] **NO `client:load`** - All interactive components use `client:visible` or `client:idle`

### ⭐ Performance (Every Article)
Run Lighthouse audit:
- [ ] **PageSpeed Mobile ≥90**
- [ ] **PageSpeed Desktop ≥95**
- [ ] **Bundle sizes** - <100KB JavaScript, <50KB CSS
- [ ] **Hero image** - `loading="eager"` + `fetchpriority="high"`
- [ ] **Other images** - `loading="lazy"`

### ⭐ E-E-A-T (Every Article)
- [ ] **ExperienceBlock data** - Real case studies OR marked as placeholder. NO fabricated data
- [ ] **Author credentials** - Verifiable via LinkedIn profile link
- [ ] **All statistics sourced** - No "Studies show..." without citation and link

### 🎯 Information Gain (High-Value Articles)
- [ ] **At least ONE of:** (1) Original data/survey, (2) Unique case study, (3) Contrarian insight backed by evidence, (4) New framework/methodology, (5) Expert quote from interview

**Output:** All checks passed, article ready to publish

---

## 📅 POST-PUBLISH (Quarterly Maintenance)

### Content Decay Monitoring

**Weekly rank checks** (top 10 money pages):
- [ ] Track rankings for primary keywords
- [ ] Alert if >5 position drop → Update article within 7 days
- [ ] Alert if 3-5 position drop → Update within 2 weeks
- [ ] Monitor if 1-2 position drop → Check again next week

**Monthly traffic monitoring:**
- [ ] >30% traffic drop = Emergency audit (competitor overtook? Algorithm update? Technical issue?)
- [ ] >20% CTR drop while maintaining position = Meta description or title needs refresh

**Update schedule:**
- Commercial content: Every 6 months
- Informational content: Every 12 months
- YMYL content: Every 3 months

### Content Pruning (Quarterly)

**Audit process:**
1. Export GA4 + Google Search Console data (last 12 months)
2. Categorize every page:

| Category | Criteria | Action |
|----------|---------|--------|
| ⭐ Winners | >500 sessions/year OR >10 conversions OR Position 1-5 | Keep, maintain quarterly |
| 📈 Potential | 100-500 sessions, Position 6-15 | Update/improve (add content, optimize for snippets) |
| 🔄 Consolidate | <100 sessions, overlapping topic with winner | Merge into winner page, 301 redirect |
| 🗑️ Delete | <50 sessions, no backlinks, outdated | Delete + 410 Gone response |
| 🌙 Seasonal | Spikes during specific months | Keep, update before season |

**Pruning strategy:**
- [ ] **Consolidate <100 sessions** - Merge 2-4 weak articles into one strong article. Set 301 redirects
- [ ] **Delete <50 sessions** - Zero backlinks + outdated = delete with 410 Gone (NOT 404)
- [ ] **301 redirects** - Preserve link equity from consolidated/deleted pages
- [ ] **Track results** - Expect 10-20% traffic uplift within 8 weeks after pruning bottom 20-30% of content

---

## QUICK PRIORITY GUIDE

**Every Standard Article (1000-1500w):**
- All ⭐ ALWAYS items
- Time: 4-6 hours total (25% research, 15% planning, 35% writing, 15% editing, 10% technical)

**Pillar Articles (3000-5000w):**
- All ⭐ ALWAYS items
- All 🎯 HIGH-VALUE items (pillar-cluster linking, SERP features, conversion elements)
- Time: 12-20 hours total

**Skyscraper Campaign:**
- All ⭐ and 🎯 items
- Add: Competitive analysis + 10x better content + backlink outreach (100-200 emails over 4-8 weeks)
- Time: 2-3 month campaign
- Expected: 2-5% link acquisition rate from high-authority sites (DA 60+)

**Quarterly Maintenance:**
- All 📅 PERIODIC items (content decay monitoring + pruning)
- Time: 12-20 hours per quarter
- Expected: 10-20% traffic uplift

---

## EXPECTED RESULTS

**Using this checklist consistently:**
- **25-50% organic traffic increase** (pillar-cluster architecture + SERP feature optimization)
- **20-40% conversion rate uplift** (above-fold optimization + social proof + interactive tools)
- **15-25% CTR increase** (featured snippet optimization)
- **10-20% traffic boost** from quarterly content pruning
- **22% of leads** from interactive calculators (on commercial content)
- **100%+ traffic increase** from review integration

**The key:** Apply ALL ⭐ items to EVERY article. Add 🎯 items for high-value/pillar content. Execute 📅 items quarterly.

---

## WHEN TO READ DETAILED REFERENCES

**99% of articles:** This checklist is sufficient. Work through it systematically.

**Read detailed reference files ONLY when:**
- You need edge case examples (unusual component usage, complex schema)
- You're stuck on implementation (how to write a specific component)
- You want deep understanding of WHY a rule exists

**Reference files available:**
- `human-voice.md` - AI pattern avoidance (read in Phase 3 if first time)
- `seo-intent.md` - Deep dive on Skyscraper technique, SERP features
- `content-structure.md` - Component examples, pillar-cluster strategy details
- `writing-rules.md` - Featured snippet format examples, readability deep dive
- `technical.md` - Schema markup examples, performance optimization, content decay tools
- `validation.md` - Validation checklist with pass/fail criteria
- `visual-design.md` - Component styling guidelines
