# Page Transitions

Astro View Transitions API implementation.

## Basic Setup

```astro
---
// In BaseLayout.astro
import { ViewTransitions } from 'astro:transitions';
---

<head>
  <ViewTransitions />
</head>

<style is:global>
  /* Customize transitions */
  ::view-transition-old(root),
  ::view-transition-new(root) {
    animation-duration: 0.2s;
  }

  /* Fade transition for specific elements */
  .fade-transition {
    view-transition-name: fade;
  }

  ::view-transition-old(fade),
  ::view-transition-new(fade) {
    animation: fade 0.3s ease-out;
  }

  @keyframes fade {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @media (prefers-reduced-motion: reduce) {
    ::view-transition-old(root),
    ::view-transition-new(root),
    ::view-transition-old(fade),
    ::view-transition-new(fade) {
      animation: none;
    }
  }
</style>
```

## Custom Transition Types

```css
/* Slide transition */
.slide-transition {
  view-transition-name: slide;
}

::view-transition-old(slide) {
  animation: slideOut 0.3s ease-out;
}

::view-transition-new(slide) {
  animation: slideIn 0.3s ease-out;
}

@keyframes slideOut {
  to { transform: translateX(-100%); }
}

@keyframes slideIn {
  from { transform: translateX(100%); }
}

/* Scale transition */
.scale-transition {
  view-transition-name: scale;
}

::view-transition-old(scale) {
  animation: scaleOut 0.3s ease-out;
}

::view-transition-new(scale) {
  animation: scaleIn 0.3s ease-out;
}

@keyframes scaleOut {
  to {
    opacity: 0;
    transform: scale(0.8);
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(1.2);
  }
}
```

## Usage

```astro
<!-- Basic fade transition -->
<div class="fade-transition">
  <h1>This element transitions smoothly</h1>
</div>

<!-- Keep element persistent across pages -->
<header transition:persist>
  <nav>...</nav>
</header>

<!-- Animate specific elements -->
<img
  src="/logo.png"
  transition:name="logo"
  transition:animate="slide"
/>
```
