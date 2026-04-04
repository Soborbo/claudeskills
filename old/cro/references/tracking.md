# Scroll Depth & Element Visibility Tracking

## Scroll Depth Tracking

```typescript
// src/lib/cro/scroll-tracking.ts
export function trackScrollDepth(): void {
  const thresholds = [25, 50, 75, 90, 100];
  const tracked = new Set<number>();

  function getScrollPercent(): number {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    return Math.round((scrollTop / docHeight) * 100);
  }

  function checkThresholds(): void {
    const percent = getScrollPercent();

    thresholds.forEach((threshold) => {
      if (percent >= threshold && !tracked.has(threshold)) {
        tracked.add(threshold);

        if (window.dataLayer) {
          window.dataLayer.push({
            event: 'scroll_depth',
            scroll_percent: threshold,
            page_path: window.location.pathname
          });
        }
      }
    });
  }

  // Throttled scroll handler
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        checkThresholds();
        ticking = false;
      });
      ticking = true;
    }
  });
}
```

## Element Visibility Tracking

```typescript
// src/lib/cro/visibility-tracking.ts
export function trackElementVisibility(
  selector: string,
  eventName: string,
  threshold = 0.5
): void {
  const elements = document.querySelectorAll(selector);
  const tracked = new WeakSet<Element>();

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !tracked.has(entry.target)) {
          tracked.add(entry.target);

          if (window.dataLayer) {
            window.dataLayer.push({
              event: eventName,
              element_id: entry.target.id,
              element_class: entry.target.className
            });
          }

          observer.unobserve(entry.target);
        }
      });
    },
    { threshold }
  );

  elements.forEach((el) => observer.observe(el));
}

// Usage examples
trackElementVisibility('.pricing-section', 'pricing_viewed');
trackElementVisibility('.testimonials', 'testimonials_viewed');
trackElementVisibility('.cta-banner', 'cta_viewed');
```
