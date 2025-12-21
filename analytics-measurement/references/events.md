# Event Documentation

## DataLayer Push Helper

```typescript
// src/lib/gtm.ts
export function pushEvent(event: string, params?: Record<string, any>) {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      event,
      ...params,
    });
  }
}

// Pre-defined events
export const gtmEvents = {
  ctaClick: (location: string, text: string) => 
    pushEvent('cta_click', { cta_location: location, cta_text: text }),
  
  phoneClick: (location: string) => 
    pushEvent('phone_click', { click_location: location }),
  
  whatsappClick: (location: string) => 
    pushEvent('whatsapp_click', { click_location: location }),
  
  formStart: (formName: string) => 
    pushEvent('form_start', { form_name: formName }),
  
  formSubmit: (formName: string, formType?: string) => 
    pushEvent('form_submit', { form_name: formName, form_type: formType }),
  
  videoPlay: (title: string) => 
    pushEvent('video_play', { video_title: title }),
  
  videoProgress: (title: string, percent: number) => 
    pushEvent('video_progress', { video_title: title, video_percent: percent }),
  
  calculatorStart: (type: string) => 
    pushEvent('calculator_start', { calculator_type: type }),
  
  calculatorStep: (step: number, name: string) => 
    pushEvent('calculator_step', { step_number: step, step_name: name }),
  
  calculatorComplete: (type: string, value: string) => 
    pushEvent('calculator_complete', { calculator_type: type, result_value: value }),
};
```

## Implementation Examples

### CTA Button

```astro
<button 
  onclick="gtmEvents.ctaClick('hero', 'Get Free Quote')"
  data-gtm="cta-hero"
>
  Get Free Quote
</button>
```

### Phone Link

```astro
<a 
  href="tel:+441onal234567890"
  onclick="gtmEvents.phoneClick('header')"
  data-gtm="phone-header"
>
  Call Us
</a>
```

### WhatsApp Link

```astro
<a 
  href="https://wa.me/441234567890"
  onclick="gtmEvents.whatsappClick('sticky-bar')"
  data-gtm="whatsapp-sticky"
  target="_blank"
  rel="noopener"
>
  WhatsApp
</a>
```

### Form

```astro
<form 
  onfocus="gtmEvents.formStart('contact')"
  onsubmit="gtmEvents.formSubmit('contact', 'lead')"
>
  <!-- form fields -->
</form>
```

### YouTube Facade

```typescript
// On play click
gtmEvents.videoPlay('Company Introduction');

// On progress (25%, 50%, 75%, 100%)
gtmEvents.videoProgress('Company Introduction', 25);
```

### Calculator

```typescript
// On first interaction
gtmEvents.calculatorStart('removal-quote');

// On each step
gtmEvents.calculatorStep(1, 'property-type');
gtmEvents.calculatorStep(2, 'rooms');
gtmEvents.calculatorStep(3, 'date');

// On result
gtmEvents.calculatorComplete('removal-quote', '£450-£650');
```

## Event Parameters Reference

| Parameter | Type | Max Length | Example |
|-----------|------|------------|---------|
| `cta_location` | string | 50 | "hero", "footer", "sticky" |
| `cta_text` | string | 100 | "Get Free Quote" |
| `click_location` | string | 50 | "header", "footer", "mobile-bar" |
| `form_name` | string | 50 | "contact", "quote", "callback" |
| `form_type` | string | 50 | "lead", "booking", "enquiry" |
| `video_title` | string | 100 | "Company Introduction" |
| `video_percent` | number | - | 25, 50, 75, 100 |
| `calculator_type` | string | 50 | "removal-quote", "price-estimate" |
| `step_number` | number | - | 1, 2, 3 |
| `step_name` | string | 50 | "property-type", "rooms" |
| `result_value` | string | 100 | "£450-£650" |
| `scroll_percent` | number | - | 25, 50, 75, 90 |

## Forbidden in Parameters

Never include:
- ❌ Email addresses
- ❌ Phone numbers
- ❌ Full names
- ❌ Addresses
- ❌ Any PII (Personally Identifiable Information)

## Testing Checklist

For each event:
- [ ] Fires once per action (no double-fire)
- [ ] Correct event name
- [ ] All parameters present
- [ ] Parameters have correct values
- [ ] Visible in GTM Preview
- [ ] Visible in GA4 DebugView
