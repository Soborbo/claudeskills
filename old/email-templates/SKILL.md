---
name: email-templates
description: Transactional email templates for lead generation forms. Lead notification + customer confirmation. Resend compatible.
---

# Email Templates Skill

## Purpose

Produces HTML + plain text email templates for form submissions. Transactional only.

## Scope

| ✅ Transactional | ❌ NOT Supported |
|-----------------|-----------------|
| Form confirmations | Marketing campaigns |
| Lead notifications | Newsletters |
| Quote results | Nurture sequences |
| System alerts | Promotional emails |

**This skill is for transactional emails only. No marketing.**

## Skill Output

For each form, this skill produces:

| Template | To | Required |
|----------|-----|----------|
| Lead Notification | Business | ✅ |
| Customer Confirmation | Customer | ✅ |
| Quote Result | Customer | If calculator |

**Rule:** Every form needs BOTH business + customer email. No exceptions.

## Core Rules

1. **Two emails per form** — Business notification + customer confirmation
2. **HTML + plain text** — Both versions required
3. **No external images** — Inline styles only
4. **Mobile-first** — 600px max width, large text
5. **Brand colors from design-tokens** — No hardcoded colors
6. **Reply-to = business email** — Never noreply-only

## Required Fields

### Lead Notification

```typescript
interface LeadNotificationData {
  name: string;        // Required
  email: string;       // Required
  phone?: string;
  message?: string;
  source: string;      // Required - page URL
  timestamp: string;   // Required
  utm?: { source?: string; medium?: string; campaign?: string; };
}
```

### Customer Confirmation

```typescript
interface ConfirmationData {
  name: string;           // Required
  businessName: string;   // Required
  businessPhone: string;  // Required
  businessEmail: string;  // Required
  responseTime: string;   // Required - e.g., "within 2 hours"
}
```

### Quote Result

```typescript
interface QuoteData {
  name: string;         // Required
  businessName: string; // Required
  resultUrl: string;    // Required
  summary: string;      // Required
  priceRange?: string;
  validUntil?: string;
}
```

## Blocking Conditions (STOP)

Do NOT send email if:

| Condition | Check |
|-----------|-------|
| Missing required field | name, email, businessName |
| No plain text version | Both versions required |
| Invalid email format | Basic validation |
| No reply-to set | Business must be reachable |

**Missing required field = email NOT sent. Log error.**

## Email Structure

### Lead Notification (to Business)

| Section | Content |
|---------|---------|
| Header | "🎉 New Lead!" + accent color |
| Body | Name, Email, Phone, Message |
| Actions | Call button, Reply button |
| Footer | Source URL, UTM data, Timestamp |

### Customer Confirmation (to Customer)

| Section | Content |
|---------|---------|
| Header | "Thanks, {name}!" |
| Body | Confirmation message |
| Next Steps | Numbered list |
| Footer | Business contact info |

### Quote Result (to Customer)

| Section | Content |
|---------|---------|
| Header | "Your Quote is Ready" |
| Body | Price range, Summary |
| CTA | "View Full Quote" button |
| Footer | Validity date |

## Subject Lines

| Type | Pattern | Example |
|------|---------|---------|
| Lead notification | `🎉 New lead: {name}` | "🎉 New lead: John Smith" |
| Confirmation | `Thanks for your enquiry - {business}` | "Thanks for your enquiry - Bristol Removals" |
| Quote | `Your quote from {business}` | "Your quote from Bristol Removals" |

## Plain Text Rules

- Max 70 characters per line
- No HTML references
- Same content as HTML
- Clear section breaks with blank lines

## Testing Checklist

- [ ] Renders on Gmail (web + mobile)
- [ ] Renders on Outlook
- [ ] Renders on Apple Mail
- [ ] Plain text readable
- [ ] Links work
- [ ] Reply-to correct
- [ ] From name = business name

## Forbidden

- ❌ External image URLs
- ❌ HTML-only (no plain text)
- ❌ Generic "noreply@" without business name
- ❌ Marketing content in transactional
- ❌ Sending with missing required fields
- ❌ Only business OR only customer email

## References

- [lead-notification.md](references/lead-notification.md) — Full HTML template
- [customer-confirmation.md](references/customer-confirmation.md) — Full HTML template
- [quote-result.md](references/quote-result.md) — Full HTML template
- [resend-setup.md](references/resend-setup.md) — Sending implementation

## Definition of Done

- [ ] Lead notification template (HTML + text)
- [ ] Customer confirmation template (HTML + text)
- [ ] Quote template if calculator (HTML + text)
- [ ] Both emails sent per form submission
- [ ] Tested on Gmail, Outlook, Apple Mail
- [ ] From name = business name
- [ ] Reply-to = business email
