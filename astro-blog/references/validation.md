# Phase 5: Validation

## Pre-Publish Checklist

Run through ALL checks before publishing. If ANY critical check fails, go back and fix.

---

## 🟣 HUMAN VOICE CHECK (Must Pass First)

**Before any other checks, ensure content sounds human-written.**

### The Human Test

Read the article aloud and ask:

1. **Voice:** Would a human expert write it this way?
2. **Variety:** Can you read 3 paragraphs without seeing a pattern?
3. **Flow:** Do transitions feel natural or forced?
4. **Pacing:** Are components enhancing or interrupting?
5. **Authenticity:** Does it sound like a person or a template?

### Component Density Check

| Article Type | Max Components | Your Count | Pass/Fail |
|--------------|----------------|------------|-----------|
| Standard (1000-1500w) | 5-7 total | _____ | ☐ |
| Pillar (2500+w) | 8-12 total | _____ | ☐ |

**Count:**
- QueryAnswer: ___
- TL;DR: ___
- ExpertInsight: ___ (max 1-2 standard, 2-3 pillar)
- EngagementHook: ___ (max 0-2 standard, 2-4 pillar)
- ExperienceBlock: ___
- CTAs: ___ (max 2-3)

**If component count is excessive, rewrite with more clean prose.**

### Paragraph Variety Check

- [ ] Not every paragraph starts with answer-first pattern
- [ ] Mix of narrative, answer-first, and build-up styles
- [ ] Transitions sound natural (not repetitive)
- [ ] Entity mentioned naturally (not forced into subject position every sentence)

### AI Pattern Detection

**Scan for these AI-like patterns:**

- [ ] NO robotic answer-first in every paragraph
- [ ] NO components breaking up text every 300 words
- [ ] NO identical sentence structures repeated
- [ ] NO backwards phrasing for entity salience
- [ ] NO template-like predictability
- [ ] NO perfect spelling/grammar (should have 1-3 subtle typos)

**If 2+ AI patterns detected, rewrite for human voice before proceeding.**

### Intentional Imperfection Check

**Human typos present (2-4 per 1500-word article):**

- [ ] Contains 2-4 realistic typing errors (transposed letters, consonant errors, missing letters)
- [ ] Typos placed in conversational sections (NOT in headings/CTAs/stats)
- [ ] Mix of typo types: thier, recieve, definately, enviroment, occured, seperate
- [ ] NO grammar errors: your/you're, there/their, its/it's, then/than
- [ ] NO typos in QueryAnswer, H2s, CTAs, or schema markup

**These should look like an educated expert typing fast (hand errors), not grammar ignorance (head errors).**

**If content is perfectly spelled, add 2-4 educated typing errors in conversational sections.**

See `references/human-voice.md` section "Intentional Imperfection" for guidance.

---

## 🔴 Critical Checks (Must Pass)

### AI Hallucination Guardrails

**ExperienceBlock data MUST be verified or flagged.**

When AI generates content, it often invents realistic-sounding numbers and case studies. This is dangerous for E-E-A-T.

#### Rules for ExperienceBlock

1. **Real data only** — Numbers must come from:
   - Actual client records (anonymized)
   - Published company statistics
   - Verified industry data with source

2. **Placeholder pattern** — If real data unavailable:
```markdown
<ExperienceBlock type="case-study" placeholder="true">
**[PLACEHOLDER - NEEDS REAL DATA]**
Example structure:
- Client: [Name/Anonymized]
- Route: [From → To]
- Cost breakdown: [Itemized]

⚠️ Replace with actual case before publishing.
</ExperienceBlock>
```

3. **Verification markers**
```yaml
# In frontmatter
experienceVerified: false  # Set true only after human verification
```

4. **Build gate for unverified content**
```typescript
if (hasExperienceBlock && !frontmatter.experienceVerified) {
  warnings.push(
    `⚠️ "${post.data.title}" has ExperienceBlock but experienceVerified: false. 
     Human must verify data before publishing.`
  );
}
```

