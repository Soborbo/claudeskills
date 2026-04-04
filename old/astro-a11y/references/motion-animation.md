# Motion & Animation

## Respect Reduced Motion Preference

Always respect the `prefers-reduced-motion` media query:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Safe Animation Patterns

```css
/* Safe: Opacity and transform */
.fade-in {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Apply reduced motion */
@media (prefers-reduced-motion: reduce) {
  .fade-in {
    animation: none;
  }
}
```

## Best Practices

- Avoid animations that flash more than 3 times per second
- Provide pause/stop controls for auto-playing animations
- Don't use animation for essential information
- Test with `prefers-reduced-motion: reduce` enabled
- Consider users with vestibular disorders
