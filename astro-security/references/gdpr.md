# GDPR Compliance

## Cookie Categories

| Category | Consent Required | Examples |
|----------|-----------------|----------|
| Strictly Necessary | No | Session cookies, CSRF tokens, load balancer |
| Functional | Yes | Language preference, theme |
| Analytics | Yes | Google Analytics, Hotjar, Clarity |
| Marketing | Yes | Meta Pixel, Google Ads, LinkedIn Insight |

## Minimal Cookie Banner

```html
<div id="cookie-banner" class="cookie-banner" role="dialog" aria-label="Cookie consent">
  <p>We use cookies to improve your experience. 
    <a href="/privacy">Learn more</a>
  </p>
  <div class="cookie-actions">
    <button id="cookie-accept" class="btn-primary">Accept All</button>
    <button id="cookie-reject" class="btn-secondary">Reject Non-Essential</button>
  </div>
</div>
```

```typescript
// cookie-consent.ts
const CONSENT_KEY = 'cookie_consent';

function getConsent(): string | null {
  return localStorage.getItem(CONSENT_KEY);
}

function setConsent(value: 'all' | 'essential') {
  localStorage.setItem(CONSENT_KEY, value);
  document.getElementById('cookie-banner')?.remove();
  
  if (value === 'all') {
    loadAnalytics();
    loadMarketing();
  }
}

function init() {
  const consent = getConsent();
  
  if (!consent) {
    document.getElementById('cookie-banner')?.classList.add('visible');
  } else if (consent === 'all') {
    loadAnalytics();
    loadMarketing();
  }
}

document.getElementById('cookie-accept')?.addEventListener('click', () => setConsent('all'));
document.getElementById('cookie-reject')?.addEventListener('click', () => setConsent('essential'));

init();
```

## Form Consent

```html
<label class="consent-checkbox">
  <input type="checkbox" name="consent" required>
  <span>I agree to the <a href="/privacy" target="_blank">Privacy Policy</a> 
  and consent to being contacted about my enquiry.</span>
</label>
```

## Privacy Policy Requirements

Must include:

1. **Who you are** — Company name, contact details
2. **What data you collect** — Form fields, cookies, analytics
3. **Why you collect it** — Legal basis (consent, legitimate interest)
4. **How long you keep it** — Retention period
5. **Who you share it with** — Third parties (Google, email provider)
6. **User rights** — Access, deletion, portability
7. **How to contact you** — Email for requests
8. **Cookie details** — List of cookies used

## Data Retention

| Data Type | Retention | Justification |
|-----------|-----------|---------------|
| Lead form data | 2 years | Sales cycle |
| Analytics | 14 months | GA4 default |
| Email logs | 30 days | Troubleshooting |
| Failed submissions | 7 days | Debugging |

## Right to Deletion

Process for handling deletion requests:

1. Verify identity (email confirmation)
2. Delete from Google Sheets
3. Delete from email provider
4. Delete from analytics (if possible)
5. Confirm deletion to user within 30 days

## GTM Consent Mode

```javascript
// Before GTM loads
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}

gtag('consent', 'default', {
  'analytics_storage': 'denied',
  'ad_storage': 'denied',
  'wait_for_update': 500
});

// After user accepts
gtag('consent', 'update', {
  'analytics_storage': 'granted',
  'ad_storage': 'granted'
});
```

## UK Specifics

Post-Brexit, UK uses UK GDPR which is nearly identical to EU GDPR. Key difference:

- Supervisory authority: ICO (Information Commissioner's Office)
- Registration may be required if processing significant personal data
- £40/year for small businesses
