# Stagger Animations

Sequential reveal animations for lists and groups.

## Stagger Component

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

## Usage

```astro
---
const features = [
  { title: 'Feature 1', desc: 'Description' },
  { title: 'Feature 2', desc: 'Description' },
  { title: 'Feature 3', desc: 'Description' },
];
---

<Stagger items={features} delay={150}>
  <div slot="item" let:item>
    <h3>{item.title}</h3>
    <p>{item.desc}</p>
  </div>
</Stagger>
```

## CSS-Only Stagger

```css
.stagger-list > * {
  opacity: 0;
  animation: staggerIn 0.4s ease-out forwards;
}

.stagger-list > *:nth-child(1) { animation-delay: 0ms; }
.stagger-list > *:nth-child(2) { animation-delay: 100ms; }
.stagger-list > *:nth-child(3) { animation-delay: 200ms; }
.stagger-list > *:nth-child(4) { animation-delay: 300ms; }
.stagger-list > *:nth-child(5) { animation-delay: 400ms; }

@media (prefers-reduced-motion: reduce) {
  .stagger-list > * {
    opacity: 1;
    animation: none;
  }
}
```
