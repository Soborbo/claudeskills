# [PROJECT] - CLAUDE.md

> Version: v1.0 | Status: Ready

## ⚠️ Critical Rules

**If info missing:** STOP → List missing → Ask → Do NOT assume

**Claude must NOT:**
- Add features outside this document
- Add dependencies without approval
- Refactor unrelated code
- Make "improvements" outside scope

**When to refuse:** Missing info, conflicting instructions, security risk

**Authority:** CLAUDE.md > skills > comments > chat > assumptions (FORBIDDEN)

**Before coding:** Summarise task, list constraints, confirm no questions

---

## [CRITICAL] Project Overview

| Field | Value |
|-------|-------|
| Type | [Landing / Multi-page / Calculator] |
| Industry | |
| Location | |
| Goal | |
| Timeline | |

---

## [CRITICAL] Context (only if different from defaults)

```
Defaults assumed:
- Production, solo dev, multi-year, minimal tech debt
- Standard review, fail-fast errors, basic logging
- Personal data, visually-close UI, no refactoring
- Well-known deps, detailed human review
- Correctness first, no partial completion, resumable sessions
```

**Deviations from defaults:**
- 

---

## [REFERENCE] Client

| Field | Value |
|-------|-------|
| Business | |
| Contact | |
| Phone | |
| Email | |
| Address | |

---

## [CRITICAL] Scope

### In Scope
- 

### Out of Scope
- 

### Future Phase
- 

---

## [REFERENCE] Skills

| Skill | Use | Notes |
|-------|-----|-------|
| astro-forms | ✅ | |
| astro-security | ✅ | |
| astro-ux | ✅ | |
| lead-gen-calculator | ⬜ | |
| astro-audit | ✅ | |

---

## [REFERENCE] Branding

**Colors:**
- Primary: #
- Secondary: #
- Accent: #
- Text: #1F2937
- Background: #FFFFFF

**Typography:** [Font] from Google Fonts

**Tone:** [Professional / Friendly / Authoritative]

---

## [REFERENCE] Content

### Hero
- H1: 
- Subhead: 
- CTA1: 
- CTA2: 

### USPs (4)
1. 
2. 
3. 
4. 

### Reviews (3)
1. "[Quote]" — Name, Location
2. "[Quote]" — Name, Location
3. "[Quote]" — Name, Location

### FAQ (6+)
1. Q: / A:
2. Q: / A:
3. Q: / A:
4. Q: / A:
5. Q: / A:
6. Q: / A:

---

## [REFERENCE] Sections

| # | Section | Include | Notes |
|---|---------|---------|-------|
| 1 | Hero | ✅ | |
| 2 | USP Strip | ✅ | |
| 3 | Problem-Solution | ✅ | |
| 4 | Benefits | ✅ | |
| 5 | How It Works | ✅ | |
| 6 | Social Proof | ✅ | |
| 7 | Calculator | ⬜ | |
| 8 | Why Choose Us | ⬜ | |
| 9 | Service Areas | ⬜ | |
| 10 | FAQ | ✅ | |
| 11 | Final CTA | ✅ | |
| 12 | Footer | ✅ | |

---

## [REFERENCE] Technical

**Analytics:** GA4: | GTM:

**Forms:**
| Form | Fields | Required | Destination |
|------|--------|----------|-------------|
| Contact | Name, Email, Phone, Message | Name, Email | Email + Sheets |

**Domain:** Production: | Staging:

---

## [CRITICAL] Constraints

### Must Have
- 

### Must NOT Have
- 

---

## [REFERENCE] File Boundaries

**Allowed:** src/components/**, src/pages/**, src/styles/**, src/assets/**

**Do NOT modify:** astro.config.mjs, tsconfig.json, package.json (except deps)

---

## [REFERENCE] Risky Areas

- Form validation
- Email/Sheets integration
- Security headers
- Calculator pricing logic

---

## [CRITICAL] Definition of Done

- [ ] All sections built per spec
- [ ] Forms working (test submission received)
- [ ] Mobile responsive (320-1440px)
- [ ] Lighthouse 90+ all categories
- [ ] Browser tested (Chrome, Firefox, Safari, iOS, Android)
- [ ] Form tested (10 scenarios)
- [ ] No credentials in code
- [ ] astro-audit passes
- [ ] Client sign-off

---

## [CRITICAL] Self-Audit

Before complete, confirm:
- [ ] No assumptions made
- [ ] No scope creep
- [ ] All constraints respected
- [ ] No secrets in code
- [ ] All skills complied with

---

## [NO-IMPL] Notes

### [Date] - [Topic]
[Decision]

---

## [NO-IMPL] Changelog

| Date | Change |
|------|--------|
| | Initial |
