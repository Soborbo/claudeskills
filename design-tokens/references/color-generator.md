# Color Shade Generator

## Algorithm

Generate consistent color scales from a single brand color.

### HSL-Based Generation

```typescript
// lib/color-generator.ts
interface ColorScale {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;
}

function hexToHSL(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export function generateColorScale(hex: string): ColorScale {
  const { h, s } = hexToHSL(hex);
  
  // Lightness values for each step
  const lightness = {
    50: 97,
    100: 94,
    200: 86,
    300: 74,
    400: 60,
    500: 48,
    600: 40,
    700: 32,
    800: 26,
    900: 20,
    950: 12,
  };
  
  // Adjust saturation for extremes
  const saturationAdjust = {
    50: s * 0.3,
    100: s * 0.4,
    200: s * 0.5,
    300: s * 0.7,
    400: s * 0.85,
    500: s,
    600: s,
    700: s * 0.95,
    800: s * 0.9,
    900: s * 0.85,
    950: s * 0.8,
  };
  
  const scale: Record<string, string> = {};
  for (const [key, l] of Object.entries(lightness)) {
    const adjustedS = saturationAdjust[key as unknown as keyof typeof saturationAdjust];
    scale[key] = hslToHex(h, adjustedS, l);
  }
  
  return scale as ColorScale;
}
```

## Quick Generation (Online Tools)

If you need quick generation without code:

1. **Tailwind CSS Color Generator**: https://uicolors.app/create
2. **Coolors Palette Generator**: https://coolors.co/
3. **Realtime Colors**: https://www.realtimecolors.com/

## Pre-made Palettes by Industry

### Professional Services (Law, Finance, Consulting)
```css
--color-primary: #1e3a5f;  /* Deep navy */
--color-accent: #c9a227;   /* Gold */
```

### Healthcare / Wellness
```css
--color-primary: #0d9488;  /* Teal */
--color-accent: #22c55e;   /* Green */
```

### Home Services (Removals, Cleaning, Trades)
```css
--color-primary: #1C202F;  /* Dark slate */
--color-accent: #FF6B35;   /* Orange */
```

### Tech / Modern
```css
--color-primary: #0f172a;  /* Slate 900 */
--color-accent: #3b82f6;   /* Blue */
```

### Luxury / Premium
```css
--color-primary: #18181b;  /* Near black */
--color-accent: #a78bfa;   /* Purple */
```

## Accessibility Check

All color combinations must pass WCAG AA:

| Combination | Min Contrast |
|-------------|--------------|
| Body text on bg | 4.5:1 |
| Large text on bg | 3:1 |
| UI components | 3:1 |

**Test at:** https://webaim.org/resources/contrastchecker/

## Accent Color Selection

| Primary Hue | Complementary Accent |
|-------------|---------------------|
| Blue (200-240°) | Orange (20-40°) |
| Green (120-160°) | Red/Pink (340-360°) |
| Purple (260-300°) | Yellow (50-70°) |
| Neutral | Any saturated color |

## Output Format

Generate this for each project:

```css
/* Generated color tokens for [Project Name] */
/* Primary: #XXXXXX */
/* Accent: #XXXXXX */

:root {
  --color-primary: #XXXXXX;
  --color-primary-50: #XXXXXX;
  /* ... full scale ... */
  --color-primary-950: #XXXXXX;
  
  --color-accent: #XXXXXX;
  --color-accent-hover: #XXXXXX;
  --color-accent-light: #XXXXXX;
}
```
