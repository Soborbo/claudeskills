# DataLayer Contract

Event structures pushed to GTM dataLayer.

## Common Fields (all events)

```typescript
{
  event: string;              // Event name
  tracking_version: 'v2.0';   // Version for debugging
  session_id: string;         // e.g., 'sess_abc123'
  page_url: string;           // Current page path
  device: 'mobile' | 'tablet' | 'desktop';
}
```

## Phone Click

Minimal event, no attribution data.

```typescript
dataLayer.push({
  event: 'phone_click',
  tracking_version: 'v2.0',
  session_id: 'sess_abc123',
  page_url: '/calculator',
  device: 'mobile',
  value: 450,      // optional, 0 if not from calculator
  currency: 'GBP', // optional, defaults to PUBLIC_SITE_CURRENCY
});
```

## Form Submissions (Conversions)

Full attribution data included.

```typescript
dataLayer.push({
  event: 'quote_request', // or 'callback_request', 'contact_form'
  tracking_version: 'v2.0',
  session_id: 'sess_abc123',
  page_url: '/calculator',
  device: 'mobile',

  // Lead identification
  lead_id: 'LD-2025-01-15-abc',
  user_email: 'test@example.com', // For Enhanced Conversions
  user_phone: '+447123456789',    // For Enhanced Conversions

  // Value (optional)
  value: 450,
  currency: 'GBP',

  // First touch attribution
  first_utm_source: 'google',
  first_utm_medium: 'cpc',
  first_utm_campaign: 'removal-bristol',
  first_utm_term: 'house removal',
  first_utm_content: 'hero-cta',
  first_gclid: 'CjwKCAiA...',
  first_fbclid: 'fb.1.1234...',
  first_referrer: 'google.com',

  // Last touch attribution (if different)
  last_utm_source: 'google',
  last_utm_medium: 'cpc',
  last_utm_campaign: 'removal-bristol',
  last_utm_term: 'house removal',
  last_utm_content: 'hero-cta',
  last_gclid: 'CjwKCAiA...',
  last_fbclid: 'fb.1.1234...',
});
```

## Calculator Events

Minimal events for funnel tracking.

```typescript
// Start
dataLayer.push({
  event: 'calculator_start',
  tracking_version: 'v2.0',
  session_id: 'sess_abc123',
});

// Step progression
dataLayer.push({
  event: 'calculator_step',
  tracking_version: 'v2.0',
  session_id: 'sess_abc123',
  step: 2,
});

// Option selection
dataLayer.push({
  event: 'calculator_option',
  tracking_version: 'v2.0',
  session_id: 'sess_abc123',
  field: 'bedrooms',
  value: '3', // String - the selected option
});
```

## Form Abandonment

Triggered after 60s inactivity.

```typescript
dataLayer.push({
  event: 'form_abandon',
  tracking_version: 'v2.0',
  session_id: 'sess_abc123',
  form_id: 'quote',
  last_field: 'email',
});
```

## GTM Variable Mapping

| dataLayer Key | GTM Variable Name |
|---------------|-------------------|
| event | (built-in) |
| value | DLV - value |
| currency | DLV - currency |
| lead_id | DLV - lead_id |
| session_id | DLV - session_id |
| step | DLV - step |
| field | DLV - field |
| user_email | DLV - user_email |
| user_phone | DLV - user_phone |
| device | DLV - device |
| page_url | DLV - page_url |
| first_utm_source | DLV - first_utm_source |
| first_utm_medium | DLV - first_utm_medium |
| first_utm_campaign | DLV - first_utm_campaign |
| first_gclid | DLV - first_gclid |
| last_utm_source | DLV - last_utm_source |
| last_utm_medium | DLV - last_utm_medium |
| last_gclid | DLV - last_gclid |
| last_field | DLV - last_field |
| form_id | DLV - form_id |
