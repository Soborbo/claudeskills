# Email Setup

## Provider Priority

```yaml
email_providers:
  primary: Resend
  fallback: Brevo
  auto_switch: true
```

## Unified Sender

```typescript
// src/lib/forms/email/send.ts
import { sendWithResend } from './resend';
import { sendWithBrevo } from './brevo';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

interface EmailResult {
  success: boolean;
  provider: 'resend' | 'brevo';
  error?: string;
}

export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  // Try Resend first
  const resendResult = await sendWithResend(options);
  if (resendResult.success) {
    return { success: true, provider: 'resend' };
  }
  
  // Fallback to Brevo
  const brevoResult = await sendWithBrevo(options);
  if (brevoResult.success) {
    return { success: true, provider: 'brevo' };
  }
  
  return { 
    success: false, 
    provider: 'brevo',
    error: brevoResult.error 
  };
}
```

## Resend Implementation

```typescript
// src/lib/forms/email/resend.ts
export async function sendWithResend(options: EmailOptions) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${import.meta.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'noreply@yourdomain.com',
      to: options.to,
      subject: options.subject,
      html: options.html,
      reply_to: options.replyTo,
    }),
  });
  
  return { success: response.ok };
}
```

## Email Templates

### Customer Confirmation

```html
<h1>Köszönjük megkeresését!</h1>
<p>Hamarosan felvesszük Önnel a kapcsolatot.</p>

<h2>Az Ön adatai:</h2>
<ul>
  <li><strong>Név:</strong> {{name}}</li>
  <li><strong>Email:</strong> {{email}}</li>
  <li><strong>Telefon:</strong> {{phone}}</li>
</ul>

<p>Ha kérdése van, válaszoljon erre az emailre.</p>
```

### Business Notification

```html
<h1>Új lead érkezett!</h1>

<table>
  <tr><td>Név:</td><td>{{name}}</td></tr>
  <tr><td>Email:</td><td>{{email}}</td></tr>
  <tr><td>Telefon:</td><td>{{phone}}</td></tr>
  <tr><td>Forrás:</td><td>{{sourceUrl}}</td></tr>
  <tr><td>Időpont:</td><td>{{timestamp}}</td></tr>
</table>
```

## Required Emails

| Email | Recipient | Required |
|-------|-----------|----------|
| Confirmation | Customer | ✅ FAIL if not sent |
| Notification | Business | ✅ FAIL if not sent |
