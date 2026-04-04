# Browser Compatibility Testing

## Required Test Matrix

### Desktop Browsers

| Browser | Versions | Priority |
|---------|----------|----------|
| Chrome | Latest, Latest-1 | Critical |
| Firefox | Latest, Latest-1 | Critical |
| Safari | Latest (macOS) | Critical |
| Edge | Latest | High |
| Opera | Latest | Medium |

### Mobile Browsers

| Platform | Browser | Devices |
|----------|---------|---------|
| iOS | Safari | iPhone SE, 14, 15 Pro Max |
| iOS | Chrome | iPhone 14 |
| Android | Chrome | Pixel, Samsung Galaxy |
| Android | Samsung Internet | Samsung Galaxy |
| Android | Firefox | Any Android |

### Viewport Breakpoints

```
Desktop:  1920px, 1440px, 1280px, 1024px
Tablet:   768px (portrait), 1024px (landscape)
Mobile:   320px, 375px, 390px, 414px
```

## Per-Browser Test Checklist

Run on EACH browser:

### Visual Tests
- [ ] Layout renders correctly
- [ ] No horizontal scrollbar (unless intended)
- [ ] Images load and display
- [ ] Fonts render (fallback if needed)
- [ ] Colors match design
- [ ] Icons display (SVG/icon fonts)
- [ ] No overlapping elements
- [ ] Sticky header/footer position correct

### Interactive Tests
- [ ] All links work
- [ ] Buttons clickable
- [ ] Forms functional
- [ ] Mobile menu opens/closes
- [ ] Dropdowns work
- [ ] Modals open/close
- [ ] Accordions expand/collapse
- [ ] Carousels/sliders swipe
- [ ] Back to top works

### Animation Tests
- [ ] Hover states trigger
- [ ] Scroll animations fire
- [ ] Transitions smooth (or graceful fallback)
- [ ] No janky animations
- [ ] prefers-reduced-motion respected

### Performance Tests
- [ ] Page loads in < 3s
- [ ] No layout shift visible
- [ ] Images lazy load
- [ ] No console errors
- [ ] No network errors

## Known Browser Issues

### Safari
```css
/* Flexbox gap fallback */
@supports not (gap: 1rem) {
  .flex-container > * + * {
    margin-left: 1rem;
  }
}

/* 100vh issue on iOS */
height: 100vh;
height: 100dvh; /* Dynamic viewport height */

/* Smooth scroll */
scroll-behavior: smooth; /* May not work */
```

### Firefox
```css
/* Scrollbar styling limited */
scrollbar-width: thin;
scrollbar-color: #888 #f1f1f1;

/* Number input spinners */
input[type="number"] {
  -moz-appearance: textfield;
}
```

### Edge (Legacy)
- Not supported (Chromium Edge only)
- If legacy needed, add to excluded browsers

### Opera
- Generally follows Chrome
- Test GX mode if gaming audience

## Mobile-Specific Tests

### iOS Safari
- [ ] Viewport meta correct
- [ ] No zoom on input focus (font-size ≥ 16px)
- [ ] Safe area insets respected
- [ ] Rubber band scroll OK
- [ ] Form inputs not obscured by keyboard
- [ ] Date inputs use native picker

### Android Chrome
- [ ] Touch targets 44px+
- [ ] No 300ms tap delay
- [ ] PWA installable (if applicable)
- [ ] Share API works (if used)

### Common Mobile Issues
```css
/* Prevent zoom on input */
input, select, textarea {
  font-size: 16px;
}

/* Safe areas */
padding-bottom: env(safe-area-inset-bottom);

/* Touch action */
touch-action: manipulation; /* Removes 300ms delay */

/* Prevent pull-to-refresh interference */
overscroll-behavior: contain;
```

## Testing Tools

### Browser DevTools
- Chrome: Device Mode (Ctrl+Shift+M)
- Firefox: Responsive Design Mode (Ctrl+Shift+M)
- Safari: Responsive Design Mode (Develop menu)

### Real Device Testing
- BrowserStack (recommended)
- LambdaTest
- Physical devices (best)

### Automated
```bash
# Playwright cross-browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

## Bug Reporting Format

```markdown
## Browser Bug Report

**Browser:** Chrome 120 on macOS
**Viewport:** 375px (iPhone 12)
**URL:** /contact
**Issue:** Submit button overlaps footer on small screens
**Expected:** Button above footer with spacing
**Screenshot:** [attached]
**Reproducible:** Yes, 100%
```

## Definition of Done

- [ ] Chrome desktop ✓
- [ ] Chrome mobile ✓
- [ ] Firefox desktop ✓
- [ ] Safari desktop ✓
- [ ] Safari iOS ✓
- [ ] Edge desktop ✓
- [ ] Samsung Internet ✓
- [ ] No critical bugs
- [ ] No console errors
- [ ] All forms work
