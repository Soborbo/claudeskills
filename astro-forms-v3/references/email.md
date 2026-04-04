# Email Delivery

## Provider Priority

Resend is primary. On failure, auto-fallback to Brevo. Both use the same `EmailOptions` interface.

```
Resend → success → done
Resend → fail → Brevo → success → done
Resend → fail → Brevo → fail → log error, continue
```

Implementation: `assets/boilerplate/lib/email/send.ts`

## Required Emails

Every valid form submission triggers two emails:

| Email | Recipient | On Failure |
|-------|-----------|-----------|
| Customer confirmation | The person who submitted | Log warning, continue. Lead is already saved. |
| Business notification | Business owner / team | Log error + alert. Business must see every lead. |

## Security: HTML Escaping

**All user input MUST be escaped before interpolation into email HTML.** Use the `escapeHtml()` helper from `lib/sanitize.ts`.

```typescript
// WRONG — HTML injection risk
html: `<p>Name: ${data.name}</p>`

// CORRECT
import { escapeHtml } from '../sanitize';
html: `<p>Name: ${escapeHtml(data.name)}</p>`
```

Fields that must be escaped: `name`, `email`, `phone`, `message`, `sourcePage`, and any other user-provided string.

## Template Structure

### Customer Confirmation (EN)

```
Subject: Thank you for your enquiry
Body:
  - Greeting with name
  - "We received your message and will be in touch shortly."
  - Contact details summary (name, email, phone)
  - Direct phone number for urgent matters
  - Footer: automated message disclaimer + company info
```

### Customer Confirmation (HU)

```
Subject: Köszönjük megkeresését!
Body:
  - Megszólítás névvel
  - "Megkaptuk üzenetét, hamarosan felvesszük Önnel a kapcsolatot."
  - Megadott adatok összefoglalása
  - Telefonszám sürgős esetekre
  - Footer: automatikus üzenet figyelmeztetés + cégadatok
```

### Business Notification

```
Subject: New lead: {name}
Reply-To: {customer email}
Body:
  - Name, email, phone, message
  - Source page URL
  - Timestamp
  - UTM parameters if present
```

Actual HTML templates live in the handler code (`submit.ts`). Do not duplicate full HTML here — this reference defines the structure and rules, not the markup.

## Sender Identity

| Field | Value |
|-------|-------|
| From address | `noreply@{client-domain}` |
| From name | Client business name |
| Reply-To (customer email) | Not set (do-not-reply) |
| Reply-To (business notification) | Customer's email address |

The `from` address domain must match the domain verified in Resend. See `resend-setup.md`.

## Setup Checklist

- [ ] Resend account created + domain verified (see `resend-setup.md`)
- [ ] Brevo account created as fallback
- [ ] `RESEND_API_KEY` in environment
- [ ] `BREVO_API_KEY` in environment
- [ ] Customer confirmation template adapted to client
- [ ] Business notification email address configured
- [ ] `escapeHtml()` used on all interpolated values
