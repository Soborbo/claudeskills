# CTA Schema

Standardised CTA structure for forms and conversion elements.

## CTA Types

| Type | Use Case | Priority |
|------|----------|----------|
| `primary` | Main form submit | Highest |
| `secondary` | Alternative action (anchor link, details) | Medium |
| `phone` | Click-to-call | High |
| `sticky` | Mobile fixed CTA | High |

## CTA Text Rules

### Primary (action-oriented)

| Good | Bad |
|------|-----|
| Get a free quote | Submit |
| Request a callback | Send |
| Book a consultation | OK |
| Kérjen árajánlatot | Küldés |

### Secondary (informative)

| Good | Bad |
|------|-----|
| View our services | Click here |
| See pricing | More info |
| Learn more | Link |

**Never use "Submit", "Click here", or generic labels.**

## Placement Rules

| Location | CTA Types | Max |
|----------|-----------|-----|
| Hero | primary + secondary | 2 |
| Section end | primary | 1 |
| Form | primary (submit) | 1 |
| Footer | phone + primary | 2 |
| Sticky (mobile) | primary | 1 |

## Sticky Mobile CTA

Appears on mobile only, after user scrolls past the hero. Fixed to bottom of viewport.

```yaml
sticky_cta:
  mobile_only: true
  show_after_scroll: 200px
  action: scroll_to_form | phone_call
  disappear: when_form_in_viewport
```

The sticky CTA should disappear when the form section is already visible to avoid redundancy.

## GTM Event Schema

All CTAs push events to `dataLayer`:

```typescript
interface CTAEvent {
  event: 'cta_click' | 'form_submit' | 'click_to_call';
  cta_type: 'primary' | 'secondary' | 'phone' | 'sticky';
  cta_text: string;
  page_location: string;
  section?: string;
}
```

### Click-to-Call Tracking

Every `tel:` link must push a `click_to_call` event:

```typescript
document.querySelectorAll('a[href^="tel:"]').forEach(link => {
  link.addEventListener('click', () => {
    dataLayer.push({
      event: 'click_to_call',
      phone_number: link.getAttribute('href')?.replace('tel:', ''),
      page_location: window.location.pathname,
    });
  });
});
```

## Accessibility

| Requirement | Implementation |
|-------------|---------------|
| Visible focus | `focus-visible:ring-2` |
| Touch target | min 44×44px |
| Contrast | 4.5:1 text on background |
| Descriptive text | No "Click here" |
| `aria-label` | If button text alone is ambiguous |

## Checklist

- [ ] Primary CTA has action-oriented text
- [ ] Phone CTA uses `tel:` link
- [ ] Sticky mobile CTA configured
- [ ] GTM tracking on all CTAs
- [ ] Click-to-call tracking on all `tel:` links
- [ ] Accessibility requirements met
- [ ] Max CTA count per section respected
