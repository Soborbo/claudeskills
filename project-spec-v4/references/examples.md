# CLAUDE.md Examples

## Example 1: Simple Landing Page

```markdown
# Swift Removals Bristol - CLAUDE.md

> Version: v1.0 | Status: Ready

## ⚠️ Critical Rules

**If info missing:** STOP → Ask → Do NOT assume
**Claude must NOT:** Add features, deps, refactor outside scope
**Authority:** CLAUDE.md > skills > assumptions (FORBIDDEN)

---

## Project Overview

| Field | Value |
|-------|-------|
| Type | Landing Page |
| Industry | House Removals |
| Location | Bristol, UK |
| Goal | Phone calls + quote forms |
| Timeline | Jan 30 |

---

## Client

| Phone | 0117 123 4567 |
| Email | info@swiftremovalsbristol.co.uk |

---

## Scope

**In:** Homepage, Thank you, Contact form
**Out:** Pricing page, Blog, Booking system
**Skills:** astro-forms ✅, astro-security ✅, astro-ux ✅

---

## Branding

- Primary: #2563EB
- Accent: #F59E0B (CTAs only)
- Font: Inter

---

## Content

**H1:** Stress-Free Moving Day, Guaranteed
**USPs:** Fully Insured | No Hidden Fees | 15+ Years | Same-Day Quotes
**CTA:** Get Free Quote / Call 0117 123 4567

---

## Sections

Hero → USP → Problem-Solution (owner photo) → Benefits → How It Works → Reviews → Service Areas → FAQ → Final CTA → Footer

---

## Constraints

**Must:** Phone in sticky header, Quote form above fold mobile
**Must NOT:** Show prices, Use stock truck photos

---

## DoD

- [ ] Forms working, Lighthouse 90+, Mobile tested
```

---

## Example 2: Landing + Calculator

```markdown
# Crystal Clear Windows - CLAUDE.md

> Version: v1.0 | Status: Ready

## ⚠️ Critical Rules

[Standard block]

---

## Project Overview

| Type | Landing + Calculator |
| Industry | Window Cleaning |
| Location | Cardiff, Wales |
| Goal | Instant quote submissions |

---

## Skills

astro-forms ✅, lead-gen-calculator ✅, astro-ux ✅

---

## Calculator Spec

**Steps:**
1. Property type (House / Flat / Commercial)
2. Windows (slider 1-30)
3. Frequency (One-off / Monthly / Quarterly)
4. Extras checkboxes

**Pricing:**
```
Base: £3/window
House: ×1.2
Frequency: Monthly -20%, Quarterly -10%
Extras: Frames +£1, Sills +£0.50, Conservatory +£25
Commercial: "Request quote" (no calc)
```

**Output:** Show price → Capture Name, Email, Phone, Address

---

## Sections

Hero → USP → Calculator (full width) → How It Works → Reviews → FAQ (include pricing) → Final CTA → Footer

---

## Constraints

**Must:** Instant price, "No obligation" messaging
**Must NOT:** Commercial pricing (too variable)

---

## DoD

- [ ] Calculator logic correct
- [ ] All 10 form tests pass
- [ ] Lighthouse 90+
```

---

## Key Differences

| Type | Sections | Skills | Complexity |
|------|----------|--------|------------|
| Simple | ~10 | 3 | 4-8h |
| Calculator | ~8 + calc | 4 | 16-24h |