#### Forbidden in ExperienceBlocks

- Round numbers without source ("about 500 moves")
- Invented client names
- Estimated percentages
- "Typical" or "average" without data source
- Any statistics the AI "generated"

#### Safe Patterns

✅ **Verified real data:**
```markdown
Based on our 2024 records ([N] completed projects):
- Average cost: £X
- Source: Internal CRM data, Jan-Dec 2024
```

✅ **Industry data with citation:**
```markdown
UK average service cost is £X (Industry Association 2024 Survey).
```

✅ **Honest placeholder:**
```markdown
[INSERT: Real case study from CRM - recent project]
```

❌ **AI hallucination:**
```markdown
When we worked with the Johnson family last month... (invented)
Our data shows 73% of customers... (no source)
```

---

### Performance (HARD-RULES Compliance)

**Run Lighthouse audit on published page:**

| Metric | HARD-RULES Requirement | Your Score | Pass/Fail |
|--------|----------------------|------------|-----------|
| PageSpeed Mobile | ≥ 90 | _____ | ☐ |
| PageSpeed Desktop | ≥ 95 | _____ | ☐ |
| LCP | < 2.5s | _____ | ☐ |
| CLS | < 0.1 | _____ | ☐ |
| INP | < 200ms | _____ | ☐ |

**Bundle Size Checks:**

```bash
# After build, check bundle sizes
npm run build
du -sh dist/_astro/*.js | awk '{if ($1 > "100K") print "❌ JS too large: " $0; else print "✅ " $0}'
du -sh dist/_astro/*.css | awk '{if ($1 > "50K") print "❌ CSS too large: " $0; else print "✅ " $0}'
```

| Resource | HARD-RULES Limit | Your Size | Pass/Fail |
|----------|-----------------|-----------|-----------|
| Total JS (gzipped) | < 100KB | _____ | ☐ |
| Total CSS (gzipped) | < 50KB | _____ | ☐ |

**Hydration Check:**

- [ ] NO `client:load` directives used (HARD-RULES forbidden)
- [ ] Interactive components use `client:visible` or `client:idle`
- [ ] Calculators/forms use `client:idle`

**If performance fails, optimize before proceeding.**

---

### Content Quality

| Check | Pass Criteria |
|-------|---------------|
| Intent declared | Frontmatter has `intent` field |
| CTA matches intent | informational→guide, commercial→calculator, etc. |
| Answer in first 120 words | QueryAnswer contains direct answer |
| TL;DR present | Required if >1000 words |
| **TOC present** | **Required if >800 words** |
| **H2 section density** | **2-3 minimum (prefer 3-4) for standard, 5-8 for pillar** |
| H2s specific | Prefer questions; allow contextual when natural |
| Word count | ≥500 standard, ≥2500 pillar |
| YMYL author | Named author if `ymyl: true` |
| **ExpertInsight tips** | **1-2 per standard, 2-3 per pillar (NOT one per H2!)** |
| **Tips are practical** | **Insider knowledge, not generic advice** |
| **Component density** | **5-7 max standard, 8-12 max pillar** |

### Structure

| Check | Pass Criteria |
|-------|---------------|
| Internal links | 2-4 standard, 8-12 pillar |
| First link position | Within first 100 words |
| Anchor text | Descriptive, no "click here" |
| **Images** | **3-5 standard, 6-10 pillar (every 250-350 words)** |
| **Image file naming** | **Descriptive with keywords (not IMG_1234.jpg)** |
| **Image captions** | **Present for screenshots, case studies, charts** |
| **Videos** | **0-1 standard, 1-2 pillar (facade loading required)** |
| **Video chapters** | **If video present, min 3 chapter timestamps included** |
| **Visual spacing** | **No text blocks >350 words without visual break** |
| **Paragraph length** | **Max 100 words, prefer 50-80 words** |
| **H3 subheadings** | **Used for H2 sections >400 words (max 3-4 per H2)** |
| **Lists vs prose** | **3+ related items use lists, not prose** |
| **Technical definitions** | **First mention of technical terms = bold + 15-25 word definition** |

