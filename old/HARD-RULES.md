# Hard Rules (Non-Negotiable)

These rules OVERRIDE all skill-specific rules. If conflict exists, HARD-RULES wins.

## Stop Conditions

Claude MUST stop and ask if:
- [ ] Required information is missing (no assumptions)
- [ ] Contradictory requirements detected
- [ ] Request conflicts with HARD-RULES
- [ ] Security implications unclear
- [ ] Breaking change to existing functionality

## Performance (NEVER violate)

| Metric | Requirement | FAIL Threshold |
|--------|-------------|----------------|
| PageSpeed Mobile | ≥ 90 | < 85 |
| PageSpeed Desktop | ≥ 95 | < 90 |
| LCP | < 2.5s | > 4.0s |
| CLS | < 0.1 | > 0.25 |
| INP | < 200ms | > 500ms |
| Total JS | < 100KB | > 150KB |
| Total CSS | < 50KB | > 75KB |

### Performance Mandates
- No `client:load` (use `client:visible` or `client:idle` instead)
- No Google Fonts API (self-host only)
- No unoptimized images (always use Picture component)
- No third-party scripts blocking render

## Security (NEVER violate)

- ❌ No secrets in client-side code
- ❌ No secrets in git repository
- ❌ No hardcoded API keys
- ✅ All forms MUST have: Turnstile + honeypot + rate-limit
- ✅ GDPR consent required BEFORE any tracking
- ✅ CSP headers on all pages
- ✅ HTTPS only (no mixed content)

### Environment Variables
```
# NEVER commit these - .env.example only
SECRET_*
API_KEY_*
TURNSTILE_SECRET_KEY
RESEND_API_KEY
```

## Accessibility (NEVER violate)

| Requirement | Standard |
|-------------|----------|
| Lighthouse a11y score | ≥ 90 |
| Color contrast | ≥ 4.5:1 (text), ≥ 3:1 (large) |
| Touch targets | ≥ 44px × 44px |
| Focus visible | Always visible |
| Keyboard navigation | Fully functional |

### Accessibility Mandates
- All images MUST have alt text
- All forms MUST have labels
- Skip-to-content link on every page
- No autoplay audio/video
- Respect `prefers-reduced-motion`

## Code Quality (NEVER violate)

### TypeScript
- ✅ Strict mode enabled
- ❌ No `any` types
- ❌ No `@ts-ignore` without issue link
- ❌ No generic variable names: `data`, `result`, `item`, `temp`, `info`, `response`
- ✅ Explicit return types on functions

### Astro
- ❌ No `client:load` (use `client:visible` or `client:idle`)
- ❌ No inline `<script>` with logic (use external files)
- ✅ All components typed with Props interface
- ✅ Use content collections for structured data

### Styling
- ✅ Tailwind only (no custom CSS files)
- ❌ No `!important`
- ❌ No magic numbers (use design tokens)
- ✅ Mobile-first responsive design

## Content (NEVER violate)

- ❌ No hardcoded text (use i18n dictionaries)
- ❌ No Lorem Ipsum in production
- ❌ No placeholder images in production
- ✅ All pages have unique title + meta description
- ✅ All pages have canonical URL

## Forms (NEVER violate)

- ❌ No email field on step 1 of multi-step forms
- ❌ No form on thank-you page
- ❌ No submit without loading state
- ✅ Inline validation on blur
- ✅ Clear error messages
- ✅ Success redirect to thank-you page

## Authority Hierarchy

When rules conflict, follow this order:

1. **HARD-RULES.md** (this file) — Non-negotiable
2. **CLAUDE.md** (project-specific) — Project constraints
3. **SKILL.md files** — Implementation patterns
4. **User chat messages** — Clarifications
5. **Assumptions** — FORBIDDEN (ask instead)

## Violation Response

If a HARD-RULE would be violated:

1. STOP immediately
2. Explain which rule would be violated
3. Propose compliant alternatives
4. Wait for user decision

Never silently violate a HARD-RULE.
