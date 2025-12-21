# Conflict Resolution Matrix

When rules conflict, use this matrix to determine the winner.

## Priority Tiers

| Tier | Category | Always Beats |
|------|----------|--------------|
| 1 | **Safety/Legal** | Everything |
| 2 | **Accessibility** | Tiers 3-6 |
| 3 | **Performance** | Tiers 4-6 |
| 4 | **SEO** | Tiers 5-6 |
| 5 | **Conversion/UX** | Tier 6 |
| 6 | **Code Elegance** | Nothing |

## Performance vs Design/Animation

| Conflict | Winner | Rationale |
|----------|--------|-----------|
| Fancy scroll animations vs LCP | Performance | Disable animations until after LCP |
| Parallax effects vs CLS | Performance | No parallax, or fixed positioning only |
| Video autoplay vs page load | Performance | Facade pattern, click to load |
| Custom fonts vs FOUT | Performance | `font-display: swap` + system fallback |
| Carousel vs performance | Performance | Static hero or single image |
| Animation library vs bundle size | Performance | CSS animations or minimal JS |

## Performance vs Third-Party

| Conflict | Winner | Rationale |
|----------|--------|-----------|
| Live chat widget vs LCP | Performance | Load after interaction or delay 5s |
| Google Maps embed vs performance | Performance | Static map image, click to load |
| Social media embeds vs performance | Performance | Screenshot + link, no embed |
| Analytics vs page speed | Performance | GTM with minimal config |
| Third-party fonts vs speed | Performance | Self-host fonts always |

## Accessibility vs Conversion

| Conflict | Winner | Rationale |
|----------|--------|-----------|
| Exit popup vs keyboard users | Accessibility | Must be dismissible via Escape |
| Auto-rotating carousel vs screen readers | Accessibility | No autoplay, pause controls |
| Low contrast "subtle" design vs readability | Accessibility | Minimum 4.5:1 contrast |
| Floating CTA covering content vs usability | Accessibility | Must not block content on mobile |
| CAPTCHA vs cognitive accessibility | Accessibility | Use invisible reCAPTCHA/Turnstile |
| Video with no captions vs deaf users | Accessibility | Always provide captions/transcript |
| Infinite scroll vs keyboard navigation | Accessibility | Pagination or "Load more" button |

## SEO vs Design

| Conflict | Winner | Rationale |
|----------|--------|-----------|
| Beautiful image-only hero vs H1 | SEO | H1 text required, can overlay image |
| JavaScript-rendered content vs crawlers | SEO | SSR/SSG, no client-only content |
| Single-page app vs indexability | SEO | Multi-page with proper routing |
| Hidden text for design vs SEO | SEO | Use sr-only class, not `display:none` |
| Infinite scroll vs pagination | SEO | Pagination for indexability |
| Lazy-loaded content vs first paint | SEO | Critical content in HTML |

## Security vs Convenience

| Conflict | Winner | Rationale |
|----------|--------|-----------|
| Autofill passwords vs security | Security | Allow autofill, improves security |
| Storing user data vs privacy | Security | Minimal data, clear consent |
| Third-party scripts vs CSP | Security | Strict CSP, whitelist only |
| Easy admin access vs protection | Security | Strong auth, no shortcuts |
| Inline scripts vs CSP | Security | External scripts with nonce/hash |

## Forms: Progressive Disclosure vs User Request

| Conflict | Winner | Rationale |
|----------|--------|-----------|
| "I want all fields on one page" vs UX | Progressive | Explain cognitive load, max 4 fields/step |
| Email first vs privacy | Privacy | Email in final step only |
| Phone required vs user preference | User Choice | Phone optional unless callback |
| "Skip validation" vs data quality | Data Quality | Always validate, explain why |

## Content vs Performance

| Conflict | Winner | Rationale |
|----------|--------|-----------|
| Large hero image vs LCP | Performance | Optimize, max 200KB hero |
| Many images on page vs load time | Performance | Lazy load below fold |
| Video background vs mobile | Performance | Static image on mobile |
| High-res gallery vs speed | Performance | Thumbnails + lightbox |

## Resolution Process

When facing a conflict not listed:

1. Identify which tiers are involved
2. Higher tier wins (lower number)
3. If same tier: prefer user safety
4. If still unclear: ASK, don't assume
5. Document decision in code comments

## Veto Loop Arbitration

When guardian agents issue vetoes:

1. **Single Veto**: Original agent must address all issues before resubmitting
2. **Second Veto on Same Issue**: Escalate to 04-orchestrator for final decision
3. **Guardian vs Guardian Conflict**: Orchestrator decides using this priority matrix
4. **Orchestrator Override**: Requires documented reason in _PROJECT-STATE.md

**Veto priority (when guardians conflict):**
1. 09-security (safety-critical)
2. 03-performance-guardian (user experience)
3. 10-consistency-guardian (maintainability)
4. 07-search-intent-guard (business value)
5. 17-typescript-quality (code quality)
6. 11-qa (final validation)

## Override Conditions

Client can override Tier 3-6 decisions with explicit written approval.

Client can NEVER override:
- Tier 1 (Safety/Legal)
- Tier 2 (Accessibility) — legal requirement
- GDPR/Privacy requirements
- Security fundamentals
