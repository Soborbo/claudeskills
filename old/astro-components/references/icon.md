# Icon Component

```astro
---
// src/components/ui/Icon.astro
interface Props {
  name: string;
  size?: number;
  class?: string;
}

const { name, size = 24, class: className } = Astro.props;

const icons: Record<string, string> = {
  // Navigation
  'chevron-right': 'm9 18 6-6-6-6',
  'chevron-down': 'm6 9 6 6 6-6',
  'chevron-left': 'm15 18-6-6 6-6',
  'chevron-up': 'm18 15-6-6-6 6',
  'arrow-right': 'M5 12h14m-7-7 7 7-7 7',
  'menu': 'M4 6h16M4 12h16M4 18h16',
  'x': 'M18 6 6 18M6 6l12 12',
  
  // Actions
  'check': 'M20 6 9 17l-5-5',
  'plus': 'M12 5v14m-7-7h14',
  'minus': 'M5 12h14',
  'search': 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
  
  // Communication
  'phone': 'M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z',
  'mail': 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zm16 2l-8 5-8-5',
  'message-circle': 'M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z',
  
  // Location
  'map-pin': 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z M12 13a3 3 0 100-6 3 3 0 000 6z',
  'navigation': 'M3 11l19-9-9 19-2-8-8-2z',
  
  // Time
  'clock': 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M12 6v6l4 2',
  'calendar': 'M19 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2z M16 2v4M8 2v4M3 10h18',
  
  // Feedback
  'star': 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  'star-filled': 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  'thumbs-up': 'M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3',
  
  // Status
  'alert-circle': 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M12 8v4m0 4h.01',
  'check-circle': 'M22 11.08V12a10 10 0 11-5.93-9.14 M22 4L12 14.01l-3-3',
  'info': 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M12 16v-4m0-4h.01',
  
  // Social
  'facebook': 'M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z',
  'instagram': 'M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zm1.5-4.87h.01 M6.5 2h11A4.5 4.5 0 0122 6.5v11a4.5 4.5 0 01-4.5 4.5h-11A4.5 4.5 0 012 17.5v-11A4.5 4.5 0 016.5 2z',
  'linkedin': 'M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z M2 9h4v12H2z M4 2a2 2 0 100 4 2 2 0 000-4z',
  
  // Misc
  'shield-check': 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z M9 12l2 2 4-4',
  'truck': 'M1 3h15v13H1zM16 8h4l3 3v5h-7V8z M5.5 21a2.5 2.5 0 100-5 2.5 2.5 0 000 5zm11 0a2.5 2.5 0 100-5 2.5 2.5 0 000 5z',
  'home': 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10',
  'users': 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M23 21v-2a4 4 0 00-3-3.87m-4-12a4 4 0 010 7.75 M9 7a4 4 0 100 8 4 4 0 000-8z',
};

const path = icons[name];

// CRITICAL: No silent failures
if (!path) {
  console.warn(`[Icon] Unknown icon name: "${name}"`);
}
---

{path ? (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class:list={['shrink-0', className]}
    aria-hidden="true"
  >
    <path d={path} />
  </svg>
) : null}
```

## Usage

```astro
<Icon name="phone" />
<Icon name="check" size={16} />
<Icon name="star" class="text-amber-500" />
```

## Available Icons

| Category | Icons |
|----------|-------|
| Navigation | chevron-right, chevron-down, chevron-left, chevron-up, arrow-right, menu, x |
| Actions | check, plus, minus, search |
| Communication | phone, mail, message-circle |
| Location | map-pin, navigation |
| Time | clock, calendar |
| Feedback | star, star-filled, thumbs-up |
| Status | alert-circle, check-circle, info |
| Social | facebook, instagram, linkedin |
| Misc | shield-check, truck, home, users |

## Adding New Icons

1. Get SVG path from [Lucide](https://lucide.dev/)
2. Add to `icons` object in component
3. Use `name` prop to render

**Do NOT inline SVG elsewhere.** Always use this component.
