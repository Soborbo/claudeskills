# CTA Schema

## Overview

Standardized CTA structure for forms and conversion elements.

---

## CTA Types

| Type | Use Case | Priority |
|------|----------|----------|
| `primary` | Main form submit | Highest |
| `secondary` | Alternative action | Medium |
| `phone` | Click-to-call | High |
| `sticky` | Mobile fixed CTA | High |

---

## CTA Schema Definition

```typescript
interface CTASchema {
  type: 'primary' | 'secondary' | 'phone' | 'sticky';
  text: string;
  action: 'submit' | 'link' | 'phone' | 'scroll';
  href?: string;
  phone?: string;
  icon?: string;
  tracking: {
    event: string;
    category: string;
    label: string;
  };
}
```

---

## Primary CTA (Form Submit)

```yaml
cta:
  type: primary
  text: "Ajánlatot kérek"
  action: submit
  tracking:
    event: form_submit
    category: conversion
    label: contact_form
```

```astro
<button 
  type="submit" 
  class="btn btn-primary"
  data-track="form_submit"
>
  Ajánlatot kérek
</button>
```

### Styling

```css
.btn-primary {
  @apply bg-accent hover:bg-accent-hover text-white 
         px-6 py-3 rounded-button font-semibold
         shadow-button hover:shadow-button-hover
         transition-all duration-200;
}
```

---

## Secondary CTA

```yaml
cta:
  type: secondary
  text: "Részletek"
  action: link
  href: "#services"
  tracking:
    event: cta_click
    category: engagement
    label: view_services
```

```astro
<a 
  href="#services" 
  class="btn btn-secondary"
  data-track="cta_click"
>
  Részletek
</a>
```

### Styling

```css
.btn-secondary {
  @apply bg-transparent border-2 border-primary-900 text-primary-900
         hover:bg-primary-900 hover:text-white
         px-6 py-3 rounded-button font-semibold
         transition-all duration-200;
}
```

---

## Phone CTA

```yaml
cta:
  type: phone
  text: "Hívjon most"
  action: phone
  phone: "+36301234567"
  icon: "phone"
  tracking:
    event: click_to_call
    category: conversion
    label: header_phone
```

```astro
<a 
  href="tel:+36301234567" 
  class="btn btn-phone"
  data-track="click_to_call"
>
  <svg><!-- phone icon --></svg>
  <span>Hívjon most</span>
</a>
```

### Click-to-Call Tracking

```typescript
document.querySelectorAll('a[href^="tel:"]').forEach(link => {
  link.addEventListener('click', () => {
    dataLayer.push({
      event: 'click_to_call',
      phone_number: link.href.replace('tel:', ''),
      page_location: window.location.pathname,
    });
  });
});
```

---

## Sticky Mobile CTA

```yaml
cta:
  type: sticky
  text: "Ajánlatot kérek"
  action: scroll
  href: "#form"
  visibility:
    mobile: true
    desktop: false
    after_scroll: 200
  tracking:
    event: sticky_cta_click
    category: conversion
    label: mobile_sticky
```

```astro
<div class="sticky-cta md:hidden" data-show-after="200">
  <a href="#form" class="btn btn-primary w-full">
    Ajánlatot kérek
  </a>
</div>

<style>
  .sticky-cta {
    @apply fixed bottom-0 left-0 right-0 p-4 bg-white shadow-lg
           transform translate-y-full transition-transform;
  }
  .sticky-cta.visible {
    @apply translate-y-0;
  }
</style>

<script>
  const stickyCTA = document.querySelector('.sticky-cta');
  const showAfter = parseInt(stickyCTA.dataset.showAfter);
  
  window.addEventListener('scroll', () => {
    if (window.scrollY > showAfter) {
      stickyCTA.classList.add('visible');
    } else {
      stickyCTA.classList.remove('visible');
    }
  });
</script>
```

---

## CTA Text Guidelines

### Primary (Action-oriented)

| ✅ Good | ❌ Bad |
|---------|--------|
| Ajánlatot kérek | Küldés |
| Ingyenes konzultáció | Submit |
| Hívjon vissza | Tovább |
| Kérjen árajánlatot | OK |

### Secondary (Informative)

| ✅ Good | ❌ Bad |
|---------|--------|
| Szolgáltatások | Kattintson ide |
| Tudjon meg többet | Információ |
| Áraink | Link |

---

## CTA Placement Rules

| Location | CTA Types | Max |
|----------|-----------|-----|
| Hero | primary + secondary | 2 |
| Section end | primary | 1 |
| Form | primary (submit) | 1 |
| Footer | phone + primary | 2 |
| Sticky (mobile) | primary | 1 |

---

## GTM Event Schema

```typescript
interface CTAEvent {
  event: 'cta_click' | 'form_submit' | 'click_to_call';
  cta_type: 'primary' | 'secondary' | 'phone' | 'sticky';
  cta_text: string;
  page_location: string;
  section?: string;
}
```

```typescript
// Push event
dataLayer.push({
  event: 'cta_click',
  cta_type: 'primary',
  cta_text: 'Ajánlatot kérek',
  page_location: '/services',
  section: 'hero',
});
```

---

## Accessibility Requirements

| Requirement | Implementation |
|-------------|----------------|
| Visible focus | `focus-visible:ring-2` |
| Touch target | min 44×44px |
| Contrast | 4.5:1 text on bg |
| Descriptive text | No "Click here" |

```astro
<button 
  type="submit"
  class="btn btn-primary min-h-[44px] focus-visible:ring-2 focus-visible:ring-accent"
  aria-label="Küldés és ajánlatkérés"
>
  Ajánlatot kérek
</button>
```

---

## Checklist

- [ ] Primary CTA defined for each form
- [ ] Phone CTA with tel: link
- [ ] Sticky mobile CTA configured
- [ ] GTM tracking on all CTAs
- [ ] Accessibility requirements met
- [ ] CTA text is action-oriented
- [ ] Max CTA count per section respected
