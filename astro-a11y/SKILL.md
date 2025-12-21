---
name: astro-a11y
description: Accessibility patterns for Astro lead generation sites. WCAG 2.1 AA compliance, screen readers, keyboard navigation, focus management, ARIA. Use for all accessibility implementation.
---

# Astro Accessibility Skill

## Purpose

Ensures WCAG 2.1 AA compliance for lead generation websites. Legal requirement under UK Equality Act 2010.

## Core Rules

1. **Keyboard navigable** — All interactive elements reachable via Tab
2. **Screen reader friendly** — Semantic HTML, proper ARIA
3. **Visible focus** — Clear focus indicators on all elements
4. **Sufficient contrast** — 4.5:1 text, 3:1 UI components
5. **No motion harm** — Respect `prefers-reduced-motion`

## Semantic HTML First

```html
<!-- ✅ Correct -->
<button type="submit">Get Quote</button>
<nav aria-label="Main navigation">...</nav>
<main id="main-content">...</main>

<!-- ❌ Wrong -->
<div onclick="submit()">Get Quote</div>
<div class="nav">...</div>
<div class="main">...</div>
```

## Focus Management

### Skip Link (Required)

```astro
<a href="#main-content" class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-white focus:px-4 focus:py-2">
  Skip to main content
</a>
```

### Focus Trap (Modals)

```typescript
// Trap focus inside modal
const focusableElements = modal.querySelectorAll(
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
);
const firstElement = focusableElements[0];
const lastElement = focusableElements[focusableElements.length - 1];

modal.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement.focus();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement.focus();
    }
  }
  if (e.key === 'Escape') closeModal();
});
```

### Focus Visible

```css
/* Custom focus ring */
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Remove default only if custom exists */
:focus:not(:focus-visible) {
  outline: none;
}
```

## ARIA Patterns

### Live Regions (Form Feedback)

```html
<div role="alert" aria-live="polite" class="error-message">
  Please enter a valid email address
</div>

<div aria-live="polite" id="form-status">
  <!-- Dynamically updated on submit -->
</div>
```

### Buttons vs Links

| Element | Use For |
|---------|---------|
| `<button>` | Actions (submit, toggle, open modal) |
| `<a href>` | Navigation (go to page, section) |

### Mobile Menu

```html
<button
  aria-expanded="false"
  aria-controls="mobile-menu"
  aria-label="Open menu"
>
  <span class="sr-only">Menu</span>
  <!-- Hamburger icon -->
</button>

<nav id="mobile-menu" aria-hidden="true">
  <!-- Menu content -->
</nav>
```

## Color Contrast

| Element | Minimum Ratio |
|---------|---------------|
| Body text | 4.5:1 |
| Large text (18px+ or 14px bold) | 3:1 |
| UI components | 3:1 |
| Disabled elements | No requirement |

### Testing Tools
- Chrome DevTools → Rendering → Emulate vision deficiencies
- axe DevTools extension
- WAVE extension

## Motion & Animation

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Forms

### Labels (Required)

```html
<!-- ✅ Explicit label -->
<label for="email">Email address</label>
<input type="email" id="email" name="email" required>

<!-- ✅ Implicit label -->
<label>
  Email address
  <input type="email" name="email" required>
</label>

<!-- ❌ No label -->
<input type="email" placeholder="Email">
```

### Error Messages

```html
<label for="phone">Phone number</label>
<input
  type="tel"
  id="phone"
  aria-describedby="phone-error"
  aria-invalid="true"
>
<p id="phone-error" role="alert" class="text-red-600">
  Please enter a valid UK phone number
</p>
```

### Required Fields

```html
<label for="name">
  Name <span aria-hidden="true">*</span>
  <span class="sr-only">(required)</span>
</label>
<input type="text" id="name" required aria-required="true">
```

## Images

```html
<!-- Informative image -->
<img src="team.jpg" alt="Our Bristol-based removal team loading a van">

<!-- Decorative image -->
<img src="decoration.svg" alt="" role="presentation">

<!-- Complex image -->
<figure>
  <img src="process.png" alt="Our 4-step moving process" aria-describedby="process-desc">
  <figcaption id="process-desc">
    Step 1: Free quote. Step 2: Book date. Step 3: We pack. Step 4: Delivered.
  </figcaption>
</figure>
```

## Screen Reader Only

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.sr-only.focus\:not-sr-only:focus {
  position: static;
  width: auto;
  height: auto;
  padding: inherit;
  margin: inherit;
  overflow: visible;
  clip: auto;
  white-space: normal;
}
```

## Testing Checklist

### Keyboard
- [ ] Tab through entire page — logical order?
- [ ] All interactive elements reachable?
- [ ] Focus visible on every element?
- [ ] Can escape modals with Escape key?
- [ ] Skip link works?

### Screen Reader
- [ ] Page title announced?
- [ ] Headings hierarchy correct?
- [ ] Images have alt text?
- [ ] Form labels announced?
- [ ] Errors announced (aria-live)?

### Visual
- [ ] Contrast passes (4.5:1)?
- [ ] Text resizes to 200% without breaking?
- [ ] Works without color alone?
- [ ] Reduced motion respected?

## Forbidden

- ❌ `<div>` or `<span>` for interactive elements
- ❌ `outline: none` without replacement focus style
- ❌ `tabindex` greater than 0
- ❌ Missing form labels
- ❌ Color as only indicator
- ❌ Auto-playing video/audio
- ❌ CAPTCHA without alternative

## Definition of Done

- [ ] Skip link present
- [ ] All forms have labels
- [ ] Contrast ratios pass
- [ ] Keyboard navigation works
- [ ] axe DevTools shows 0 errors
- [ ] Screen reader test passed
- [ ] Reduced motion respected
