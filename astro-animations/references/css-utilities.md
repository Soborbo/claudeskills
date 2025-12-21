# CSS Animation Utilities

Base CSS animation utilities for common animation patterns.

## Base Animation Classes

```css
/* Base animation utilities */
.animate-fade-in {
  animation: fadeIn 0.3s ease-out forwards;
}

.animate-fade-up {
  animation: fadeUp 0.4s ease-out forwards;
}

.animate-slide-in {
  animation: slideIn 0.3s ease-out forwards;
}

.animate-scale-in {
  animation: scaleIn 0.2s ease-out forwards;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .animate-fade-in,
  .animate-fade-up,
  .animate-slide-in,
  .animate-scale-in {
    animation: none;
    opacity: 1;
    transform: none;
  }
}
```

## Usage

```html
<div class="animate-fade-up">Content fades up on load</div>
<button class="animate-scale-in">Scales in</button>
```
