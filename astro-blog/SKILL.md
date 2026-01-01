---
name: astro-blog
description: Orchestrated blog creation for Astro lead-gen sites. 5-phase workflow with automatic reference loading.
---

# Astro Blog Skill

## Workflow (Execute All Phases Sequentially)

```
PHASE 1: RESEARCH    → Read references/seo-intent.md
PHASE 2: STRUCTURE   → Read references/content-structure.md  
PHASE 3: WRITE       → Read references/writing-rules.md
PHASE 4: TECHNICAL   → Read references/technical.md
PHASE 5: VALIDATE    → Read references/validation.md
```

**⚠️ STOP at each phase. Read the reference file BEFORE proceeding.**

---

## PHASE 1: RESEARCH
**→ Read `references/seo-intent.md` NOW**

Do: Gap analysis, identify intent, plan entities, match CTA
Output: Intent, Consensus, Gap, Entities, CTA type

---

## PHASE 2: STRUCTURE  
**→ Read `references/content-structure.md` NOW**

Do: Plan H2s (specific questions only), place components
Output: Full outline with QueryAnswer, TL;DR, hooks, CTAs

---

## PHASE 3: WRITE
**→ Read `references/human-voice.md` NOW (CRITICAL - avoid AI patterns)**
**→ Read `references/writing-rules.md` NOW**

Do: Write with human voice, vary paragraph styles, cite sources, weave in experience
Constraints: No AI-like patterns, no component overload, all stats sourced

---

## PHASE 4: TECHNICAL
**→ Read `references/technical.md` NOW**
**→ Also reference `references/visual-design.md` for component styling**

Do: Frontmatter, @graph schema, image optimization, llms.txt entry
Required: title, description, intent, topic, primaryCTA, entities

---

## PHASE 5: VALIDATE
**→ Read `references/validation.md` NOW**

Do: Run all checks, fix failures, confirm ready to publish

---

## Quick Reference

### Intent → CTA Mapping
| Intent | CTA Type |
|--------|----------|
| informational | Newsletter, Guide |
| commercial | Calculator, Quote |
| comparison | Consultation |
| transactional | Contact, Book |

### Required Frontmatter
```yaml
title: ""           # max 60 chars
description: ""     # max 160 chars  
pubDate: 2025-XX-XX
intent: commercial  # informational|commercial|comparison|transactional
topic: ""           # pillar/cluster linking
primaryCTA: ""      # GTM tracking
category: ""
author: team        # or named for YMYL
entities: []        # 5-10 items
pillar: false       # true = 2500+ words, 8-12 internal links
experienceVerified: false  # true only after human checks ExperienceBlock data
```

### Critical Rules (Always Apply)

**Content & Readability:**
1. **HUMAN VOICE FIRST** - Read human-voice.md before writing
2. **Intentional imperfection** - 2-4 typing errors per article (thier, recieve, definately, enviroment) NOT grammar errors
3. **Paragraph length max** - 100 words, prefer 50-80 words (2-3 sentences mobile-friendly)
4. **Sentence variety** - Mix short (5-10), medium (15-20), long (25-30) words
5. Answer in first 120 words (QueryAnswer)
6. TL;DR required if >1000 words
7. All stats have sources
8. **Readability targets** - Hemingway Grade 6-8 (max 10), Flesch Reading Ease 60-70, <20% sentences >25 words

**Structure:**
9. **Above-the-fold optimization** - H1 + Hero + QueryAnswer visible without scroll (desktop 1920x1080, mobile 375x667)
10. **H2 section density** - 2-3 minimum (prefer 3-4) standard, 5-8 pillar
11. H2s = prefer specific questions, allow contextual when natural
12. **H3 subheadings** - Use for H2 sections >400 words (max 3-4 per H2)
13. **TOC required if >800 words**
14. **Component density limits** - 5-7 max standard, 8-12 max pillar (total)
15. **ExpertInsight sparingly** - 1-2 standard, 2-3 pillar (NOT one per H2!)
16. **No more than 3 paragraphs without visual break** (image, list, table, component)
17. **Author bio required** - End of every article, 50-80 words with credentials and LinkedIn link

