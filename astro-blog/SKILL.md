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
1. **HUMAN VOICE FIRST** - Read human-voice.md before writing
2. **Component density limits** - 5-7 max standard, 8-12 max pillar (total)
3. **Intentional imperfection** - 2-4 typing errors per article (thier, recieve, definately, enviroment) NOT grammar errors
4. Answer in first 120 words (QueryAnswer)
5. H2s = prefer specific questions, allow contextual when natural
6. Internal links: 2-4 standard, **8-12 for pillar** content
7. **External links: min 3 (citation + authority + reputation)** with context
8. All stats have sources
9. TL;DR required if >1000 words
10. CTA matches intent
11. Experience required for commercial/comparison (can be woven in prose)
12. **ExpertInsight sparingly** - 1-2 standard, 2-3 pillar (NOT one per H2!)
13. Author credentials verifiable (LinkedIn + industry profile)
14. ExperienceBlock data must be real or marked as placeholder
15. ARIA labels on complex components
16. **Transactional pages MUST have interactive tool/calculator**
17. **External rel attrs: `noopener noreferrer`, `nofollow sponsored` for affiliate**
18. **Performance: <100KB JS, <50KB CSS, ≥90 mobile Lighthouse**
19. **No `client:load` - use `client:visible` or `client:idle`**

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
