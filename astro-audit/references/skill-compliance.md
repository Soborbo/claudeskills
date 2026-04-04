# Skill Compliance Check

## Purpose

Verify implementation matches ALL active skill requirements.

## Automated Compliance Script

```bash
#!/bin/bash
# scripts/skill-compliance.sh

echo "📋 Checking skill compliance..."
ISSUES=0

# ============================================
# ASTRO-FORMS SKILL
# ============================================
echo ""
echo "=== astro-forms ==="

# Turnstile required
if ! grep -rq "cf-turnstile\|turnstile" src/; then
  echo "❌ FAIL: Missing Turnstile integration"
  ISSUES=$((ISSUES+1))
else
  echo "✅ Turnstile found"
fi

# Honeypot required
if ! grep -rq "honeypot\|hidden.*website\|tabindex=\"-1\"" src/; then
  echo "❌ FAIL: Missing honeypot field"
  ISSUES=$((ISSUES+1))
else
  echo "✅ Honeypot found"
fi

# Zod validation
if ! grep -rq "zod\|z\.\|z\.object" src/; then
  echo "❌ FAIL: Missing Zod validation"
  ISSUES=$((ISSUES+1))
else
  echo "✅ Zod validation found"
fi

# Server-side handling
if ! ls src/pages/api/*.ts 2>/dev/null; then
  echo "⚠️ WARN: No API routes found"
fi

# ============================================
# ASTRO-SECURITY SKILL  
# ============================================
echo ""
echo "=== astro-security ==="

# Security headers
if [ -f "public/_headers" ]; then
  if grep -q "X-Frame-Options" public/_headers; then
    echo "✅ Security headers found"
  else
    echo "❌ FAIL: _headers missing X-Frame-Options"
    ISSUES=$((ISSUES+1))
  fi
else
  echo "❌ FAIL: Missing public/_headers"
  ISSUES=$((ISSUES+1))
fi

# CSP
if ! grep -q "Content-Security-Policy" public/_headers 2>/dev/null; then
  echo "⚠️ WARN: No CSP header"
fi

# Rate limiting
if ! grep -rq "rate.*limit\|isRateLimited\|rateLimit" src/; then
  echo "⚠️ WARN: No rate limiting detected"
fi

# .env not in git
if git ls-files | grep -qE "^\.env$"; then
  echo "❌ FAIL: .env committed to git"
  ISSUES=$((ISSUES+1))
else
  echo "✅ .env not in git"
fi

# ============================================
# ASTRO-UX SKILL
# ============================================
echo ""
echo "=== astro-ux ==="

# Mobile sticky CTA
if ! grep -rq "sticky.*bottom\|fixed.*bottom\|mobile-cta" src/; then
  echo "⚠️ WARN: No mobile sticky CTA found"
fi

# Desktop CTA menu
if ! grep -rq "desktop-cta\|cta-menu\|fixed.*right" src/; then
  echo "⚠️ WARN: No desktop sticky CTA menu found"
fi

# Thank you page
if ! ls src/pages/*thank*you* src/pages/*success* 2>/dev/null; then
  echo "❌ FAIL: No thank you page"
  ISSUES=$((ISSUES+1))
else
  echo "✅ Thank you page found"
fi

# ============================================
# ASTRO-IMAGES (from memory)
# ============================================
echo ""
echo "=== astro-images ==="

# Picture component usage
PICTURE_COUNT=$(grep -rn "<Picture" src/ 2>/dev/null | wc -l)
IMG_COUNT=$(grep -rn "<img" src/ 2>/dev/null | wc -l)

echo "Picture components: $PICTURE_COUNT"
echo "Raw img tags: $IMG_COUNT"

if [ "$IMG_COUNT" -gt "$PICTURE_COUNT" ]; then
  echo "⚠️ WARN: More <img> than <Picture> - check optimization"
fi

# Hero eager loading
if ! grep -rq 'loading="eager"' src/; then
  echo "⚠️ WARN: No eager loading found (check hero)"
fi

# Fetchpriority for LCP
if ! grep -rq "fetchpriority" src/; then
  echo "⚠️ WARN: No fetchpriority found (check LCP image)"
fi

# ============================================
# SEO REQUIREMENTS
# ============================================
echo ""
echo "=== SEO ==="

# Sitemap
if ! grep -rq "@astrojs/sitemap\|sitemap" astro.config.*; then
  echo "❌ FAIL: Sitemap not configured"
  ISSUES=$((ISSUES+1))
else
  echo "✅ Sitemap configured"
fi

# Robots.txt
if [ ! -f "public/robots.txt" ]; then
  echo "❌ FAIL: Missing robots.txt"
  ISSUES=$((ISSUES+1))
else
  echo "✅ robots.txt exists"
fi

# Schema markup
if ! grep -rq "application/ld+json" src/; then
  echo "⚠️ WARN: No schema markup found"
fi

# Canonical URLs
if ! grep -rq "canonical" src/; then
  echo "⚠️ WARN: No canonical URLs found"
fi

# ============================================
# ANALYTICS / GTM
# ============================================
echo ""
echo "=== Analytics ==="

# GTM or GA
if grep -rq "GTM-\|googletagmanager\|gtag\|dataLayer" src/; then
  echo "✅ Analytics found"
else
  echo "⚠️ WARN: No GTM/GA integration found"
fi

# ============================================
# ACCESSIBILITY
# ============================================
echo ""
echo "=== Accessibility ==="

# Skip link
if ! grep -rq "skip.*content\|skip.*main\|skip-link" src/; then
  echo "❌ FAIL: Missing skip link"
  ISSUES=$((ISSUES+1))
else
  echo "✅ Skip link found"
fi

# Focus visible
if ! grep -rq "focus-visible\|:focus" src/; then
  echo "⚠️ WARN: Check focus styles"
fi

# Reduced motion
if ! grep -rq "prefers-reduced-motion" src/; then
  echo "⚠️ WARN: No reduced motion support"
fi

# ============================================
# SUMMARY
# ============================================
echo ""
echo "================================"
if [ $ISSUES -gt 0 ]; then
  echo "❌ COMPLIANCE CHECK FAILED: $ISSUES issues"
  exit 1
else
  echo "✅ COMPLIANCE CHECK PASSED"
fi
```

