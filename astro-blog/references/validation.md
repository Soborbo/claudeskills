# Phase 5: Validation

## Pre-Publish Checklist

Run through ALL checks before publishing. If ANY critical check fails, go back and fix.

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

### Content Quality

| Check | Pass Criteria |
|-------|---------------|
| Intent declared | Frontmatter has `intent` field |
| CTA matches intent | informational→guide, commercial→calculator, etc. |
| Answer in first 120 words | QueryAnswer contains direct answer |
| TL;DR present | Required if >1000 words |
| H2s specific | No "Overview", "Introduction", "Details" |
| Word count | ≥500 standard, ≥2500 pillar |
| YMYL author | Named author if `ymyl: true` |
| **ExpertInsight tips** | **2-4 per standard, 5-8 per pillar** |
| **Tips are practical** | **Insider knowledge, not generic advice** |

### Structure

| Check | Pass Criteria |
|-------|---------------|
| Internal links | 2-4 standard, 8-12 pillar |
| First link position | Within first 100 words |
| Anchor text | Descriptive, no "click here" |

### External Links (Elite Strategy)

| Check | Pass Criteria |
|-------|---------------|
| **Minimum count** | **3+ (1 citation + 1 authority + 1 reputation)** |
| **Link types tagged** | All external links have `data-link-type` |
| **rel attributes** | `noopener noreferrer` on all, `nofollow sponsored` on affiliate |
| **Anchor text quality** | Source name + claim in anchor |
| **Context sentences** | Every link has explanatory context |
| **No vacuum links** | No "here", "source", "click here" anchors |

### Rich Media (by Intent)

| Check | Pass Criteria |
|-------|---------------|
| Images | All have descriptive alt text |
| **Transactional pages** | **MUST have calculator/interactive tool** |
| **Commercial pages** | **Should have calculator or quote form** |
| Video (if present) | Has VideoObject schema, facade loading |

### Technical

| Check | Pass Criteria |
|-------|---------------|
| Required frontmatter | title, description, pubDate, intent, topic, primaryCTA, category |
| Schema present | @graph JSON-LD block |
| Images optimized | Hero: eager, others: lazy |

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
| informational | Optional | Optional | Optional | Optional |
| commercial | **Required** | Recommended | Recommended | Recommended |
| comparison | **Required** | **Required** | Recommended | **Required** |
| transactional | Recommended | **Required** | **Required** | Recommended |

### Information Gain

Does content contain at least ONE of:
- [ ] Original data ("Our analysis shows...")
- [ ] Case study with specifics
- [ ] Contrarian insight with evidence
- [ ] Unique framework/methodology
- [ ] Named expert quote

**If none:** Content may have zero Information Gain. Revise.

### Entity Salience

- [ ] Main entity in subject position in intro
- [ ] Each H2's first sentence has section entity as subject
- [ ] 5-10 entities mentioned throughout

### Answer-First

- [ ] No paragraphs start with "Many people..."
- [ ] No paragraphs start with "It's important..."
- [ ] Key information leads each paragraph

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
if (wordCount < 500) fail("Under 500 words");
if (wordCount > 1000 && !hasTLDR) fail("Missing TL;DR");
if (ymyl && author === 'team') fail("YMYL needs named author");
if (internalLinks < 2) fail("Need 2+ internal links");
if (hasVagueH2s) fail("Vague H2 detected");
if (hasBadAnchors) fail("Bad anchor text");

// Quality warnings (review recommended)
if (!hasInformationGainSignals) warn("No Information Gain signals");
if (!hasSourcedStats) warn("Statistics without sources");
if (hasWeakOpenings) warn("Weak paragraph openings");
```

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
