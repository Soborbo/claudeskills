# Privacy Policy Template (UK English)

Replace all `[PLACEHOLDERS]` with actual business details.

```markdown
# Privacy Policy

**Last updated: [DATE]**

## Who We Are

[BUSINESS_NAME] ("we", "us", "our") operates [WEBSITE_URL].

**Contact:**
- Address: [ADDRESS]
- Email: [EMAIL]
- Phone: [PHONE]
[IF_COMPANY_NUMBER]- Company Number: [COMPANY_NUMBER][/IF]

## Information We Collect

### Information you provide:
[FOR_EACH_FORM_FIELD]
- [FIELD_NAME]
[/FOR_EACH]

### Automatically collected:
- IP address (anonymized)
- Browser type
- Pages visited
- Time spent on site

## How We Use Your Information

We use your information to:
- Respond to your enquiries
- Provide quotes and services
- Send service-related communications
- Improve our website

**We do NOT:**
- Sell your data to third parties
- Send marketing without consent
- Share data outside the UK/EEA without safeguards

## Legal Basis (GDPR)

| Purpose | Legal Basis |
|---------|-------------|
| Responding to enquiries | Legitimate interest |
| Providing services | Contract performance |
| Marketing (with consent) | Consent |
| Website analytics | Legitimate interest |

## Data Retention

- Enquiry data: 2 years after last contact
- Analytics data: 14 months
- Marketing consent: Until withdrawn

## Your Rights

Under UK GDPR, you have the right to:
- Access your data
- Correct inaccurate data
- Delete your data
- Restrict processing
- Data portability
- Object to processing
- Withdraw consent

**To exercise these rights:** Email [EMAIL] with subject "Data Request".

We will respond within 30 days.

## Cookies

See our [Cookie Policy](/cookie-policy) for details.

## Third-Party Services

We use:
[IF_ANALYTICS]
- **Google Analytics** — Website analytics ([Privacy Policy](https://policies.google.com/privacy))
[/IF]
- **Cloudflare** — Security ([Privacy Policy](https://www.cloudflare.com/privacypolicy/))
[IF_EMAIL]
- **Resend** — Email delivery ([Privacy Policy](https://resend.com/legal/privacy-policy))
[/IF]

## Data Security

We protect your data using:
- SSL/TLS encryption
- Secure hosting (Cloudflare)
- Limited access controls

## Changes

We may update this policy. Check "Last updated" date.

## Complaints

If unsatisfied, you can complain to:

**Information Commissioner's Office (ICO)**
- Website: ico.org.uk
- Phone: 0303 123 1113
```

## Placeholder Reference

| Placeholder | Source |
|-------------|--------|
| `[BUSINESS_NAME]` | legal_info.business_name |
| `[WEBSITE_URL]` | site URL |
| `[ADDRESS]` | legal_info.address |
| `[EMAIL]` | legal_info.email |
| `[PHONE]` | legal_info.phone |
| `[COMPANY_NUMBER]` | legal_info.company_number |
| `[DATE]` | Current date |
| `[FORM_FIELD]` | form_fields array |
