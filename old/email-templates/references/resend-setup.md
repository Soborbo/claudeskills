# Resend Email Setup

## Overview

Resend is the primary email provider. Brevo is fallback.

## Setup Steps

### 1. Create Resend Account

1. Sign up at resend.com
2. Verify domain (add DNS records)
3. Generate API key

### 2. Domain Verification

Add these DNS records:

```
Type: TXT
Name: resend._domainkey
Value: [provided by Resend]

Type: MX (optional, for receiving)
Name: [subdomain]
Value: feedback-smtp.resend.com
```

### 3. Environment Variables

```env
RESEND_API_KEY=re_xxxxxxxxxxxxx
```

### 4. API Usage

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: 'Business Name <hello@yourdomain.com>',
  to: recipient,
  subject: subject,
  html: htmlContent,
  text: textContent,
  reply_to: 'business@email.com'
});
```

## From Address

- Must use verified domain
- Format: `Name <email@domain.com>`
- reply_to can be different

## Rate Limits

| Plan | Emails/day | Emails/month |
|------|------------|--------------|
| Free | 100 | 3,000 |
| Pro | 50,000 | - |

## Fallback to Brevo

If Resend fails, automatically switch to Brevo. See email skill for fallback logic.

## Testing

1. Use Resend dashboard to view sent emails
2. Check delivery status
3. Monitor bounce/complaint rates
