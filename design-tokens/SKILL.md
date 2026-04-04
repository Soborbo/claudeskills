---
name: design-tokens
description: Design system foundation. Generates full color scales, typography, and spacing from siteConfig.brand and siteConfig.fonts. No raw values in components.
---

# Design Tokens Skill

**siteConfig.brand → full design system. Zero guessing.**

## Purpose

Generate the complete design system (Tailwind config + CSS variables) from `siteConfig.brand` and `siteConfig.fonts`. This skill does NOT define colors or fonts — it expands them into a full token system.

## Source of Truth

> **`siteConfig` is the source. This skill is the transformer.**
> - Colors come from `siteConfig.brand` (primary, secondary, accent, dark, light)
> - Fonts come from `siteConfig.fonts` (heading, body)
> - This skill expands them into full scales, semantic tokens, and Tailwind config

### What siteConfig provides → what this skill generates

| siteConfig field | This skill generates |
|-----------------|---------------------|
| `brand.primary` (#2563EB) | `primary-50` through `primary-950` (full scale) |
| `brand.accent` (#F59E0B) | `accent`, `accent-hover`, `accent-light` |
| `brand.dark` (#1F2937) | `neutral-50` through `neutral-900` |
| `brand.light` (#F9FAFB) | Light section backgrounds |
| `brand.secondary` | Secondary element tokens |
| `brand.surface` | Card/surface backgrounds (if set) |
| `fonts.heading` | Heading font stack |
| `fonts.body` | Body font stack with system fallbacks |

## Output

```yaml
tokens_generated: true
tailwind_config: "tailwind.config.mjs"
css_variables: "src/styles/tokens.css"
design_token_verdict: PASS | WARN | FAIL
```

## Generation Process

### Step 1: Read siteConfig.brand

```typescript
import { config } from '@/config/siteConfig.example';

const { primary, secondary, accent, dark, light, surface } = config.brand;
const { heading, body } = config.fonts;
```

### Step 2: Generate full primary scale from base color

From `brand.primary`, generate shades 50–950 using HSL lightness shifts:

| Shade | Lightness shift | Use |
|-------|----------------|-----|
| 50 | Very light (95%) | Subtle backgrounds |
| 100 | Light (90%) | Section backgrounds |
| 200 | (80%) | Borders on dark |
| 300 | (70%) | Disabled states |
| 400 | (55%) | Placeholder text |
| 500 | Base color | — |
| 600 | (40%) | Hover states |
| 700 | (30%) | Secondary text |
| 800 | (20%) | Headings |
| 900 | (15%) | Body text, headlines |
| 950 | Very dark (10%) | Maximum contrast |

### Step 3: Generate Tailwind config + CSS variables

Write `tailwind.config.mjs` with all tokens mapped from siteConfig, and `src/styles/tokens.css` with CSS custom properties.

## Token Categories

| Type | Tokens | Usage |
|------|--------|-------|
| Semantic | `primary-*`, `accent`, `neutral-*` | Use in components |
| Utility | `spacing.*`, `font-*`, `shadow-*` | Internal mapping only |

**Rule:** Components use semantic tokens. Utility for internal only.

## Token Usage Scope

| Token | Allowed | Forbidden |
|-------|---------|-----------|
| `accent` | CTAs, links, highlights | Body text, backgrounds |
| `primary-900` | Headlines, body text | Buttons |
| `primary-100` | Section backgrounds | Text |
| `neutral-200` | Borders, dividers | CTAs |

**Wrong scope = WARN.**

## Forbidden Raw Values

| Type | Forbidden | Use Instead |
|------|-----------|-------------|
| Colors | `#FF6B35`, `rgb()` | `bg-accent`, `text-primary-900` |
| Spacing | `mt-[23px]` | `mt-6` |
| Font sizes | `text-[18px]` | `text-lg` |
| Shadows | `shadow-[...]` | `shadow-card` |
| Radius | `rounded-[12px]` | `rounded-lg` |

**Any raw value in component = FAIL.**

## A11y Contrast Requirements

| Combination | Min Ratio | Standard |
|-------------|-----------|----------|
| Body text on white | 4.5:1 | AA |
| Body text on primary-100 | 4.5:1 | AA |
| Large text (≥18px) | 3:1 | AA |
| CTA text on accent | 4.5:1 | AA |
| UI components | 3:1 | AA |

**Contrast fail = FAIL.**

### Color Contrast (WCAG AA — Mandatory)

Every text/background color pair MUST meet minimum contrast ratios:

| Text Type | Min Ratio | Example |
|-----------|-----------|---------|
| Normal text (<18px, or <14px bold) | 4.5:1 | Body text on backgrounds |
| Large text (≥18px, or ≥14px bold) | 3:1 | Headlines on colored sections |
| UI components (icons, borders) | 3:1 | Icon on background |

**Common failure patterns to avoid:**
- White text on medium-tone accent backgrounds (e.g. `text-white` on `#C4704B` = 3.2:1 FAIL)
- Semi-transparent text (`text-white/80`, `text-white/75`) on colored backgrounds — the reduced opacity lowers contrast further
- Light gray text on white backgrounds (`text-gray-400` on `white` = often FAIL)

**Validation:** Use https://webaim.org/resources/contrastchecker/ for every text/background pair.

**Rule:** When choosing accent colors, always verify that `white` text passes 4.5:1 on the accent background. If it fails, darken the accent or use `primary-900` text instead.

## Typography (Fluid Scale)

Font family derived from `siteConfig.fonts`:
- Heading: `config.fonts.heading` → `system-ui` → `sans-serif`
- Body: `config.fonts.body` → `system-ui` → `sans-serif`

| Token | Range | Use |
|-------|-------|-----|
| `text-base` | 16-18px | Body |
| `text-lg` | 18-20px | Lead |
| `text-2xl` | 24-32px | H3 |
| `text-3xl` | 30-40px | H2 |
| `text-4xl/5xl` | 36-64px | H1 |

## Spacing (8px Grid)

| Token | Value | Use |
|-------|-------|-----|
| `py-12 md:py-20` | 48/80px | Section padding Y |
| `px-4 md:px-8` | 16/32px | Section padding X |
| `gap-6 md:gap-8` | 24/32px | Component gap |
| `p-4 md:p-6` | 16/24px | Card padding |

## Design Token Verdict

```yaml
design_token_verdict: PASS | WARN | FAIL
issues: []
```

| Condition | Verdict |
|-----------|---------|
| Raw value in component | FAIL |
| Contrast fail | FAIL |
| Missing required token | FAIL |
| Token doesn't trace back to siteConfig | FAIL |
| Wrong token scope | WARN |
| Missing shade in scale | WARN |
| All rules pass | PASS |

## FAIL States

| Condition |
|-----------|
| Hardcoded hex in component |
| Arbitrary spacing `[Xpx]` |
| Contrast ratio below AA |
| Missing primary scale |
| Missing accent colors |
| Color/font not derived from siteConfig |

## WARN States

| Condition |
|-----------|
| Token used in wrong scope |
| Missing optional shades |
| Non-standard font loaded |

## Definition of Done

- [ ] `tailwind.config.mjs` generated from siteConfig.brand + siteConfig.fonts
- [ ] `tokens.css` with CSS variables mapped to siteConfig values
- [ ] Primary has full scale (50-950) generated from `brand.primary`
- [ ] Accent has hover + light generated from `brand.accent`
- [ ] Neutral scale generated from `brand.dark`
- [ ] Font stacks use `config.fonts.heading` and `config.fonts.body`
- [ ] Contrast passes AA for all generated combinations
- [ ] No raw values in components
- [ ] No hardcoded colors/fonts that bypass siteConfig
- [ ] design_token_verdict = PASS
