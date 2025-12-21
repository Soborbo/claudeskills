---
name: astro-images
description: Image optimization patterns for Astro. Formats, sizing, lazy loading, CLS prevention. Use for all image implementation in Astro projects.
---

# Astro Images Skill

## Purpose

Handles all image optimization for Astro projects. Performance-focused patterns.

## Core Rules

1. **Always use `<Picture>` component** — Never raw `<img>`
2. **Modern formats first** — avif, webp with jpg/png fallback
3. **Responsive widths** — Multiple sizes for srcset
4. **Lazy load below fold** — Only hero gets eager loading
5. **Prevent CLS** — Always set aspect-ratio

## Quick Reference

See [astro-picture-skill.md](../astro-picture-skill.md) for detailed patterns including:
- Format configurations
- Component patterns (HeroImage, ContentImage, CardImage, etc.)
- Loading strategies by position
- CLS prevention with aspect-ratio

## Image Types

| Type | Formats | Fallback |
|------|---------|----------|
| Photos | avif, webp | jpg |
| Graphics | webp | png |
| Icons/Logos | Inline SVG preferred | webp → png |

## Loading Strategy

| Position | loading | fetchpriority |
|----------|---------|---------------|
| Hero | eager | high |
| Above-fold | eager | auto |
| Below-fold | lazy | auto |

## Forbidden

- Raw `<img>` tags
- Missing alt text
- Missing aspect-ratio
- `fetchpriority="high"` on non-hero images
- Remote images without `inferSize`

## Definition of Done

- [ ] All images use Picture component
- [ ] Formats configured (avif, webp + fallback)
- [ ] Responsive widths set
- [ ] Hero image is only eager+high priority
- [ ] All images have alt text
- [ ] All images have aspect-ratio
