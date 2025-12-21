# Reduced Motion Best Practices

Accessibility guidelines for respecting user motion preferences.

## Core Principles

1. **Always respect prefers-reduced-motion** — Never skip this media query
2. **Default to accessible** — Consider reduced motion the baseline
3. **Preserve functionality** — Ensure UI works without animations
4. **Instant feedback** — No animation ≠ no visual response

## Standard Pattern

```css
/* Default: Animated */
.element {
  transition: transform 0.3s ease-out;
}

.element:hover {
  transform: translateY(-2px);
}

/* Reduced motion: Instant or no transform */
@media (prefers-reduced-motion: reduce) {
  .element {
    transition: none;
  }
  .element:hover {
    transform: none;
    /* Alternative: Show state change without motion */
    box-shadow: 0 0 0 2px var(--color-primary);
  }
}
```

## JavaScript Detection

```javascript
// Check user preference
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (prefersReducedMotion) {
  // Skip animations
  element.classList.add('no-animation');
} else {
  // Animate normally
  element.classList.add('animate-in');
}

// Listen for changes
const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
motionQuery.addEventListener('change', (e) => {
  if (e.matches) {
    // User enabled reduced motion
    disableAnimations();
  } else {
    // User disabled reduced motion
    enableAnimations();
  }
});
```

## What to Disable

### Always Disable
- ✅ Decorative animations (parallax, floating elements)
- ✅ Scroll-triggered reveals
- ✅ Automatic carousels/sliders
- ✅ Particle effects
- ✅ Looping animations

### Consider Keeping (Instant)
- ✅ Page transitions (make instant, 0s duration)
- ✅ Loading indicators (static spinner or progress bar)
- ✅ Focus indicators (instant, no transition)
- ✅ State changes (instant color/opacity change)

## Examples

### Good: Preserve Feedback

```css
.button {
  background: blue;
  transition: background 0.2s;
}

.button:hover {
  background: darkblue;
}

@media (prefers-reduced-motion: reduce) {
  .button {
    transition: none; /* Instant color change */
  }
  /* Keep hover state, just no transition */
}
```

### Bad: Remove All Feedback

```css
@media (prefers-reduced-motion: reduce) {
  .button:hover {
    background: blue; /* No hover feedback at all */
  }
}
```

## Testing

```javascript
// Force reduced motion for testing
document.documentElement.style.setProperty('--motion', 'reduce');

// Or add class
document.documentElement.classList.add('reduce-motion');
```

```css
/* Support class-based override */
.reduce-motion *,
.reduce-motion *::before,
.reduce-motion *::after {
  animation-duration: 0.01ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0.01ms !important;
}
```

## Resources

- [MDN: prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
- [WCAG 2.1: Animation from Interactions](https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html)
