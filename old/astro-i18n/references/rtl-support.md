# RTL (Right-to-Left) Support

For Arabic, Hebrew, and other RTL languages.

## Language Config

```typescript
export const languages = {
  en: { name: 'English', code: 'en-GB', dir: 'ltr' },
  ar: { name: 'العربية', code: 'ar-SA', dir: 'rtl' },
  he: { name: 'עברית', code: 'he-IL', dir: 'rtl' },
} as const;
```

## Global RTL Styles

```css
/* Global RTL styles */
[dir='rtl'] {
  text-align: right;
}

[dir='rtl'] .flex-row {
  flex-direction: row-reverse;
}

[dir='rtl'] .ml-4 {
  margin-left: 0;
  margin-right: 1rem;
}

[dir='rtl'] .mr-4 {
  margin-right: 0;
  margin-left: 1rem;
}

/* Flip icons */
[dir='rtl'] .icon-arrow {
  transform: scaleX(-1);
}
```

## Logical Properties (Recommended)

Use CSS logical properties instead of left/right:

```css
/* Instead of margin-left/right */
.element {
  margin-inline-start: 1rem; /* left in LTR, right in RTL */
  margin-inline-end: 1rem;   /* right in LTR, left in RTL */
}

/* Instead of padding-left/right */
.element {
  padding-inline-start: 2rem;
  padding-inline-end: 2rem;
}

/* Instead of text-align: left/right */
.element {
  text-align: start; /* left in LTR, right in RTL */
}

/* Instead of border-left/right */
.element {
  border-inline-start: 1px solid #ccc;
}
```

## Layout with dir Attribute

```astro
---
const lang = getLangFromUrl(Astro.url);
const langConfig = languages[lang];
---

<html lang={langConfig.code} dir={langConfig.dir}>
  <!-- Content automatically flows RTL when dir="rtl" -->
</html>
```

## Testing RTL Layouts

1. Add RTL language to config
2. Test with real content (Arabic/Hebrew fonts)
3. Check navigation, forms, icons
4. Verify all margins/padding flip correctly
5. Test language switcher positioning