**Visual & Media:**
18. **Images: 3-5 standard, 6-10 pillar** (every 250-350 words)
19. **Image file naming** - Descriptive with keywords (solar-panel-installation-2025.webp)
20. **Image captions** - Required for screenshots, before/after, case studies, charts
21. **Videos: 0-1 standard, 1-2 pillar** (facade loading, no auto-load)
22. **Video chapters** - Include timestamps if embedding video (min 3 chapters)

**Links:**
23. Internal links: 2-4 standard, **8-12 for pillar** content (first within 100 words)
24. **Pillar-cluster architecture** - Bidirectional links (pillar ↔ clusters), publish pillar first, add 1-2 clusters/month
25. **External links: min 4 (citation + authority + reputation + contextual)** with context to high-authority sites
26. **External rel attrs: `noopener noreferrer`, `nofollow sponsored` for affiliate**

**Structured Data:**
27. **FAQ schema** - Required for commercial/comparison (3-5 questions standard, 5-8 pillar)
28. **HowTo schema** - Required for process/guide articles (3-10 steps)
29. **Meta description** - 150-160 chars: [Answer] + [Benefit] + [Proof] + [CTA]
30. **Review schema** - Integrate reviews with structured data (min 10 before showing aggregate)

**SEO & Writing (Neil Patel + 2026 Optimizations):**
31. **Featured snippet optimization** - 40-60 word direct answer after H2, lists 5-8 items, tables 3-4 columns
32. **SERP feature targeting** - Optimize for PAA boxes (5-8 questions), video carousels, image packs
33. **Headline formulas** - Use odd numbers (7, 11, 13) or power words (proven, secret, complete)
34. **Title optimization** - 50-60 chars, keyword-first, include year/location
35. **Bucket brigades** - 2-4 per standard, 5-8 per pillar (curiosity transitions: "Here's the thing:", "But wait...")
36. **Technical term definitions** - Bold first mention + 15-25 word definition
37. **Semantic keyword coverage** - Use related terms naturally, avoid keyword stuffing
38. **List preference** - Use lists for 3+ related items (not prose)
39. **Research allocation** - 25% research, 15% planning, 35% writing, 15% editing, 10% technical
40. **Skyscraper for pillars** - For competitive topics: 10x better content + backlink outreach (2-3 month campaign)
41. CTA matches intent
42. Experience required for commercial/comparison (can be woven in prose)

**Lead Generation & Conversion:**
43. **Content upgrades** - REQUIRED for commercial/transactional (PDF, checklist, template)
44. **Interactive tools** - Calculators generate 22% of leads (prioritize in commercial content)
45. **Review integration** - Display reviews near QueryAnswer and before CTAs (increases traffic 100%+)
46. **Social proof elements** - Volume metrics + trust seals + testimonials (2-3 elements per article, max 6-8 on commercial)

**Technical & Ongoing:**
47. Author credentials verifiable (LinkedIn + industry profile)
48. ExperienceBlock data must be real or marked as placeholder
49. ARIA labels on complex components
50. **Transactional pages MUST have interactive tool/calculator**
51. **Performance: <100KB JS, <50KB CSS, ≥90 mobile Lighthouse**
52. **No `client:load` - use `client:visible` or `client:idle`**
53. **Content decay monitoring** - Weekly rank checks for top 10 pages, alert on >5 position drops, update within 7 days
54. **Content pruning quarterly** - Consolidate <100 session pages, delete <50 session + no backlinks, 10-20% traffic uplift expected

### File Structure
```
src/content/blog/[slug].md
src/content/authors/[author].md
public/llms.txt
```

---

## Forbidden
- Vague H2s (Overview, Introduction, Details)
- "Many people...", "It's important..." openings
- Stats without sources
- "Click here" anchor text
- Heavy JS components
- YMYL without named author
