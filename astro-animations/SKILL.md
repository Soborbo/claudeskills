---
name: astro-animations
description: Animation patterns for Astro sites. Scroll animations, micro-interactions, transitions, loading states. Performance-focused, accessibility-aware.
---

# Astro Animations Skill

## Purpose

Provides animation patterns that enhance UX without harming performance or accessibility.

## Core Rules

1. **Purpose over polish** — Every animation should serve UX
2. **Performance first** — Use CSS, avoid JS where possible
3. **Respect preferences** — Honor `prefers-reduced-motion`
4. **Subtle over flashy** — Enhance, don't distract
5. **Fast** — Animations under 300ms for interactions

## Animation Timing

| Type | Duration | Easing |
|------|----------|--------|
| Micro-interaction | 100-200ms | ease-out |
| Reveal/Fade | 200-400ms | ease-out |
| Slide | 300-500ms | ease-in-out |
| Page transition | 200-300ms | ease-out |

## CSS Animation Utilities

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

## Scroll Reveal Animation

```astro
---
interface Props {
  class?: string;
  animation?: 'fade-up' | 'fade-in' | 'slide-in';
  delay?: number;
  threshold?: number;
}

const {
  class: className,
  animation = 'fade-up',
  delay = 0,
  threshold = 0.1
} = Astro.props;
---

<div
  class:list={['scroll-reveal', className]}
  data-animation={animation}
  data-delay={delay}
  data-threshold={threshold}
>
  <slot />
</div>

<style>
  .scroll-reveal {
    opacity: 0;
  }

  .scroll-reveal.is-visible {
    opacity: 1;
  }

  .scroll-reveal[data-animation="fade-up"] {
    transform: translateY(30px);
    transition: opacity 0.6s ease-out, transform 0.6s ease-out;
  }

  .scroll-reveal[data-animation="fade-up"].is-visible {
    transform: translateY(0);
  }

  .scroll-reveal[data-animation="fade-in"] {
    transition: opacity 0.6s ease-out;
  }

  .scroll-reveal[data-animation="slide-in"] {
    transform: translateX(-30px);
    transition: opacity 0.6s ease-out, transform 0.6s ease-out;
  }

  .scroll-reveal[data-animation="slide-in"].is-visible {
    transform: translateX(0);
  }

  @media (prefers-reduced-motion: reduce) {
    .scroll-reveal {
      opacity: 1;
      transform: none;
      transition: none;
    }
  }
</style>

<script>
  function initScrollReveal() {
    const elements = document.querySelectorAll('.scroll-reveal:not(.is-visible)');

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      elements.forEach(el => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            const delay = parseInt(el.dataset.delay || '0');

            setTimeout(() => {
              el.classList.add('is-visible');
            }, delay);

            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.1 }
    );

    elements.forEach((el) => observer.observe(el));
  }

  initScrollReveal();
  document.addEventListener('astro:page-load', initScrollReveal);
</script>
```

## Button Hover States

```css
.btn {
  position: relative;
  overflow: hidden;
  transition: transform 0.2s ease-out, box-shadow 0.2s ease-out;
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Ripple effect */
.btn-ripple::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 60%);
  transform: scale(0);
  opacity: 0;
}

.btn-ripple:active::after {
  transform: scale(2);
  opacity: 1;
  transition: transform 0.3s, opacity 0.3s;
}

@media (prefers-reduced-motion: reduce) {
  .btn {
    transition: none;
  }
  .btn:hover {
    transform: none;
  }
}
```

## Loading Skeleton

```astro
---
interface Props {
  class?: string;
  height?: string;
  width?: string;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
}

const { class: className, height = '1rem', width = '100%', rounded = 'md' } = Astro.props;
---

<div
  class:list={['skeleton', className]}
  style={`height: ${height}; width: ${width};`}
  class:list={[
    'skeleton',
    `rounded-${rounded}`,
    className
  ]}
  aria-hidden="true"
/>

<style>
  .skeleton {
    background: linear-gradient(
      90deg,
      #f0f0f0 25%,
      #e8e8e8 50%,
      #f0f0f0 75%
    );
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }

  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  @media (prefers-reduced-motion: reduce) {
    .skeleton {
      animation: none;
      background: #f0f0f0;
    }
  }
</style>
```

## Page Transitions (View Transitions API)

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

## Stagger Animation

```astro
---
interface Props {
  items: any[];
  delay?: number;
}

const { items, delay = 100 } = Astro.props;
---

<div class="stagger-container">
  {items.map((item, index) => (
    <div
      class="stagger-item"
      style={`--delay: ${index * delay}ms`}
    >
      <slot item={item} />
    </div>
  ))}
</div>

<style>
  .stagger-item {
    opacity: 0;
    animation: staggerIn 0.4s ease-out forwards;
    animation-delay: var(--delay);
  }

  @keyframes staggerIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .stagger-item {
      opacity: 1;
      animation: none;
      transform: none;
    }
  }
</style>
```

## Form Field Focus Animation

```css
.input-animated {
  border: 2px solid #e5e7eb;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.input-animated:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb), 0.1);
  outline: none;
}

/* Floating label */
.floating-label-group {
  position: relative;
}

.floating-label-group input {
  padding-top: 1.5rem;
}

.floating-label-group label {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  transition: all 0.2s ease-out;
  pointer-events: none;
  color: #9ca3af;
}

.floating-label-group input:focus + label,
.floating-label-group input:not(:placeholder-shown) + label {
  top: 0.75rem;
  transform: translateY(0);
  font-size: 0.75rem;
  color: var(--color-primary);
}
```

## Success/Error State Animations

```css
.success-shake {
  animation: successPop 0.3s ease-out;
}

.error-shake {
  animation: errorShake 0.3s ease-out;
}

@keyframes successPop {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

@keyframes errorShake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

@media (prefers-reduced-motion: reduce) {
  .success-shake,
  .error-shake {
    animation: none;
  }
}
```

## Forbidden

- ❌ Animations without `prefers-reduced-motion` handling
- ❌ Animations over 500ms for UI feedback
- ❌ Animations that block interaction
- ❌ Gratuitous/decorative-only animations
- ❌ JS animations when CSS works
- ❌ Animations that cause layout shift

## Definition of Done

- [ ] All animations respect reduced motion
- [ ] Interaction animations under 300ms
- [ ] Reveal animations under 500ms
- [ ] No layout shift from animations
- [ ] Loading states have skeleton/spinner
- [ ] Page transitions smooth
- [ ] Focus states animated
