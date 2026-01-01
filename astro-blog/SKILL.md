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

**Structure:**
8. **H2 section density** - 2-3 minimum (prefer 3-4) standard, 5-8 pillar
9. H2s = prefer specific questions, allow contextual when natural
10. **H3 subheadings** - Use for H2 sections >400 words (max 3-4 per H2)
11. **TOC required if >800 words**
12. **Component density limits** - 5-7 max standard, 8-12 max pillar (total)
13. **ExpertInsight sparingly** - 1-2 standard, 2-3 pillar (NOT one per H2!)
14. **No more than 3 paragraphs without visual break** (image, list, table, component)

**Visual & Media:**
15. **Images: 3-5 standard, 6-10 pillar** (every 250-350 words)
16. **Image file naming** - Descriptive with keywords (solar-panel-installation-2025.webp)
17. **Image captions** - Required for screenshots, before/after, case studies, charts
18. **Videos: 0-1 standard, 1-2 pillar** (facade loading, no auto-load)
19. **Video chapters** - Include timestamps if embedding video (min 3 chapters)

**Links:**
20. Internal links: 2-4 standard, **8-12 for pillar** content (first within 100 words)
21. **External links: min 4 (citation + authority + reputation + contextual)** with context to high-authority sites
22. **External rel attrs: `noopener noreferrer`, `nofollow sponsored` for affiliate**

**Structured Data:**
23. **FAQ schema** - Required for commercial/comparison (3-5 questions standard, 5-8 pillar)
24. **HowTo schema** - Required for process/guide articles (3-10 steps)
25. **Meta description** - 150-160 chars: [Answer] + [Benefit] + [Proof] + [CTA]

**SEO & Writing:**
26. **Technical term definitions** - Bold first mention + 15-25 word definition
27. **Semantic keyword coverage** - Use related terms naturally, avoid keyword stuffing
28. **List preference** - Use lists for 3+ related items (not prose)
29. CTA matches intent
30. Experience required for commercial/comparison (can be woven in prose)

**Technical:**
31. Author credentials verifiable (LinkedIn + industry profile)
32. ExperienceBlock data must be real or marked as placeholder
33. ARIA labels on complex components
34. **Transactional pages MUST have interactive tool/calculator**
35. **Performance: <100KB JS, <50KB CSS, ≥90 mobile Lighthouse**
36. **No `client:load` - use `client:visible` or `client:idle`**

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
