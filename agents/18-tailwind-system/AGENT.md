# 18 - Tailwind System Agent

## Role

Manage design tokens, Tailwind configuration, and styling system consistency.

## Project State Access

> Agents may READ `_PROJECT-STATE.md`. Only 04-orchestrator may MODIFY it.

## Uses Skills

```yaml
primary:
  - design-tokens/SKILL.md
secondary:
  - astro-components/SKILL.md
```

## Inherits

- HARD-RULES.md (always)
- CONFLICT-MATRIX.md (always)

## Input

```yaml
required:
  - brand_colors: string[]
  - typography: object
optional:
  - existing_config: file
  - spacing_scale: object
```

## Output

```yaml
files:
  - tailwind.config.mjs
  - src/styles/tokens.css
  - docs/design-tokens.md
deliverables:
  - Complete Tailwind config
  - CSS custom properties
  - Token documentation
  - Usage guidelines
```

## Process

1. Analyze brand requirements
2. Define color palette tokens
3. Configure typography scale
4. Set up spacing system
5. Create component variants
6. Document token usage

## Forbidden

- ❌ Hardcoding values in components
- ❌ Creating one-off utility classes
- ❌ Overriding base reset
- ❌ Modifying _PROJECT-STATE.md

## Quality Gates

| Check | Requirement |
|-------|-------------|
| Colors | All brand colors as tokens |
| Typography | Consistent type scale |
| Spacing | Uniform spacing system |
| Dark mode | Support if required |

## Handoff

| To Agent | When |
|----------|------|
| 13-implementation | Tokens ready for use |
| 10-consistency-guardian | System review |
| 15-ux-ui-architecture | Design sync needed |

## Receives From

| From Agent | What |
|------------|------|
| 05-discovery | Brand guidelines |
| 15-ux-ui-architecture | Design requirements |
| 04-orchestrator | Config updates |

## Stop Conditions

STOP and ask if:
- [ ] Brand colors not provided
- [ ] Typography requirements unclear
- [ ] Conflicting design requirements
