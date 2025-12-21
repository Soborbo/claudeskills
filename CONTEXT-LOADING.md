# Context Loading Guide

Optimize token usage by loading only what's needed.

## Always Load (Every Conversation)

**~3,000 tokens total**

```
HARD-RULES.md        (~500 tokens)  - Non-negotiable constraints
CONFLICT-MATRIX.md   (~600 tokens)  - Conflict resolution
MINIMUM-INPUT.md     (~500 tokens)  - Required inputs
MANIFEST.md          (~400 tokens)  - Load order only, not full file
```

These 4 files provide complete decision-making framework.

## Load on Project Start

**~4,000 additional tokens**

```
project-spec-v4/SKILL.md      (~800 tokens)  - Project template
astro-architecture/SKILL.md   (~600 tokens)  - Tech foundation
```

Then load based on project type:

| Project Type | Additional Skills |
|--------------|-------------------|
| Local business | astro-forms, local-seo, astro-seo |
| Calculator/quote tool | lead-gen-calculator, astro-forms |
| Multi-page site | page-structure, astro-navigation |
| Blog-heavy | astro-blog, astro-seo |
| Multi-language | astro-i18n |

## Load On-Demand

**Load ONLY when working on specific feature:**

| Working On | Load |
|------------|------|
| Forms | astro-forms/SKILL.md |
| Images | astro-images/SKILL.md |
| SEO | astro-seo/SKILL.md |
| Performance | astro-performance/SKILL.md |
| Accessibility | astro-a11y/SKILL.md |

**Load references only when implementing:**

```
# Bad: Load entire skill folder
astro-forms/SKILL.md
astro-forms/references/email.md
astro-forms/references/schemas.md
astro-forms/references/rate-limit.md
astro-forms/references/turnstile.md

# Good: Load only what's needed now
astro-forms/SKILL.md                    # Rules
astro-forms/references/turnstile.md     # Only when adding Turnstile
```

## Never Pre-Load

| Content | When to Load |
|---------|--------------|
| `assets/boilerplate/*` | Copy when creating files |
| All `references/*.md` at once | Never, load individually |
| Specialist skills (Tier 4-5) | Only when that feature requested |
| ANTI-PATTERNS.md | Only during code review |
| QUALITY-GATE.md | Only before deployment |

## Token Budgets

| Scenario | Skill Content Budget |
|----------|---------------------|
| Quick fix | <5,000 tokens |
| Feature implementation | <15,000 tokens |
| Full project setup | <20,000 tokens |
| Maximum (complex task) | 25,000 tokens |

## Loading Strategy by Phase

### Phase 1: Discovery
```
Load: MINIMUM-INPUT.md, project-spec-v4/SKILL.md
Goal: Gather requirements
```

### Phase 2: Setup
```
Load: astro-architecture, astro-components
Goal: Project structure
```

### Phase 3: Core Pages
```
Load: page-structure, astro-images, astro-seo
Goal: Main templates
```

### Phase 4: Forms
```
Load: astro-forms OR lead-gen-calculator
Goal: Conversion points
```

### Phase 5: Polish
```
Load: astro-a11y, astro-performance
Goal: Quality checks
```

### Phase 6: Launch
```
Load: QUALITY-GATE.md, deployment
Goal: Final checks
```

## Context Refresh Strategy

If conversation is long:

1. Summarize what's been done
2. Unload completed feature skills
3. Load next feature skills
4. Keep HARD-RULES.md in context

## Skill Size Reference

| Size | Skills |
|------|--------|
| Small (<100 lines) | astro-images, youtube-embed, heading-tree |
| Medium (100-150 lines) | Most skills after refactor |
| References vary | 50-300 lines each |

## Example: Building Contact Form

```
# Start with
HARD-RULES.md
astro-forms/SKILL.md

# When implementing Turnstile
+ astro-forms/references/turnstile.md

# When setting up email
+ astro-forms/references/email.md

# Done with forms, moving to images
- astro-forms/* (unload)
+ astro-images/SKILL.md
```
