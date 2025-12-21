# Focus Management

## Skip Link (Required)

Every page must have a skip link as the first focusable element:

```astro
<a href="#main-content" class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-white focus:px-4 focus:py-2">
  Skip to main content
</a>
```

## Focus Trap (Modals)

Trap focus inside modal dialogs to prevent tabbing to background content:

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

## Focus Visible Styles

Custom focus indicators for better visibility:

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

## Best Practices

- Always provide visible focus indicators
- Focus indicators must have 3:1 contrast ratio
- Never use `outline: none` without a replacement
- Test keyboard navigation regularly