## Manual Compliance Checklist

### astro-forms
- [ ] Turnstile integrated and working
- [ ] Honeypot field present and hidden
- [ ] Zod schemas for all form data
- [ ] Server-side validation (never trust client)
- [ ] Rate limiting per IP
- [ ] Error messages sanitized
- [ ] GDPR consent checkbox (if marketing)

### astro-security
- [ ] All security headers in _headers
- [ ] CSP configured and tested
- [ ] No secrets in source code
- [ ] .env in .gitignore
- [ ] .env.example exists
- [ ] Staging protected (noindex + auth)
- [ ] Error pages don't leak info

### astro-ux
- [ ] Section order matches spec
- [ ] Hero + USP above fold
- [ ] CTA only every 2nd viewport
- [ ] Desktop sticky CTA menu
- [ ] Mobile sticky bottom bar
- [ ] WhatsApp button (6s delay)
- [ ] Mobile menu with animation
- [ ] 5 smart details implemented
- [ ] Thank you page exists

### astro-images (memory rules)
- [ ] `<Picture />` for all important images
- [ ] AVIF → WebP → JPG fallback
- [ ] Hero: eager + fetchpriority="high"
- [ ] Below fold: lazy loading
- [ ] Aspect ratios set
- [ ] Alt text on all images

### Project SPEC.md
- [ ] All specified sections present
- [ ] Branding matches spec
- [ ] Copy matches approved content
- [ ] Contact info correct
- [ ] Service areas correct
- [ ] Pricing correct (if shown)

## Compliance Report Template

```markdown
# Skill Compliance Report

**Project:** [Name]
**Date:** [Date]
**Auditor:** [Name/Claude]

## Results

| Skill | Status | Issues |
|-------|--------|--------|
| astro-forms | ✅ PASS | 0 |
| astro-security | ⚠️ WARN | 1 minor |
| astro-ux | ✅ PASS | 0 |
| astro-images | ✅ PASS | 0 |
| SEO | ✅ PASS | 0 |
| Accessibility | ⚠️ WARN | 1 minor |

## Issues Found

### astro-security
- [ ] CSP too permissive (warn only)

### Accessibility  
- [ ] Skip link styling needs polish

## Recommendation

✅ Ready for release with minor fixes
```

## When Skills Conflict

Priority order:
1. Security (always wins)
2. Accessibility (legal requirement)
3. Performance (user experience)
4. SEO (business requirement)
5. UX preferences (can flex)

If conflict, document decision and rationale.
