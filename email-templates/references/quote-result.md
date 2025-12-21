# Quote Result Template

HTML + plain text templates for calculator quote results.

## HTML Template

```typescript
// src/lib/email/templates/quote-result.ts
export function quoteResultHTML(data: QuoteData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color:#f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5; padding:20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; overflow:hidden;">
          <tr>
            <td style="background-color:#1C202F; padding:32px 24px; text-align:center;">
              <h1 style="margin:0; color:#ffffff; font-size:24px;">
                Your Quote is Ready
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 24px; text-align:center;">
              <p style="margin:0 0 8px 0; color:#525252; font-size:16px;">
                Hi \${data.name}, here's your estimate:
              </p>
              \${data.priceRange ? \`
              <p style="margin:16px 0; font-size:36px; font-weight:700; color:#FF6B35;">
                \${data.priceRange}
              </p>
              \` : ''}
              <p style="margin:0 0 24px 0; color:#737373; font-size:14px;">
                \${data.summary}
              </p>
              <a href="\${data.resultUrl}" style="display:inline-block; background-color:#FF6B35; color:#ffffff; padding:16px 32px; border-radius:8px; text-decoration:none; font-weight:600; font-size:16px;">
                View Full Quote
              </a>
              \${data.validUntil ? \`
              <p style="margin:24px 0 0 0; color:#737373; font-size:12px;">
                Valid until: \${data.validUntil}
              </p>
              \` : ''}
            </td>
          </tr>
          <tr>
            <td style="background-color:#f5f5f5; padding:24px; text-align:center;">
              <p style="margin:0; color:#737373; font-size:14px;">
                \${data.businessName}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
```

## Plain Text Template

```typescript
export function quoteResultText(data: QuoteData): string {
  return `
Your Quote is Ready
===================

Hi ${data.name},

Here's your estimate from ${data.businessName}:

${data.priceRange ? `Estimated Price: ${data.priceRange}\n` : ''}
${data.summary}

View your full quote here:
${data.resultUrl}

${data.validUntil ? `Valid until: ${data.validUntil}` : ''}

---
${data.businessName}
  `.trim();
}
```

---

# Resend Setup

Reference implementation for sending emails via Resend.

## Installation

```bash
npm install resend
```

## Environment Variables

```env
RESEND_API_KEY=re_xxxxx
PUBLIC_SITE_NAME="Business Name"
PUBLIC_EMAIL_DOMAIN=yourdomain.com
```

## Send Function

```typescript
// src/lib/email/send.ts
import { Resend } from 'resend';

const resend = new Resend(import.meta.env.RESEND_API_KEY);

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}

export async function sendEmail(options: SendEmailOptions) {
  // Validate required fields
  if (!options.to || !options.subject || !options.html || !options.text) {
    console.error('Email missing required fields');
    return { success: false, error: 'Missing required fields' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: `${import.meta.env.PUBLIC_SITE_NAME} <noreply@${import.meta.env.PUBLIC_EMAIL_DOMAIN}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      reply_to: options.replyTo,
    });
    
    if (error) throw error;
    return { success: true, id: data?.id };
  } catch (error) {
    console.error('Email send failed:', error);
    return { success: false, error };
  }
}
```

## Usage in Form Handler

```typescript
// Both emails must be sent for every form submission
await Promise.all([
  sendEmail({
    to: businessEmail,
    subject: `🎉 New lead: ${data.name}`,
    html: leadNotificationHTML(data),
    text: leadNotificationText(data),
    replyTo: data.email,
  }),
  sendEmail({
    to: data.email,
    subject: `Thanks for your enquiry - ${businessName}`,
    html: confirmationHTML(confirmData),
    text: confirmationText(confirmData),
    replyTo: businessEmail,
  }),
]);
```

## Domain Setup

1. Add domain in Resend dashboard
2. Add DNS records (DKIM, SPF)
3. Verify domain
4. Update `PUBLIC_EMAIL_DOMAIN`
