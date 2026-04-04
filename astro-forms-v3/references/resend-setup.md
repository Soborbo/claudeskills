# Resend Setup

Resend is the primary email provider. Brevo is fallback.

| Feature | Value |
|---------|-------|
| Free tier | 3,000 emails/month |
| API | REST |
| Deliverability | Excellent |

---

## 1. Create Account

1. Go to [resend.com](https://resend.com)
2. Sign up and verify email

## 2. Add and Verify Domain

1. Dashboard → Domains → Add Domain
2. Add the DNS records Resend provides:

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

3. Wait for verification (usually < 1 hour)

**Important:** The `from` address in emails must use this verified domain. E.g. `noreply@verified-domain.com`.

## 3. Create API Key

1. Dashboard → API Keys → Create API Key
2. Name it (e.g. "Production Forms")
3. Copy key immediately (shown only once)
4. Store in environment:

```env
RESEND_API_KEY=re_xxxxxxxxxxxxx
```

See `cloudflare-setup.md` for how to set this in Cloudflare Workers.

## 4. Test

Send a test email through the Resend dashboard to confirm the domain works before wiring up the handler.

---

## Implementation

Email sending code lives in the boilerplate:

- `assets/boilerplate/lib/email/resend.ts` — Resend provider
- `assets/boilerplate/lib/email/brevo.ts` — Brevo fallback
- `assets/boilerplate/lib/email/send.ts` — Unified sender with auto-fallback

Do not duplicate sending logic elsewhere. The boilerplate is the single source of truth.

---

## Checklist

- [ ] Resend account created
- [ ] Domain added and DNS records configured
- [ ] Domain verified (SPF + DKIM green)
- [ ] API key created and stored in environment
- [ ] Test email sent successfully
- [ ] Brevo configured as fallback (see Brevo account setup separately)
