---
name: zero-cost-tracking
description: Zero-cost conversion tracking for Astro.js lead gen sites. GTM + GA4 + Google Ads Enhanced Conversions + Meta CAPI (via Zaraz). First/last touch attribution, Safari ITP bypass, consent-aware. Replaces Stape ($100/mo) with Cloudflare free tier.
---

# Zero-Cost Tracking

Conversion tracking for lead gen sites using Cloudflare free tier.

## When To Use

- Lead gen site with Google Ads + GA4 + Meta tracking
- Calculator, contact form, or callback conversions
- Need Enhanced Conversions for Safari/iOS
- Need first + last touch UTM attribution

## Does NOT Handle

- Cross-domain tracking
- Ecommerce / product tracking
- A/B test tracking
- CRM sync (use crm-integrations skill)

## Core Rules

1. **GTM is authority** — consent.ts is read-only, never override GTM
2. **localStorage safety** — Always try/catch for Safari private mode
3. **Form order** — reportValidity() → preventDefault() → track → redirect
4. **Attribution on conversions only** — calculator events get session_id only
5. **Secrets in dashboards** — Meta token in Zaraz, never in code

## Events

| Event | GAds | Meta | Has Attribution |
|-------|:----:|:----:|:---------------:|
| phone_click | yes | yes | no |
| quote_request | yes | yes | yes |
| callback_request | yes | yes | yes |
| contact_form | yes | yes | yes |
| calculator_start | - | - | no |
| calculator_step | - | - | no |
| form_abandon | - | - | no |

## Quick Start

### 1. Copy files

```bash
cp -r references/tracking/ src/lib/tracking/
cp -r references/components/ src/components/tracking/
```

### 2. Layout

```astro
---
import GTM from '@/components/tracking/GTM.astro';
import TrackingInit from '@/components/tracking/TrackingInit.astro';
---
<html>
  <head><GTM position="head" /></head>
  <body>
    <GTM position="body" />
    <TrackingInit />
    <slot />
  </body>
</html>
```

### 3. Track conversion

```typescript
import { trackConversion } from '@/lib/tracking';

// In form submit handler (after reportValidity, preventDefault)
trackConversion('quote_request', {
  email,
  phone,
  value: calculatedQuote,
});
```

### 4. Phone link

```astro
import PhoneLink from '@/components/tracking/PhoneLink.astro';

<PhoneLink phone="+447123456789" value={quote}>Call us</PhoneLink>
```

### 5. Calculator events

```typescript
import { pushCalculatorStart, pushCalculatorStep, pushCalculatorOption } from '@/lib/tracking';

pushCalculatorStart();
pushCalculatorStep(2);
pushCalculatorOption('bedrooms', '3');
```

## Env Variables

```bash
GTM_ID=GTM-XXXXXXX
PUBLIC_SITE_CURRENCY=GBP  # optional
```

## Key Behaviors

- **Session**: localStorage + 30min timeout, same across tabs
- **Phone dedupe**: Once per session, page reload allows new fire
- **Sheets backup**: Use crm-integrations skill for webhook + retry

## References

| Topic | File |
|-------|------|
| TypeScript modules | [references/tracking/](references/tracking/) |
| Astro components | [references/components/](references/components/) |
| GTM setup (variables, triggers, tags) | [references/gtm/SETUP.md](references/gtm/SETUP.md) |
| Cloudflare/Zaraz setup | [references/cloudflare/SETUP.md](references/cloudflare/SETUP.md) |
| DataLayer contract | [references/DATALAYER.md](references/DATALAYER.md) |

## Related Skills

- **crm-integrations** — Sheets webhook with retry queue
- **astro-forms** — Form validation patterns

## Forbidden

- Meta Access Token in code
- Blocking form on tracking failure
- Attribution on non-conversion events
- Overriding GTM consent from JS
