# Accessibility Audit

## WCAG 2.1 AA Requirements

Must meet Level AA for commercial sites.

## Automated Checks

```bash
# axe-core via CLI
npx @axe-core/cli https://staging.example.com

# pa11y
npx pa11y https://staging.example.com

# Lighthouse accessibility
npx lighthouse https://staging.example.com --only-categories=accessibility
```

## Keyboard Navigation

```bash
# Check for tabindex issues
grep -rn "tabindex" src/

# tabindex="-1" OK (programmatic focus)
# tabindex="0" OK (add to tab order)
# tabindex > 0 NEVER (breaks order)
```

**Manual tests:**
- [ ] Tab through entire page
- [ ] All interactive elements focusable
- [ ] Focus visible at all times
- [ ] Skip-to-content link works
- [ ] Escape closes modals
- [ ] Arrow keys work in menus

## Focus Management

```bash
# Check focus-visible styles
grep -rn "focus-visible\|:focus" src/

# Check focus trap in modals
grep -rn "focus.*trap\|createFocusTrap" src/
```

**Required:**
```css
/* Must have visible focus */
:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

/* Don't remove focus for mouse users incorrectly */
:focus:not(:focus-visible) {
  outline: none;
}
```

## Images & Media

```bash
# Images without alt
grep -rn "<img" src/ | grep -v "alt="
grep -rn "<Image" src/ | grep -v "alt="

# Decorative images should have alt=""
grep -rn 'alt=""' src/

# SVGs need accessible names
grep -rn "<svg" src/ | grep -v "aria-label\|aria-hidden\|role="
```

**Rules:**
- Informative images: descriptive alt
- Decorative images: `alt=""`
- Complex images: long description
- Icons: `aria-hidden="true"` if decorative
- Icon buttons: `aria-label`

## Forms

```bash
# Inputs without labels
grep -rn "<input" src/ | grep -v "aria-label\|id="
grep -rn "<label" src/ | grep "for="

# Required field indication
grep -rn "required" src/ | head -10

# Error message association
grep -rn "aria-describedby\|aria-errormessage" src/
```

**Form requirements:**
- Every input has visible label
- Labels linked via `for` attribute
- Required fields marked (not just color)
- Error messages announced
- Success feedback provided

## Color & Contrast

```bash
# Check for color-only meaning
grep -rn "color:" src/ --include="*.css" | head -20
```

**Manual checks:**
- [ ] 4.5:1 contrast for normal text
- [ ] 3:1 contrast for large text
- [ ] 3:1 contrast for UI components
- [ ] Information not conveyed by color alone
- [ ] Test with colorblind simulator

**Tools:**
- WebAIM Contrast Checker
- Chrome DevTools → Rendering → Emulate vision deficiencies

## Headings

```bash
# Check heading hierarchy
grep -rn "<h[1-6]" src/ --include="*.astro" | sort

# Must have:
# - Exactly one h1 per page
# - No skipped levels (h1 → h3)
# - Logical structure
```

## ARIA Usage

```bash
# Find ARIA usage
grep -rn "aria-" src/ | head -30

# Common issues
grep -rn 'role="button"' src/  # Should be <button> instead
grep -rn "aria-label" src/ | grep "<div\|<span"
```

**ARIA rules:**
- Prefer semantic HTML over ARIA
- Don't use `role="button"` on `<div>` (use `<button>`)
- All ARIA IDs must exist
- Dynamic content needs `aria-live`

## Motion & Animation

```bash
# Check for reduced motion support
grep -rn "prefers-reduced-motion" src/
```

**Required:**
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Language

```bash
# Check html lang
grep -rn '<html.*lang=' src/layouts/

# Check for lang changes in content
grep -rn 'lang="' src/ | grep -v "<html"
```

## Skip Links

```bash
# Check skip link exists
grep -rn "skip" src/ | grep -i "content\|main\|nav"
```

**Required:**
```html
<a href="#main-content" class="skip-link">
  Skip to main content
</a>
```

## Mobile Accessibility

```bash
# Check touch target sizes
grep -rn "min-height:\|min-width:" src/ --include="*.css"

# Check zoom prevention (BAD)
grep -rn "user-scalable=no\|maximum-scale=1" src/
```

**Requirements:**
- Touch targets: 44x44px minimum
- No zoom disable
- Adequate spacing between targets

## Accessibility Checklist

- [ ] Lighthouse Accessibility > 95
- [ ] axe-core zero violations
- [ ] Keyboard navigation complete
- [ ] Focus visible everywhere
- [ ] Skip link present
- [ ] All images have alt
- [ ] Forms properly labeled
- [ ] Color contrast passes
- [ ] Heading hierarchy logical
- [ ] reduced-motion supported
- [ ] Language declared
- [ ] No zoom disabled
