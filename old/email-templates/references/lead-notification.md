# Lead Notification Template

HTML + plain text templates for business notification.

## HTML Template

```typescript
// src/lib/email/templates/lead-notification.ts
export function leadNotificationHTML(data: LeadNotificationData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Lead</title>
</head>
<body style="margin:0; padding:0; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color:#f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5; padding:20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; overflow:hidden; max-width:100%;">
          <!-- Header -->
          <tr>
            <td style="background-color:#FF6B35; padding:24px; text-align:center;">
              <h1 style="margin:0; color:#ffffff; font-size:24px; font-weight:700;">
                🎉 New Lead!
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding:32px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:12px 0; border-bottom:1px solid #e5e5e5;">
                    <strong style="color:#525252;">Name:</strong><br>
                    <span style="color:#171717; font-size:18px;">\${data.name}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0; border-bottom:1px solid #e5e5e5;">
                    <strong style="color:#525252;">Email:</strong><br>
                    <a href="mailto:\${data.email}" style="color:#FF6B35; font-size:18px;">\${data.email}</a>
                  </td>
                </tr>
                \${data.phone ? \`
                <tr>
                  <td style="padding:12px 0; border-bottom:1px solid #e5e5e5;">
                    <strong style="color:#525252;">Phone:</strong><br>
                    <a href="tel:\${data.phone}" style="color:#FF6B35; font-size:18px;">\${data.phone}</a>
                  </td>
                </tr>
                \` : ''}
                \${data.message ? \`
                <tr>
                  <td style="padding:12px 0; border-bottom:1px solid #e5e5e5;">
                    <strong style="color:#525252;">Message:</strong><br>
                    <span style="color:#171717;">\${data.message}</span>
                  </td>
                </tr>
                \` : ''}
              </table>
              
              <!-- Quick Actions -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
                <tr>
                  <td align="center">
                    \${data.phone ? \`
                    <a href="tel:\${data.phone}" style="display:inline-block; background-color:#22c55e; color:#ffffff; padding:12px 24px; border-radius:6px; text-decoration:none; font-weight:600; margin:4px;">
                      📞 Call Now
                    </a>
                    \` : ''}
                    <a href="mailto:\${data.email}" style="display:inline-block; background-color:#3b82f6; color:#ffffff; padding:12px 24px; border-radius:6px; text-decoration:none; font-weight:600; margin:4px;">
                      ✉️ Reply
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color:#f5f5f5; padding:16px 24px; font-size:12px; color:#737373;">
              <p style="margin:0 0 8px 0;">
                <strong>Source:</strong> \${data.source}
              </p>
              \${data.utm?.source ? \`
              <p style="margin:0 0 8px 0;">
                <strong>UTM:</strong> \${data.utm.source} / \${data.utm.medium || '-'} / \${data.utm.campaign || '-'}
              </p>
              \` : ''}
              <p style="margin:0;">
                <strong>Time:</strong> \${data.timestamp}
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
export function leadNotificationText(data: LeadNotificationData): string {
  return `
NEW LEAD!
=========

Name: ${data.name}
Email: ${data.email}
${data.phone ? `Phone: ${data.phone}` : ''}
${data.message ? `\nMessage:\n${data.message}` : ''}

---
Source: ${data.source}
Time: ${data.timestamp}
${data.utm?.source ? `UTM: ${data.utm.source} / ${data.utm.medium || '-'}` : ''}
  `.trim();
}
```

## Customization

| Element | Default | Customize via |
|---------|---------|---------------|
| Header color | #FF6B35 | design-tokens accent |
| Button colors | green/blue | design-tokens |
| Font | System fonts | Keep as-is for email |
