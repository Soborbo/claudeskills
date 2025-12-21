# Email Setup Reference

## Architecture

```
sendEmail() → try Resend → if fails → try Brevo → return result
```

## Unified Sender

```typescript
// src/lib/forms/email/send.ts
import { sendViaResend } from './resend';
import { sendViaBrevo } from './brevo';

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
  const resendResult = await sendViaResend(options);
  if (resendResult.success) {
    return { success: true, provider: 'resend' };
  }
  
  // Fallback to Brevo
  const brevoResult = await sendViaBrevo(options);
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

## Resend Provider

```typescript
// src/lib/forms/email/resend.ts
const RESEND_API_KEY = import.meta.env.RESEND_API_KEY;

export async function sendViaResend(options: EmailOptions) {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: options.from || 'noreply@example.com',
        to: options.to,
        subject: options.subject,
        html: options.html,
        reply_to: options.replyTo,
      }),
    });
    
    return { success: response.ok };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
```

## Brevo Provider

```typescript
// src/lib/forms/email/brevo.ts
const BREVO_API_KEY = import.meta.env.BREVO_API_KEY;

export async function sendViaBrevo(options: EmailOptions) {
  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: { email: options.from || 'noreply@example.com' },
        to: [{ email: options.to }],
        subject: options.subject,
        htmlContent: options.html,
        replyTo: options.replyTo ? { email: options.replyTo } : undefined,
      }),
    });
    
    return { success: response.ok };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
```

## HTML Email Templates

Store in separate files, use placeholders:

```html
<!-- emails/confirmation.html -->
<h1>Köszönjük, {{FIRST_NAME}}!</h1>
<p>{{MESSAGE}}</p>
```

```typescript
// Load and replace
import confirmationTemplate from './emails/confirmation.html?raw';

const html = confirmationTemplate
  .replace('{{FIRST_NAME}}', data.firstName)
  .replace('{{MESSAGE}}', 'Your message here');
```