### External Links (Elite Strategy)

| Check | Pass Criteria |
|-------|---------------|
| **Minimum count** | **4+ (1 citation + 1 authority + 1 reputation + 1 contextual)** |
| **Link types tagged** | All external links have `data-link-type` |
| **Anchor text quality** | Source name + claim in anchor |
| **Context sentences** | Every link has explanatory context |
| **No vacuum links** | No "here", "source", "click here" anchors |
| **Authority quality** | gov.uk, .ac.uk, Which?, trade bodies, LinkedIn profiles |

**rel Attribute Validation:**

```bash
# Check all external links have proper rel attributes
grep -r 'href="http' src/content/blog/*.md | grep -v 'rel="noopener' | wc -l
# Should return 0 (all external links should have rel="noopener noreferrer")

# Check affiliate links
grep -r 'data-link-type="affiliate"' src/content/blog/*.md | grep -v 'nofollow sponsored'
# Should return empty (all affiliate links need nofollow sponsored)
```

- [ ] All external links have `rel="noopener noreferrer"`
- [ ] Affiliate links have `rel="noopener noreferrer nofollow sponsored"`
- [ ] Citation/authority links do NOT have `nofollow`

### Rich Media (by Intent)

| Check | Pass Criteria |
|-------|---------------|
| Images | All have descriptive alt text |
| **Transactional pages** | **MUST have calculator/interactive tool** |
| **Commercial pages** | **Should have calculator or quote form** |
| Video (if present) | Has VideoObject schema, facade loading |

### Accessibility (HARD-RULES Compliance)

**Lighthouse Accessibility Score:**

| Metric | HARD-RULES Requirement | Your Score | Pass/Fail |
|--------|----------------------|------------|-----------|
| Lighthouse a11y | ≥ 90 | _____ | ☐ |

**Manual Checks:**

- [ ] Skip-to-content link present
- [ ] All images have descriptive alt text (no "image", "photo")
- [ ] All form inputs have labels (if forms present)
- [ ] Color contrast ≥ 4.5:1 for text, ≥ 3:1 for large text
- [ ] Focus states visible on all interactive elements
- [ ] Keyboard navigation works (Tab through page)
- [ ] `prefers-reduced-motion` respected (no forced animations)

**ARIA for Components:**

- [ ] ExpertInsight has `role="complementary"` and `aria-label`
- [ ] ExperienceBlock has `role="complementary"` and `aria-labelledby`
- [ ] InternalLinks has `role="navigation"` and `aria-labelledby`
- [ ] TrustBadges has `role="complementary"` and `aria-label`
- [ ] EngagementHook has `role="note"` and `aria-label`
- [ ] Comparison tables have `role="table"`, `scope` attributes

```bash
# Quick accessibility scan
grep -r '<aside' src/content/blog/*.md | grep -v 'role=' | wc -l
# Should return 0 (all <aside> elements should have role)

grep -r '<nav' src/components | grep -v 'aria-label' | wc -l
# Should return 0 (all <nav> elements should have aria-label)
```

---

### Technical

| Check | Pass Criteria |
|-------|---------------|
| Required frontmatter | title, description, pubDate, intent, topic, primaryCTA, category |
| **Meta description** | **150-160 chars: [Answer] + [Benefit] + [Proof] + [CTA]** |
| **Meta description first sentence** | **Direct answer to title question** |
| Schema present | @graph JSON-LD block |
| **FAQ schema** | **Required for commercial/comparison (3-5 questions standard, 5-8 pillar)** |
| **HowTo schema** | **Required for process/guide articles (3-10 steps)** |
| **Semantic keyword coverage** | **Related terms used naturally, no keyword stuffing** |
| Images optimized | Hero: eager, others: lazy |
| **TypeScript strict** | **No `any` types, explicit return types** |
| **Components typed** | **All components have Props interface** |

---

## 🟡 Quality Checks (Should Pass)

### E-E-A-T Trust Signals (Critical for Commercial/YMYL)

