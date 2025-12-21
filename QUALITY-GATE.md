# Quality Gate Checklist

Run before ANY deployment. ALL must pass.

## Performance

- [ ] PageSpeed Mobile ≥ 90
- [ ] PageSpeed Desktop ≥ 95
- [ ] LCP < 2.5s on all pages
- [ ] CLS < 0.1 on all pages
- [ ] INP < 200ms (test interactions)
- [ ] Total JS bundle < 100KB (gzipped)
- [ ] Total CSS < 50KB (gzipped)
- [ ] All images optimized (AVIF/WebP with fallback)
- [ ] No render-blocking resources
- [ ] Fonts self-hosted with `font-display: swap`

## SEO

- [ ] All pages have unique `<title>` (50-60 chars)
- [ ] All pages have unique meta description (150-160 chars)
- [ ] Canonical URLs present on all pages
- [ ] `sitemap.xml` generated and submitted
- [ ] `robots.txt` configured correctly
- [ ] No `noindex` on production pages (except thank-you)
- [ ] Schema.org markup valid (test with Rich Results)
- [ ] Open Graph tags present
- [ ] hreflang tags (if multi-language)
- [ ] Internal links working (no 404s)

## Security

- [ ] No secrets in codebase or git history
- [ ] `.env` in `.gitignore`
- [ ] CSP headers configured
- [ ] HTTPS only (no mixed content)
- [ ] Forms have Turnstile/reCAPTCHA
- [ ] Forms have honeypot field
- [ ] Rate limiting on API endpoints
- [ ] Sensitive headers removed (X-Powered-By, etc.)

## Accessibility

- [ ] Lighthouse Accessibility ≥ 90
- [ ] Keyboard navigation works on all interactive elements
- [ ] Skip-to-content link present
- [ ] All images have alt text
- [ ] All form inputs have labels
- [ ] Color contrast ≥ 4.5:1 (use contrast checker)
- [ ] Focus states visible on all elements
- [ ] No keyboard traps
- [ ] Screen reader tested (VoiceOver/NVDA basic check)
- [ ] `prefers-reduced-motion` respected

## Analytics

- [ ] GTM container loads correctly
- [ ] Page views tracking
- [ ] Form submission events firing
- [ ] Conversion events configured
- [ ] Cookie consent blocks tracking until accepted
- [ ] UTM parameters preserved through forms
- [ ] Thank-you page conversions tracked

## Mobile

- [ ] Tested on iOS Safari (latest)
- [ ] Tested on Android Chrome (latest)
- [ ] Touch targets ≥ 44px × 44px
- [ ] No horizontal scroll
- [ ] Mobile menu works correctly
- [ ] Forms usable on mobile keyboards
- [ ] Sticky CTA visible and functional

## Forms (if applicable)

- [ ] Client-side validation works
- [ ] Server-side validation works
- [ ] Error messages are helpful and visible
- [ ] Success redirect to thank-you page
- [ ] Email delivery confirmed (check spam)
- [ ] Google Sheets integration working (if used)
- [ ] CRM webhook delivering (if used)
- [ ] Form works with JavaScript disabled (graceful degradation)

## Content

- [ ] No Lorem Ipsum text
- [ ] No placeholder images
- [ ] All links working
- [ ] Phone numbers clickable (`tel:`)
- [ ] Email addresses clickable (`mailto:`)
- [ ] Legal pages present (Privacy, Terms)
- [ ] Copyright year is current
- [ ] Company details accurate

## Browser Testing

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] iOS Safari
- [ ] Android Chrome

## Pre-Launch Final

- [ ] Domain DNS configured
- [ ] SSL certificate active
- [ ] Redirects from www/non-www working
- [ ] 404 page customized
- [ ] Favicon and app icons present
- [ ] Social share image (og:image) working
- [ ] Google Search Console connected
- [ ] Analytics property created
- [ ] Backup/rollback plan documented

## Sign-Off

| Check | Passed | Date | Notes |
|-------|--------|------|-------|
| Performance | ☐ | | |
| SEO | ☐ | | |
| Security | ☐ | | |
| Accessibility | ☐ | | |
| Analytics | ☐ | | |
| Mobile | ☐ | | |
| Forms | ☐ | | |
| Content | ☐ | | |
| Browser Testing | ☐ | | |
| Pre-Launch | ☐ | | |

**Approved for deployment:** ☐

**Approved by:** _______________

**Date:** _______________
