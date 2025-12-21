# Microinteractions

Required subtle interactions.

## Buttons

```css
.btn:hover { transform: scale(1.02); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
.btn:active { transform: scale(0.98); }
```

## Links

Animated underline:
```css
a {
  background: linear-gradient(currentColor, currentColor) 0 100% / 0% 1px no-repeat;
  transition: background-size 200ms;
}
a:hover { background-size: 100% 1px; }
```

## Cards

```css
.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
}
```

## Form Focus

```css
input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.1);
}
```

## Loading Skeleton

```css
.skeleton {
  background: linear-gradient(90deg, #E5E7EB 25%, #F3F4F6 50%, #E5E7EB 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
```

## Number Counter

Animate on scroll into view with requestAnimationFrame.

## Before/After Slider

```css
.after { clip-path: inset(0 50% 0 0); }
.slider { position: absolute; left: 50%; cursor: ew-resize; }
```

## Animation Rules

- **Above fold:** NO entrance animations
- **Below fold:** fade-up, slide-in allowed
- **Always respect:** `prefers-reduced-motion`
