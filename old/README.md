# Claude Skills for Astro Lead-Gen

A comprehensive skill system for building high-converting Astro websites with 95+ PageSpeed scores.

## Quick Start

1. Read `HARD-RULES.md` first (non-negotiable constraints)
2. Check `MANIFEST.md` for which skills to load
3. Load relevant skills based on project type
4. Use `QUALITY-GATE.md` before deployment

## File Structure

```
/
├── MANIFEST.md        # Load order + conflicts
├── HARD-RULES.md      # Non-negotiable rules
├── QUALITY-GATE.md    # Pre-deploy checklist
├── ANTI-PATTERNS.md   # What not to do
├── README.md          # This file
└── [skill-name]/
    ├── SKILL.md       # Rules (max 130 lines)
    ├── references/    # Details, code, config
    └── assets/        # Boilerplate files (if any)
```

## Skill Categories

### Foundation
| Skill | Purpose |
|-------|---------|
| project-spec-v4 | Project requirements template |
| astro-architecture | Tech stack and structure |
| astro-components | Component library patterns |
| page-structure | Landing page templates |
| section-skeleton | Section patterns |

### Conversion
| Skill | Purpose |
|-------|---------|
| astro-forms | Form handling and validation |
| lead-gen-calculator | Quote/pricing calculators |
| social-proof | Testimonials and trust |
| cro | Conversion Rate Optimization |
| ab-testing | A/B testing patterns |

### SEO & Content
| Skill | Purpose |
|-------|---------|
| astro-seo | Technical SEO |
| local-seo | Local business SEO |
| astro-blog | Blog implementation |
| lead-gen-copy | Copywriting patterns |
| schema-patterns | Structured data |

### Technical Quality
| Skill | Purpose |
|-------|---------|
| astro-performance | Core Web Vitals |
| speed-monitoring | Performance tracking |
| astro-a11y | Accessibility |
| astro-security | Security headers |
| error-states | Error handling |

### Visual & UX
| Skill | Purpose |
|-------|---------|
| astro-ux | UX patterns |
| astro-images | Image optimization |
| astro-animations | Motion design |
| astro-navigation | Nav components |
| youtube-embed | Video embeds |

### Integrations
| Skill | Purpose |
|-------|---------|
| analytics-measurement | GTM/GA4 |
| crm-integrations | CRM webhooks |
| email-templates | Email design |

## Usage

### Loading Skills

Skills are loaded based on project requirements. Example for a local business site:

```
Required:
- project-spec-v4
- astro-architecture
- astro-forms
- astro-images
- astro-seo
- local-seo
- astro-ux

Optional:
- social-proof
- schema-patterns
- analytics-measurement
```

### Skill Structure

Each skill follows this pattern:

```markdown
---
name: skill-name
description: One-line description
---

# Skill Name

## Purpose
2-3 lines explaining when to use this skill.

## Core Rules
1. Rule one
2. Rule two
...

## References
- [Topic](references/topic.md) — Description

## Forbidden
- ❌ What not to do

## Definition of Done
- [ ] Checklist item
```

### Using References

When implementing, check the references folder for:
- Code examples
- Component templates
- Configuration files
- Detailed explanations

## Performance Targets

| Metric | Target | Fail |
|--------|--------|------|
| PageSpeed Mobile | ≥ 90 | < 85 |
| PageSpeed Desktop | ≥ 95 | < 90 |
| LCP | < 2.5s | > 4s |
| CLS | < 0.1 | > 0.25 |
| Total JS | < 100KB | > 150KB |

## Contributing

When adding or modifying skills:

1. Keep SKILL.md under 130 lines
2. Move code examples to `references/`
3. Include Definition of Done checklist
4. Update MANIFEST.md if needed
5. Test against HARD-RULES.md

## License

Internal use only.
