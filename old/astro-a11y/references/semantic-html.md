# Semantic HTML Patterns

## Correct Usage

```html
<!-- ✅ Correct -->
<button type="submit">Get Quote</button>
<nav aria-label="Main navigation">...</nav>
<main id="main-content">...</main>
```

## Wrong Usage

```html
<!-- ❌ Wrong -->
<div onclick="submit()">Get Quote</div>
<div class="nav">...</div>
<div class="main">...</div>
```

## Key Principle

Always use semantic HTML elements for their intended purpose. Buttons for actions, links for navigation, nav for navigation containers, main for main content.
