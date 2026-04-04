# Customer Confirmation Template

HTML + plain text templates for customer confirmation.

## HTML Template

```typescript
// src/lib/email/templates/customer-confirmation.ts
export function confirmationHTML(data: ConfirmationData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thanks for your enquiry</title>
</head>
<body style="margin:0; padding:0; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color:#f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5; padding:20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; overflow:hidden; max-width:100%;">
          <!-- Header -->
          <tr>
            <td style="background-color:#1C202F; padding:32px 24px; text-align:center;">
              <h1 style="margin:0; color:#ffffff; font-size:24px; font-weight:700;">
                Thanks, \${data.name}!
              </h1>
              <p style="margin:8px 0 0 0; color:#a3a3a3; font-size:16px;">
                We've received your enquiry
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding:32px 24px;">
              <p style="margin:0 0 16px 0; color:#171717; font-size:16px; line-height:1.6;">
                Thank you for getting in touch with <strong>\${data.businessName}</strong>.
              </p>
              <p style="margin:0 0 24px 0; color:#171717; font-size:16px; line-height:1.6;">
                We'll get back to you <strong>\${data.responseTime}</strong>.
              </p>
              
              <!-- What's Next -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5; border-radius:8px; padding:20px;">
                <tr>
                  <td>
                    <h2 style="margin:0 0 12px 0; font-size:16px; color:#171717;">
                      What happens next?
                    </h2>
                    <ol style="margin:0; padding-left:20px; color:#525252; line-height:1.8;">
                      <li>We review your enquiry</li>
                      <li>A team member will contact you</li>
                      <li>We'll discuss your requirements</li>
                    </ol>
                  </td>
                </tr>
              </table>
              
              <!-- Urgent Contact -->
              <p style="margin:24px 0 0 0; color:#525252; font-size:14px;">
                Need to speak to someone urgently?<br>
                Call us: <a href="tel:\${data.businessPhone}" style="color:#FF6B35; font-weight:600;">\${data.businessPhone}</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color:#f5f5f5; padding:24px; text-align:center;">
              <p style="margin:0; color:#737373; font-size:14px;">
                \${data.businessName}<br>
                <a href="mailto:\${data.businessEmail}" style="color:#525252;">\${data.businessEmail}</a>
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
export function confirmationText(data: ConfirmationData): string {
  return `
Thanks, ${data.name}!

We've received your enquiry.

Thank you for getting in touch with ${data.businessName}.
We'll get back to you ${data.responseTime}.

What happens next?
1. We review your enquiry
2. A team member will contact you
3. We'll discuss your requirements

Need to speak to someone urgently?
Call us: ${data.businessPhone}

---
${data.businessName}
${data.businessEmail}
  `.trim();
}
```

## Customization

| Element | Default | Customize via |
|---------|---------|---------------|
| Header color | #1C202F | design-tokens primary |
| Phone link color | #FF6B35 | design-tokens accent |
| Response time | Variable | businessInfo config |
