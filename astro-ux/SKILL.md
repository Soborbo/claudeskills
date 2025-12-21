---
name: astro-ux
description: UX/UI patterns for high-converting Astro lead generation websites. Use when building landing pages, service pages, or multi-page lead gen sites for UK service businesses. Covers section structure, CTA placement, mobile patterns, trust elements, CRO, microinteractions, and HIG compliance.
---

# Astro UX Skill

**UX always serves CRO.** Every element earns its place.

## Section Order (Strict)

| # | Section | CTA |
|---|---------|-----|
| 1 | Hero | ✓ |
| 2 | USP/Trust Strip | - |
| 3 | Problem-Solution | - |
| 4 | Benefits (with images) | ✓ |
| 5 | How It Works | - |
| 6 | Social Proof | ✓ |
| 7 | Calculator/Quote Tool | - |
| 8 | Why Choose Us | ✓ |
| 9 | Comparison Table | - |
| 10 | Trust Logos | - |
| 11 | Common Concerns | ✓ |
| 12 | About | - |
| 13 | FAQ | - |
| 14 | Customer Showcase | ✓ |
| 15 | Final CTA | ✓ |
| 16 | Footer | - |

**CTA Rule:** Only every 2nd viewport. Never compete with yourself.

## Above The Fold (Strict)

Desktop must show WITHOUT scroll:
1. Hero (headline, CTA, image) — MUST fit completely
2. USP/Trust strip — last fold element

Hero: `max-height: calc(100vh - header - usp)`. Never overflow.

## Desktop Header Behavior

1. **Initial:** Normal header with full navigation
2. **After scrolling past fold:** Header hides
3. **On scroll UP:** Sticky compact header appears with: Logo + Address + Phone + CTA
4. **Long pages (10+ sections):** Add sticky side TOC on left

## WhatsApp Button (Desktop)

- Position: Bottom-right corner, floating
- Appears after 6 seconds
- Subtle fade-in + pulse animation

See [desktop-cta.md](references/desktop-cta.md).

## Mobile Patterns

- **Sticky bottom bar:** WhatsApp + Quote (2 buttons only)
- **Menu animation:** Spectacular entrance (slide + fade + stagger)
- **Tables:** Horizontal scroll with fade hint
- **Process cards:** Swipeable, 2nd card ~20% visible
- **Gallery:** CSS scroll-snap only, no heavy libs

See [mobile.md](references/mobile.md).

## Animation Rules

- **Above fold:** No entrance animations. Hover/feedback only.
- **Below fold:** In-view animations allowed (fade-up, slide-in)
- **Microinteractions required:** See [microinteractions.md](references/microinteractions.md)

## HIG Compliance

Apple HIG + Material Design: 44px touch targets, 8px grid, visual feedback on every interaction.

## Build Process (Important)

Before implementing, ALWAYS propose and get approval for:

1. **5 smart details** — Present 6-8 options, client picks 5
2. **2-4 unique ideas** — Present ideas with CRO reasoning, client validates

Format for proposals:
```
## Smart Details Options (pick 5)
1. [Detail] — [Why it helps]
2. [Detail] — [Why it helps]
...

## Unique Ideas (pick 2-4)
1. **[Idea]** — [Description]
   CRO benefit: [Why it increases conversion]
```

Do NOT implement until approved.

## Section Details

See [sections.md](references/sections.md) for:
- Problem-Solution: first sentence 2px larger
- Benefits: must have images
- All placeholder sizes

## References

- [sections.md](references/sections.md) — Section patterns
- [mobile.md](references/mobile.md) — Mobile patterns
- [desktop-cta.md](references/desktop-cta.md) — Header behavior, WhatsApp
- [microinteractions.md](references/microinteractions.md) — Animations
- [placeholders.md](references/placeholders.md) — Image sizes