**Proof of Experience:**
- [ ] ExperienceBlock present (case study, data, or screenshot)
- [ ] Real numbers/specifics, not generic claims
- [ ] First-hand language ("we found", "our data shows")

**Reputation Linking:**
- [ ] Author has LinkedIn profile linked
- [ ] Professional credentials have verification URLs
- [ ] External profiles in author `sameAs` schema

**Trust Indicators:**
- [ ] Trust badges displayed (BAR, Which?, Checkatrade, etc.)
- [ ] Aggregate rating schema (if applicable)
- [ ] "Last updated" date visible
- [ ] Clear contact information accessible

### E-E-A-T Requirements by Intent

| Intent | ExperienceBlock | Named Author | Trust Badges | External Links |
|--------|-----------------|--------------|--------------|----------------|
| informational | Optional | Optional | Optional | 3+ |
| commercial | **Required** (can be woven in prose) | Recommended | Recommended | **3+** |
| comparison | **Required** | **Required** | Recommended | **4+** |
| transactional | Recommended | **Required** | **Required** | **2+** |

**Note:** ExperienceBlock can be woven into prose naturally rather than always using component. Component reserved for detailed case studies.

### Information Gain

Does content contain at least ONE of:
- [ ] Original data ("Our analysis shows...")
- [ ] Case study with specifics
- [ ] Contrarian insight with evidence
- [ ] Unique framework/methodology
- [ ] Named expert quote

**If none:** Content may have zero Information Gain. Revise.

### Entity Salience

- [ ] Main entity prominent in intro (subject or clearly mentioned)
- [ ] Each H2's first sentence has section entity present and clear
- [ ] 5-10 entities mentioned throughout naturally
- [ ] No forced backwards phrasing for entity positioning

### Writing Variety

- [ ] Answer-first used strategically (not every paragraph)
- [ ] Mix of narrative, answer-first, and build-up styles
- [ ] Transitional phrases used sparingly (not repetitively)
- [ ] No excessive use of forbidden phrases as filler

### Statistics

- [ ] Every number has a source
- [ ] No "Studies show..." without citation
- [ ] No round numbers without evidence

---

## Validation Script Logic

If implementing automated checks:

```typescript
// Critical failures (block publish)
if (!frontmatter.intent) fail("Missing intent");
if (!frontmatter.primaryCTA) fail("Missing primaryCTA");
if (!frontmatter.description) fail("Missing meta description");
if (frontmatter.description.length < 150 || frontmatter.description.length > 160) fail("Meta description must be 150-160 chars");
if (wordCount < 500) fail("Under 500 words");
if (wordCount > 1000 && !hasTLDR) fail("Missing TL;DR");
if (wordCount > 800 && !hasTOC) fail("Missing Table of Contents");
if (ymyl && author === 'team') fail("YMYL needs named author");
if (internalLinks < 2) fail("Need 2+ internal links");
if (externalLinks < 4) fail("Need 4+ external authority links");
if (h2Count < 2) fail("Need minimum 2 H2 sections");
if (h2Count < 3 && wordCount > 1000) warn("Prefer 3-4 H2 sections for standard articles");
if (imageCount < 3 && wordCount > 1000) fail("Need 3-5 images for standard article");
if (imageCount < 6 && isPillar) fail("Need 6-10 images for pillar article");
if (hasGenericImageNames) warn("Image files have generic names (IMG_1234.jpg). Use descriptive names.");
if (hasImagesWithoutCaptions && hasScreenshots) warn("Screenshots/charts missing captions");
if (hasLongTextBlocks > 350) warn("Text block exceeds 350 words without visual break");
if (hasLongParagraphs > 100) warn("Paragraph exceeds 100 words");
if (hasVagueH2s) fail("Vague H2 detected");
if (hasBadAnchors) fail("Bad anchor text");
if (hasVideo && !hasVideoChapters) warn("Video present but no chapter timestamps");
if (hasH2Over400Words && !hasH3s) warn("H2 section exceeds 400 words without H3 subheadings");
if (has3PlusItemsInProse) warn("3+ related items in prose should be list");
if (hasTechnicalTermsWithoutDefinition) warn("Technical terms not defined on first mention");

// Structured data checks
if ((intent === 'commercial' || intent === 'comparison') && !hasFAQSchema) fail("FAQ schema required for commercial/comparison content");
if (titleStartsWith('How to') && !hasHowToSchema) warn("HowTo schema recommended for process guides");

// Quality warnings (review recommended)
if (!hasInformationGainSignals) warn("No Information Gain signals");
if (!hasSourcedStats) warn("Statistics without sources");
if (hasWeakOpenings) warn("Weak paragraph openings");
if (externalLinks < 4) warn("Consider adding more authority links (min 4)");
if (!hasAuthorityDomains) warn("Missing high-authority external links (gov.uk, .ac.uk, Which?, etc.)");
if (!hasSemanticKeywords) warn("Limited semantic keyword coverage - consider related terms");
if (hasKeywordStuffing) fail("Keyword stuffing detected - use semantic variations");
```

