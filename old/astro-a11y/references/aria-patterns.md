# ARIA Patterns

## Live Regions (Form Feedback)

Announce dynamic content changes to screen readers:

```html
<div role="alert" aria-live="polite" class="error-message">
  Please enter a valid email address
</div>

<div aria-live="polite" id="form-status">
  <!-- Dynamically updated on submit -->
</div>
```

## Mobile Menu Pattern

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

### JavaScript for Mobile Menu

```typescript
const menuButton = document.querySelector('[aria-controls="mobile-menu"]');
const menu = document.getElementById('mobile-menu');

menuButton.addEventListener('click', () => {
  const isExpanded = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!isExpanded));
  menu.setAttribute('aria-hidden', String(isExpanded));
});
```

## ARIA Best Practices

- Use semantic HTML first, ARIA second
- Never override native semantics
- Always maintain keyboard functionality
- Test with actual screen readers (NVDA, JAWS, VoiceOver)
