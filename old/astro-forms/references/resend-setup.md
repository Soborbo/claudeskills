# Resend Setup

## Overview

Resend is the primary email provider. Brevo is fallback.

| Feature | Resend |
|---------|--------|
| Free tier | 3,000/month |
| API | REST |
| Templates | React Email |
| Deliverability | Excellent |

---

## 1. Create Account

1. Go to [resend.com](https://resend.com)
2. Sign up with email
3. Verify email address

## 2. Add Domain

1. Dashboard → Domains → Add Domain
2. Add DNS records (provided by Resend):
   - SPF record
   - DKIM record
   - DMARC record (optional but recommended)
3. Wait for verification (usually <1 hour)

### DNS Records Example

```
# SPF
Type: TXT
Name: @
Value: v=spf1 include:_spf.resend.com ~all

# DKIM
Type: TXT
Name: resend._domainkey
Value: [provided by Resend]

# DMARC (recommended)
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com
```

## 3. Create API Key

1. Dashboard → API Keys → Create API Key
2. Name it (e.g., "Production Forms")
3. Copy key immediately (shown once)
4. Add to environment:

```env
RESEND_API_KEY=re_xxxxxxxxxxxxx
```

---

## Implementation

### Basic Send Function

```typescript
// src/lib/forms/email/resend.ts

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  from?: string;
}

interface SendResult {
  success: boolean;
  id?: string;
  error?: string;
}

export async function sendWithResend(options: EmailOptions): Promise<SendResult> {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: options.from || 'noreply@yourdomain.com',
        to: options.to,
        subject: options.subject,
        html: options.html,
        reply_to: options.replyTo,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.message };
    }

    const data = await response.json();
    return { success: true, id: data.id };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
```

### Send Both Emails

```typescript
// src/lib/forms/email/send.ts

export async function sendFormEmails(data: {
  name: string;
  email: string;
  phone: string;
  message?: string;
  sourceUrl: string;
}) {
  const timestamp = new Date().toLocaleString('hu-HU');
  
  // 1. Customer confirmation
  const customerResult = await sendWithResend({
    to: data.email,
    subject: 'Köszönjük megkeresését!',
    html: `
      <h1>Kedves ${data.name}!</h1>
      <p>Köszönjük, hogy felvette velünk a kapcsolatot.</p>
      <p>Hamarosan jelentkezünk!</p>
      <hr />
      <p><small>Ez egy automatikus üzenet, kérjük ne válaszoljon rá.</small></p>
    `,
  });

  // 2. Business notification
  const businessResult = await sendWithResend({
    to: 'info@yourdomain.com',
    subject: `Új lead: ${data.name}`,
    replyTo: data.email,
    html: `
      <h1>Új lead érkezett!</h1>
      <table>
        <tr><td><strong>Név:</strong></td><td>${data.name}</td></tr>
        <tr><td><strong>Email:</strong></td><td>${data.email}</td></tr>
        <tr><td><strong>Telefon:</strong></td><td>${data.phone}</td></tr>
        <tr><td><strong>Üzenet:</strong></td><td>${data.message || '-'}</td></tr>
        <tr><td><strong>Forrás:</strong></td><td>${data.sourceUrl}</td></tr>
        <tr><td><strong>Időpont:</strong></td><td>${timestamp}</td></tr>
      </table>
    `,
  });

  return {
    customer: customerResult,
    business: businessResult,
    allSuccess: customerResult.success && businessResult.success,
  };
}
```

---

## Email Templates

### Customer Confirmation (HU)

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    h1 { color: #1C202F; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Köszönjük megkeresését!</h1>
    <p>Kedves {{name}}!</p>
    <p>Megkaptuk üzenetét, és hamarosan felvesszük Önnel a kapcsolatot.</p>
    <p>Ha sürgős, hívjon minket: <a href="tel:+36301234567">+36 30 123 4567</a></p>
    <div class="footer">
      <p>Ez egy automatikus üzenet. Kérjük, ne válaszoljon rá.</p>
      <p>© {{year}} {{company}}</p>
    </div>
  </div>
</body>
</html>
```

### Business Notification

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    table { border-collapse: collapse; width: 100%; }
    td { padding: 8px; border-bottom: 1px solid #eee; }
    td:first-child { font-weight: bold; width: 120px; }
  </style>
</head>
<body>
  <h1>🔔 Új lead érkezett!</h1>
  <table>
    <tr><td>Név:</td><td>{{name}}</td></tr>
    <tr><td>Email:</td><td><a href="mailto:{{email}}">{{email}}</a></td></tr>
    <tr><td>Telefon:</td><td><a href="tel:{{phone}}">{{phone}}</a></td></tr>
    <tr><td>Üzenet:</td><td>{{message}}</td></tr>
    <tr><td>Forrás:</td><td>{{sourceUrl}}</td></tr>
    <tr><td>Időpont:</td><td>{{timestamp}}</td></tr>
  </table>
</body>
</html>
```

---

## Error Handling

```typescript
// Fallback to Brevo on Resend failure
export async function sendEmailWithFallback(options: EmailOptions) {
  const resendResult = await sendWithResend(options);
  
  if (resendResult.success) {
    return { ...resendResult, provider: 'resend' };
  }
  
  console.warn('Resend failed, trying Brevo:', resendResult.error);
  
  const brevoResult = await sendWithBrevo(options);
  return { ...brevoResult, provider: 'brevo' };
}
```

---

## Checklist

- [ ] Resend account created
- [ ] Domain added and verified
- [ ] DNS records configured (SPF, DKIM)
- [ ] API key created
- [ ] API key in environment
- [ ] Customer email template ready
- [ ] Business notification template ready
- [ ] Fallback to Brevo configured
- [ ] Error logging implemented
