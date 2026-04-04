# INP Optimization

## Minimize Main Thread Work

```typescript
// Break up long tasks
function processLargeList(items: Item[]) {
  const chunk = 50;
  let index = 0;

  function processChunk() {
    const end = Math.min(index + chunk, items.length);
    for (; index < end; index++) {
      processItem(items[index]);
    }
    if (index < items.length) {
      requestIdleCallback(processChunk);
    }
  }

  requestIdleCallback(processChunk);
}
```

## Debounce Input Handlers

```typescript
function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

// Usage
input.addEventListener('input', debounce(handleSearch, 300));
```

## Use `content-visibility`

```css
/* Skip rendering off-screen sections */
.below-fold-section {
  content-visibility: auto;
  contain-intrinsic-size: 0 500px; /* Estimated height */
}
```
