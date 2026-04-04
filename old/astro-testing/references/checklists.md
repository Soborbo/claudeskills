# Manual Testing Checklists

## Mobile Testing (375px - iPhone SE)

### Navigation
- [ ] Menu button visible
- [ ] Menu opens on tap
- [ ] Menu closes on tap/outside
- [ ] All links work
- [ ] Logo links to home
- [ ] Sticky CTA visible after scroll

### Forms
- [ ] Form visible without scroll (or easy to reach)
- [ ] All fields accessible
- [ ] Keyboard appears correctly
- [ ] Keyboard doesn't cover fields
- [ ] Validation errors visible
- [ ] Submit button tappable (44px+)
- [ ] Success message shows
- [ ] Redirect to thank you works

### Content
- [ ] Text readable (16px minimum)
- [ ] No text overflow
- [ ] No horizontal scroll
- [ ] Images load correctly
- [ ] Images don't cause layout shift
- [ ] Buttons/links 44px+ tap target

### Phone/Contact
- [ ] Phone number clickable (tel:)
- [ ] Phone opens dialer
- [ ] Email clickable (mailto:)

### Performance
- [ ] Page loads <3 seconds
- [ ] No visible layout shift
- [ ] Images don't load slowly
- [ ] No janky scroll

---

## Desktop Testing (1440px)

### Header
- [ ] Logo displays correctly
- [ ] Navigation links visible
- [ ] Dropdown menus work (if any)
- [ ] CTA button visible
- [ ] Sticky behavior correct

### Layout
- [ ] Grid layouts aligned
- [ ] Sections have proper spacing
- [ ] Images correct aspect ratio
- [ ] No overflow issues
- [ ] Footer at bottom

### Interactions
- [ ] Hover states work
- [ ] Focus states visible (keyboard nav)
- [ ] Animations smooth
- [ ] Scroll behavior correct
- [ ] Click areas appropriate

### Forms
- [ ] Tab order logical
- [ ] Enter submits form
- [ ] Labels associated with inputs
- [ ] Error states clear
- [ ] Success feedback visible

---

## Critical Path Checklist

| # | Test | Mobile | Desktop |
|---|------|--------|---------|
| 1 | Homepage loads without errors | [ ] | [ ] |
| 2 | Primary CTA button works | [ ] | [ ] |
| 3 | Form is visible/accessible | [ ] | [ ] |
| 4 | Form submits successfully | [ ] | [ ] |
| 5 | Thank you page displays | [ ] | [ ] |
| 6 | Business email received | [ ] | [ ] |
| 7 | Customer confirmation sent | [ ] | [ ] |
| 8 | Phone link works (tel:) | [ ] | N/A |
| 9 | Mobile menu opens/closes | [ ] | N/A |
| 10 | 404 page for bad URLs | [ ] | [ ] |

**All must pass on required browsers.**

---

## Accessibility Checklist (Manual)

### Keyboard Navigation
- [ ] Tab through entire page possible
- [ ] Tab order logical
- [ ] Focus indicator visible
- [ ] Skip link works
- [ ] Modal/menu traps focus
- [ ] Escape closes overlays

### Screen Reader (test with VoiceOver/NVDA)
- [ ] Page title read correctly
- [ ] Headings hierarchy correct
- [ ] Images have alt text
- [ ] Form labels announced
- [ ] Error messages announced
- [ ] Success messages announced
- [ ] Links have descriptive text

### Visual
- [ ] Text contrast 4.5:1 minimum
- [ ] Focus indicators visible
- [ ] Not color-only indicators
- [ ] Text resizable to 200%
- [ ] Content reflows at 320px

---

## Performance Checklist

### Lighthouse Scores (must all be ≥90)
- [ ] Performance: ___
- [ ] Accessibility: ___
- [ ] Best Practices: ___
- [ ] SEO: ___

### Core Web Vitals
- [ ] LCP <2.5s: ___
- [ ] FID <100ms: ___
- [ ] CLS <0.1: ___

### Assets
- [ ] Images optimized (AVIF/WebP)
- [ ] Total JS <100KB
- [ ] No render-blocking resources
- [ ] Fonts preloaded

---

## Browser Matrix Checklist

### Required (FAIL if not tested)
| Browser | Version | Tested | Pass |
|---------|---------|--------|------|
| Chrome Mobile | Latest | [ ] | [ ] |
| Safari iOS | Latest | [ ] | [ ] |
| Chrome Desktop | Latest | [ ] | [ ] |
| Safari Desktop | Latest | [ ] | [ ] |

### Optional (WARN if issues)
| Browser | Version | Tested | Pass |
|---------|---------|--------|------|
| Firefox | Latest | [ ] | [ ] |
| Edge | Latest | [ ] | [ ] |
| Samsung Internet | Latest | [ ] | [ ] |

---

## Data Integrity Checklist

| Check | Verified |
|-------|----------|
| Lead saved in database/sheets | [ ] |
| Business notification email received | [ ] |
| Customer confirmation email sent | [ ] |
| Analytics event fired (check GTM) | [ ] |
| Correct form data captured | [ ] |

**If form shows success but any above fails = CRITICAL FAIL.**

---

## Negative Test Checklist

| Test | Expected Result | Actual |
|------|-----------------|--------|
| Submit empty form | Error shown | [ ] |
| Invalid email | Validation error | [ ] |
| Invalid phone | Validation error | [ ] |
| Skip privacy checkbox | Submit blocked | [ ] |
| Fill honeypot | Silent rejection | [ ] |
| Submit twice quickly | Duplicate prevented | [ ] |

**If any passes when it shouldn't = FAIL.**

---

## Final Sign-off

| Check | Completed |
|-------|-----------|
| All 10 critical paths pass | [ ] |
| Data integrity verified | [ ] |
| Negative tests verified | [ ] |
| All required browsers tested | [ ] |
| Lighthouse ≥90 all categories | [ ] |
| A11y thresholds met | [ ] |
| Client approved (if applicable) | [ ] |

**test_verdict:** [ ] PASS  [ ] WARN  [ ] FAIL

**Tester:** _______________  **Date:** _______________
