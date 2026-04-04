# Desktop Header & CTA Patterns

## Header Behavior (Scroll-Based)

### States

1. **Initial (top of page):** Full header with logo, nav, contact, CTA
2. **Scrolling down past fold:** Header hides (slides up)
3. **Scrolling UP:** Compact sticky header appears

### Compact Sticky Header

Shows on scroll-up after passing fold:

```
[Logo] [Address] [Phone] [CTA Button]
```

```css
.header-compact {
  position: fixed;
  top: 0;
  transform: translateY(-100%);
  transition: transform 300ms ease;
}

.header-compact.visible {
  transform: translateY(0);
}
```

```javascript
let lastScroll = 0;
const fold = document.querySelector('.usp-strip').offsetTop;

window.addEventListener('scroll', () => {
  const current = window.scrollY;
  
  if (current > fold && current < lastScroll) {
    // Scrolling UP past fold → show compact header
    header.classList.add('visible');
  } else {
    header.classList.remove('visible');
  }
  
  lastScroll = current;
});
```

---

## WhatsApp Floating Button

Position: Bottom-right corner (NOT in header).

```css
.whatsapp-float {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #25D366;
  z-index: 40;
  opacity: 0;
  animation: fadeInPulse 600ms ease forwards;
  animation-delay: 6s;
}

@keyframes fadeInPulse {
  0% { opacity: 0; transform: scale(0.8); }
  50% { transform: scale(1.1); }
  100% { opacity: 1; transform: scale(1); }
}
```

Hide on mobile (bottom bar has WhatsApp):

```css
@media (max-width: 1024px) {
  .whatsapp-float { display: none; }
}
```

---

## Long Page Side TOC

For pages with 10+ sections.

```css
.page-toc {
  position: fixed;
  left: 20px;
  top: 50%;
  transform: translateY(-50%);
  opacity: 0.4;
  transition: opacity 200ms;
}

.page-toc:hover {
  opacity: 1;
}

.page-toc a {
  display: block;
  padding: 8px 12px;
  font-size: 12px;
  border-left: 2px solid transparent;
}

.page-toc a.active {
  color: var(--primary);
  border-left-color: var(--primary);
}
```

Use Intersection Observer to highlight current section.
