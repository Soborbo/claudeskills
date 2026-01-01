---
name: astro-blog
description: Self-contained checklist workflow for perfect blog articles. 95% token reduction, zero quality compromise.
---

# Astro Blog Skill

## How This Works

**Primary:** Use `references/CHECKLIST.md` as your complete, self-contained workflow
**Secondary:** Detailed reference files available but rarely needed

**CHECKLIST.md is self-contained** - All essential guidance is inline. Work through it systematically without jumping to other files.

This approach:
- ✅ Uses ~400 lines (self-contained) instead of ~8,000 lines across multiple files
- ✅ Ensures nothing gets missed (systematic checkboxes)
- ✅ Shows priorities clearly (⭐ ALWAYS, 🎯 HIGH-VALUE, 📅 PERIODIC, 💡 OPTIONAL)
- ✅ Includes examples, formulas, and specific guidance inline
- ✅ Reference files only for edge cases

---

## Workflow

**→ Read `references/CHECKLIST.md` NOW**

Follow the 5-phase checklist systematically:

1. **PHASE 1:** SEO & Intent Research
2. **PHASE 2:** Content Structure
3. **PHASE 3:** Writing
4. **PHASE 4:** Technical Implementation
5. **PHASE 5:** Validation

**99% of articles:** CHECKLIST.md alone is sufficient. Work through it systematically.

**Read detailed references ONLY when:**
- Stuck on complex implementation (unusual schema, component edge cases)
- Need deeper understanding of WHY a rule exists
- Working on first article (read `human-voice.md` in Phase 3)

---

## Quick Reference (Keep This Handy)

### Priority System
- ⭐ **ALWAYS** - Every article, non-negotiable
- 🎯 **HIGH-VALUE** - Competitive keywords, commercial/pillar content
- 📅 **PERIODIC** - Quarterly maintenance, not per-article
- 💡 **OPTIONAL** - Enhancement when relevant

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
pubDate: 2026-XX-XX
intent: commercial  # informational|commercial|comparison|transactional
topic: ""           # pillar/cluster linking
primaryCTA: ""      # GTM tracking
category: ""
author: team        # or named for YMYL
entities: []        # 5-10 items
pillar: false       # true = 2500+ words, 8-12 internal links
experienceVerified: false  # true only after human checks ExperienceBlock data
```

### Top 10 Non-Negotiable Rules (⭐ ALWAYS)

1. **HUMAN VOICE FIRST** - Read `human-voice.md` before writing Phase 3
2. **Intentional imperfection** - 2-4 typing errors per article (thier, recieve, definately)
3. **Above-the-fold optimization** - H1 + Hero + QueryAnswer visible without scroll
4. **Readability targets** - Hemingway Grade 6-8 (max 10), Flesch Ease 60-70
5. **Featured snippet optimization** - 40-60 word direct answer after H2
6. **Component density limits** - Max 5-7 (standard) or 8-12 (pillar)
7. **Internal links** - 2-4 (standard) or 8-12 (pillar), first within 100 words
8. **External links minimum** - 4+ (citation + authority + reputation + contextual)
9. **Author bio required** - End of every article, 50-80 words with credentials
10. **NO `client:load`** - Use `client:visible` or `client:idle` only

---

## Detailed Reference Files (Rarely Needed)

**CHECKLIST.md contains everything you need.** Reference files below are for edge cases only.

- `references/CHECKLIST.md` - ⭐ **START HERE** (self-contained, complete workflow)
- `references/human-voice.md` - AI pattern avoidance (recommended read for first article)
- `references/seo-intent.md` - Deep dive: Skyscraper technique, SERP feature strategies
- `references/content-structure.md` - Deep dive: Component examples, pillar-cluster details
- `references/writing-rules.md` - Deep dive: Advanced snippet formatting
- `references/technical.md` - Deep dive: Complex schema, monitoring tools
- `references/validation.md` - Deep dive: Detailed validation criteria
- `references/visual-design.md` - Deep dive: Component styling edge cases

---

## Expected Results (Using CHECKLIST.md Consistently)

**Traffic & Engagement:**
- 25-50% organic traffic increase (pillar-cluster + SERP features)
- 15-25% CTR increase (featured snippets)
- 10-20% traffic boost from quarterly pruning

**Conversions:**
- 20-40% conversion rate uplift (above-fold + social proof)
- 22% of leads from interactive calculators (commercial content)
- 100%+ traffic increase from review integration

**Time Investment:**
- Standard article (1000-1500w): 4-6 hours
- Pillar article (3000-5000w): 12-20 hours
- Quarterly maintenance: 12-20 hours

---

## File Structure
```
src/content/blog/[slug].md
src/content/authors/[author].md
public/llms.txt
```

---

## Forbidden (Never Do These)

- Vague H2s (Overview, Introduction, Details)
- "Many people...", "It's important..." openings
- Stats without sources
- "Click here" anchor text
- Heavy JS components (`client:load`)
- YMYL without named author
- **Reading all reference files upfront** (use CHECKLIST.md first!)
