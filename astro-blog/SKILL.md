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
**→ Read `references/writing-rules.md` NOW**

Do: Write answer-first paragraphs, entity as subject, cite sources
Constraints: No vague H2s, no "Many people...", all stats sourced

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
1. Answer in first 120 words (QueryAnswer)
2. H2s = specific questions, never "Overview"
3. Internal links: 2-4 standard, **8-12 for pillar** content
4. **External links: min 3 (citation + authority + reputation)** with context
5. Entity in subject position
6. All stats have sources
7. TL;DR required if >1000 words
8. CTA matches intent
9. ExperienceBlock required for commercial/comparison content
10. **ExpertInsight at end of each H2** (practical insider tips only)
11. Author credentials verifiable (LinkedIn + industry profile)
12. ExperienceBlock data must be real or marked as placeholder
13. ARIA labels on complex components
14. **Transactional pages MUST have interactive tool/calculator**
15. **External rel attrs: `noopener noreferrer`, `nofollow sponsored` for affiliate**

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