---

## Content Freshness Strategy (Post-Publish)

Search engines and LLMs prioritize fresh, updated content. Implement a systematic refresh strategy.

### Update Triggers

**Immediate updates required:**
- **Regulatory changes** - New laws, building regulations, certification requirements
- **Major price shifts** - Industry-wide cost increases >15%
- **Safety recalls or warnings** - Product/service safety issues
- **Factual errors reported** - Incorrect data or outdated information

**Scheduled reviews:**
- **Commercial content** - 6-month review cycle (pricing, quotes, availability)
- **Informational content** - 12-month review cycle (general advice, how-tos)
- **Comparison content** - 6-month review cycle (product/service changes)
- **YMYL content** - 3-month review cycle (health, finance, legal)
- **Seasonal content** - Annual review before peak season

**Data-driven triggers:**
- Rankings drop >5 positions for primary keyword
- Click-through rate decreases >20% month-over-month
- Competitor publishes more recent content on same topic
- "People Also Ask" questions change significantly

### Update Protocol

**Minor updates (no full rewrite):**
1. Update `updatedDate` in frontmatter
2. Change year in title if applicable ("2025" → "2026")
3. Update statistics with latest data
4. Add "Last updated: [Month Year]" banner at top
5. Review external links (check for 404s, replace outdated sources)
6. Update screenshots if UI/pricing changed

**Major updates (significant content changes):**
1. Add update note banner:
```markdown
> **Update [Month Year]:** This guide has been updated with [what changed].
> [Brief 1-2 sentence summary of changes].
```

2. Update frontmatter:
```yaml
pubDate: 2025-01-15    # original publish date (don't change)
updatedDate: 2026-01-20  # most recent update
```

3. Update schema `dateModified` field

4. Re-submit to Google Search Console for indexing

**When to create new article instead:**
- Topic has fundamentally changed (old advice no longer applicable)
- Regulatory environment completely different
- URL/slug needs to change for better keyword targeting
- Original article was low quality and needs complete rewrite

### Freshness Signals to Include

**Explicit date mentions:**
```markdown
✅ "As of January 2026, UK solar installation costs average £6,200..."
✅ "The 2026 Smart Export Guarantee rates range from 4-7p per kWh..."
✅ "Updated building regulations (effective April 2026) now require..."
```

**Current statistics:**
- Include publication year in citation: "(ONS 2025)"
- Use "latest available data" when most recent
- State data collection period: "January-December 2025 data shows..."

**Visual freshness:**
- Update screenshots showing current UI/pricing
- Replace dated imagery (clothing styles, car models, technology)
- Update charts/graphs with current year data

**Updated examples:**
- Case studies from last 12 months
- Current product versions/models
- Recent client projects (with dates)

### Freshness Checklist

Before marking update complete:

