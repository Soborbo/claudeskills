# Loading States

Skeleton loaders and loading animations.

## Loading Skeleton Component

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
  class:list={[
    'skeleton',
    `rounded-${rounded}`,
    className
  ]}
  style={`height: ${height}; width: ${width};`}
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

## Usage

```astro
<!-- Loading a card -->
<div class="card">
  <Skeleton height="200px" rounded="lg" />
  <Skeleton height="1.5rem" width="80%" class="mt-4" />
  <Skeleton height="1rem" width="60%" class="mt-2" />
</div>

<!-- Loading text lines -->
<Skeleton height="1rem" width="100%" />
<Skeleton height="1rem" width="90%" class="mt-2" />
<Skeleton height="1rem" width="95%" class="mt-2" />
```

## Custom Skeleton Patterns

```astro
<!-- Avatar skeleton -->
<Skeleton height="48px" width="48px" rounded="full" />

<!-- Button skeleton -->
<Skeleton height="40px" width="120px" rounded="md" />

<!-- Full card -->
<div class="flex gap-4">
  <Skeleton height="80px" width="80px" rounded="lg" />
  <div class="flex-1">
    <Skeleton height="1.25rem" width="70%" />
    <Skeleton height="1rem" width="90%" class="mt-2" />
    <Skeleton height="1rem" width="60%" class="mt-2" />
  </div>
</div>
```
