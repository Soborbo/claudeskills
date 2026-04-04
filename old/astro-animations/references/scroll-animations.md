# Scroll Animations

Intersection Observer-based scroll reveal animations.

## ScrollReveal Component

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

## Usage

```astro
<ScrollReveal animation="fade-up" delay={100}>
  <h2>This fades up when scrolled into view</h2>
</ScrollReveal>

<ScrollReveal animation="slide-in" threshold={0.2}>
  <p>This slides in at 20% visibility</p>
</ScrollReveal>
```