- [ ] `updatedDate` field updated in frontmatter
- [ ] Year in title updated (if year-specific content)
- [ ] All statistics reviewed and updated/re-verified
- [ ] External links checked (no 404s, sources still credible)
- [ ] Screenshots updated if UI/pricing changed
- [ ] "Last updated" banner added at top (if major update)
- [ ] Schema `dateModified` field updated
- [ ] Update note added explaining what changed (if significant)
- [ ] Re-submitted to Google Search Console
- [ ] Internal links to this page still relevant

### Update Note Examples

**Minor update:**
```markdown
> **Last updated: January 2026** - Pricing data and statistics refreshed with latest industry figures.
```

**Major update:**
```markdown
> **Update January 2026:** This guide has been updated to reflect the new MCS certification requirements (effective April 2026) and updated Smart Export Guarantee rates. Average installation costs have increased 8% year-over-year.
```

**Regulatory change:**
```markdown
> **Important Update (March 2026):** Building regulations changed on 1 April 2026. All new installations now require additional electrical safety certification. This guide reflects the updated requirements.
```

### Tracking Updates

**Maintain update log** (in frontmatter or separate file):

```yaml
updateHistory:
  - date: 2026-01-20
    type: minor
    changes: "Updated pricing data, refreshed statistics"
  - date: 2025-07-15
    type: major
    changes: "Added new MCS requirements, updated installation process"
  - date: 2025-01-15
    type: publish
    changes: "Initial publication"
```

**Analytics to monitor:**
- Organic traffic trend after update
- Rankings for primary keyword (should stabilize/improve within 2-4 weeks)
- Click-through rate from search results
- Time on page (should increase if update improved content)

---

## Common Failures & Fixes

### "Missing TL;DR"
Add after QueryAnswer:
```markdown
<TLDRBlock>
**Key Takeaways:**
- Point 1 with specific number
- Point 2 with actionable advice
- Point 3 with key fact
</TLDRBlock>
```

### "Vague H2 detected"
Change from:
❌ `## Overview`
To:
✅ `## What factors affect service costs?`

### "Bad anchor text"
Change from:
❌ `[click here](/calculator)`
To:
✅ `[instant quote calculator](/calculator)`

### "No Information Gain signals"
Add one of:
- Specific case study
- Original data point with source
- Expert quote with name
- Contrarian insight with evidence

### "YMYL needs named author"
Change frontmatter:
```yaml
author: john-smith  # instead of 'team'
ymyl: true
```

---

## Final Review Questions

Ask yourself:

1. **Would I cite this?** If you were writing an article, would you link to this as a source?

2. **What's unique?** Can you point to ONE thing this article has that competitors don't?

3. **Is the answer immediate?** Can someone find the answer without scrolling?

4. **Are claims backed?** Every statistic traceable to a source?

5. **Is intent clear?** Does the CTA make sense for what the reader wants?

---

## Post-Publish Actions

After validation passes and content is live:

1. **Update llms.txt**
   - Add entry to `public/llms.txt`
   - Summary under 100 tokens

2. **Verify Schema**
   - Test with Google Rich Results Test
   - Check for errors/warnings

3. **Search Console**
   - Request indexing
   - Monitor for issues

4. **Inbound Link Management (Critical for Pillars)**
   
   New pillar content needs internal links FROM existing content:
   
   | Content Type | Target Inbound Links | Timeframe |
   |--------------|---------------------|-----------|
   | Pillar | 5-10 from clusters | Within 7 days |
   | Standard | 2-3 from related | Within 14 days |
   | Quick guide | 1-2 from pillars | Within 30 days |
   
   **Action checklist:**
   - [ ] Identify 5+ existing articles that mention related topics
   - [ ] Add contextual links to new content from those articles
   - [ ] Update cluster articles to reference new pillar
   - [ ] Add to "Related Posts" sections where relevant
   - [ ] Link from service pages if commercially relevant

5. **External Authority Links Verification**
   - Confirm 3+ outbound links to authority sources
   - Verify all use correct rel attributes

---

## Validation Complete

If all critical checks pass and quality checks are addressed:

✅ **Ready to publish**

Document any quality warnings for future improvement.
