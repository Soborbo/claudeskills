# Mobile Patterns

## Sticky Bottom Bar

**2 buttons only:** WhatsApp + Quote

```css
.mobile-cta-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 56px;
  padding-bottom: env(safe-area-inset-bottom);
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  padding: 8px 16px;
  background: white;
  box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
  z-index: 50;
}

.mobile-cta-bar a {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 8px;
  font-weight: 600;
}

.mobile-cta-bar .whatsapp {
  background: #25D366;
  color: white;
}

.mobile-cta-bar .quote {
  background: var(--primary);
  color: white;
}
```

---

## Mobile Menu Animation

Spectacular entrance with staggered items:

```css
/* Backdrop */
.menu-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0);
  transition: background 400ms ease;
  pointer-events: none;
}

.menu-backdrop.open {
  background: rgba(0,0,0,0.5);
  pointer-events: auto;
}

/* Panel */
.mobile-menu {
  position: fixed;
  top: 0;
  right: 0;
  width: 85%;
  max-width: 360px;
  height: 100vh;
  background: white;
  transform: translateX(100%);
  transition: transform 400ms cubic-bezier(0.16, 1, 0.3, 1);
}

.mobile-menu.open {
  transform: translateX(0);
}

/* Staggered menu items */
.mobile-menu a {
  opacity: 0;
  transform: translateX(20px);
  transition: all 300ms ease;
}

.mobile-menu.open a {
  opacity: 1;
  transform: translateX(0);
}

.mobile-menu.open a:nth-child(1) { transition-delay: 100ms; }
.mobile-menu.open a:nth-child(2) { transition-delay: 150ms; }
.mobile-menu.open a:nth-child(3) { transition-delay: 200ms; }
.mobile-menu.open a:nth-child(4) { transition-delay: 250ms; }
.mobile-menu.open a:nth-child(5) { transition-delay: 300ms; }
```

Requirements:
- Focus trap when open
- Close on escape key
- Close on backdrop tap
- Body scroll lock

---

## Swipeable Cards

Second card ~20% visible to hint scroll:

```css
.swipe-cards {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  padding: 16px;
  scrollbar-width: none;
}

.swipe-card {
  flex: 0 0 calc(100% - 48px);
  scroll-snap-align: start;
}
```

---

## Scrollable Tables

```css
.table-wrapper {
  overflow-x: auto;
  position: relative;
}

.table-wrapper::after {
  content: '';
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 40px;
  background: linear-gradient(to right, transparent, white);
  pointer-events: none;
}
```

---

## Lightweight Gallery

CSS scroll-snap, no libraries:

```css
.gallery {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
}

.gallery-item {
  flex: 0 0 100%;
  scroll-snap-align: center;
}
```

Fullscreen: use native `<dialog>`.

---

## Touch Targets

- Minimum: 44x44px
- Spacing: 8px between
- Input font: 16px min (prevents iOS zoom)
