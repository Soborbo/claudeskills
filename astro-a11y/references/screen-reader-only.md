# Screen Reader Only Utility

## SR-Only CSS Class

Use this class to hide content visually but keep it accessible to screen readers:

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

## Usage Examples

```html
<!-- Skip link -->
<a href="#main-content" class="sr-only focus:not-sr-only">
  Skip to main content
</a>

<!-- Icon button -->
<button>
  <span class="sr-only">Close menu</span>
  <svg><!-- X icon --></svg>
</button>

<!-- Required field indicator -->
<label for="name">
  Name <span aria-hidden="true">*</span>
  <span class="sr-only">(required)</span>
</label>
```

## When to Use

- Skip navigation links
- Icon-only buttons
- Supplementary information
- Form field hints
- Status messages

## When NOT to Use

- Never for essential interactive content
- Not for headings (use proper heading structure)
- Not to hide errors (use proper ARIA)
