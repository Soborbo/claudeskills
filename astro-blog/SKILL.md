---
name: astro-blog
description: Self-contained checklist workflow for blog articles. Read CHECKLIST.md and follow it.
---

# Astro Blog Skill

## Workflow

**→ Read `references/CHECKLIST.md` and follow it sequentially**

CHECKLIST.md contains:
- All 135 checkboxes covering 54 critical rules
- Inline guidance, examples, and formulas
- 5 phases: Research → Structure → Write → Technical → Validate
- Priority markers (⭐ ALWAYS, 🎯 HIGH-VALUE, 📅 PERIODIC, 💡 OPTIONAL)

**That's it.** Work through the checklist. Everything you need is inline.

---

## When to Read Other Reference Files

**Default:** Don't. CHECKLIST.md is complete.

**Exception - Read reference files only if:**
- A checklist item is unclear (read the specific referenced section)
- First time writing article (read `human-voice.md` in Phase 3 to understand AI pattern avoidance)
- Complex edge case not covered in checklist (rare)

**Available references:**
- `human-voice.md` - AI pattern avoidance strategies
- `seo-intent.md` - Skyscraper technique deep dive
- `content-structure.md` - Component examples, pillar-cluster details
- `writing-rules.md` - Advanced snippet formatting
- `technical.md` - Complex schema, monitoring tools
- `validation.md` - Detailed validation criteria
- `visual-design.md` - Component styling edge cases

---

## File Structure
```
src/content/blog/[slug].md
src/content/authors/[author].md
public/llms.txt
```

---

## Forbidden (Never Do)

- Vague H2s (Overview, Introduction, Details)
- "Many people...", "It's important..." openings
- Stats without sources
- "Click here" anchor text
- Heavy JS components (`client:load`)
- YMYL without named author
- Reading all reference files upfront
