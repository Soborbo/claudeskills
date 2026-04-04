# Anti-Patterns (What NOT to Do)

## Performance Anti-Patterns

| ❌ Don't | ✅ Do Instead |
|----------|---------------|
| `client:load` on everything | Use `client:visible` or `client:idle` |
| Google Fonts API | Self-host fonts with subset |
| Unoptimized images | Always use Picture component with AVIF/WebP |
| Inline SVG for photos | SVG only for icons/logos |
| Large hero images without srcset | Responsive widths with sizes attribute |
| `fetchpriority="high"` on multiple images | Only on hero image |
| Loading all JS upfront | Dynamic imports for non-critical code |
| Third-party scripts in `<head>` | Load async/defer or via GTM |

## Form Anti-Patterns

| ❌ Don't | ✅ Do Instead |
|----------|---------------|
| Email field on step 1 | Personal data only in final step |
| No honeypot field | Always add hidden spam trap |
| `alert()` for errors | Inline validation messages |
| Form on thank-you page | Clean thank-you, no re-submission risk |
| Validation only on submit | Validate on blur, show errors immediately |
| Generic error messages | Specific, actionable error text |
| No loading state on submit | Show spinner, disable button |
| Redirect without confirmation | Always show thank-you page |

## SEO Anti-Patterns

| ❌ Don't | ✅ Do Instead |
|----------|---------------|
| Same title on all pages | Unique, keyword-rich titles |
| Missing alt text | Descriptive alt on all images |
| Hardcoded hreflang | Generate from i18n config |
| Indexable staging URLs | `noindex` on non-production |
| Orphan pages (no internal links) | Every page linked from navigation or content |
| Duplicate meta descriptions | Unique description per page |
| Missing canonical URLs | Canonical on every page |
| Broken internal links | Regular link audits |

## Code Anti-Patterns

| ❌ Don't | ✅ Do Instead |
|----------|---------------|
| `any` type in TypeScript | Proper type definitions |
| `@ts-ignore` without reason | Fix the type issue or document why |
| Hardcoded translations | Use i18n dictionaries |
| Business logic in `<script>` | Move to `lib/` functions |
| UI component libraries (Chakra, MUI) | Custom Tailwind components |
| CSS files alongside Tailwind | Tailwind utilities only |
| Magic numbers in styles | Design tokens |
| Inline styles | Tailwind classes |

## Component Anti-Patterns

| ❌ Don't | ✅ Do Instead |
|----------|---------------|
| Props without TypeScript interface | Define Props interface |
| Components without slots | Use named slots for flexibility |
| Hardcoded content in components | Pass as props or slots |
| God components (500+ lines) | Split into smaller components |
| Duplicate component logic | Extract to shared utilities |
| Non-semantic HTML | Semantic elements (nav, main, article) |

## Accessibility Anti-Patterns

| ❌ Don't | ✅ Do Instead |
|----------|---------------|
| `div` with `onclick` | Use `button` element |
| Images without alt | Always provide alt text |
| Form inputs without labels | Associate label with input |
| Low contrast text | Minimum 4.5:1 ratio |
| Removing focus outlines | Style visible focus states |
| Autoplay video/audio | User-initiated playback only |
| Animations without motion preference | Check `prefers-reduced-motion` |
| Keyboard traps | Ensure escape routes |

## Security Anti-Patterns

| ❌ Don't | ✅ Do Instead |
|----------|---------------|
| Secrets in client code | Environment variables server-side only |
| API keys in git | `.env` files, never committed |
| Forms without CAPTCHA | Turnstile or reCAPTCHA |
| No rate limiting | Implement per-IP limits |
| Trusting client input | Validate server-side |
| Missing CSP headers | Configure Content-Security-Policy |
| HTTP resources on HTTPS | All resources over HTTPS |

## Analytics Anti-Patterns

| ❌ Don't | ✅ Do Instead |
|----------|---------------|
| Tracking before consent | Cookie banner gates all tracking |
| Lost UTM parameters | Preserve through session |
| No conversion tracking | Track form submissions as events |
| Pageview-only analytics | Track meaningful interactions |
| No error tracking | Log client-side errors |
| Debug mode in production | Remove console.logs |

## Deployment Anti-Patterns

| ❌ Don't | ✅ Do Instead |
|----------|---------------|
| Deploy without testing | Full QA checklist |
| No staging environment | Test on staging first |
| Friday deployments | Deploy early in the week |
| No rollback plan | Document rollback procedure |
| Manual deployments | CI/CD pipeline |
| No performance baseline | Lighthouse CI in pipeline |

## Content Anti-Patterns

| ❌ Don't | ✅ Do Instead |
|----------|---------------|
| Lorem Ipsum in production | Real content always |
| Placeholder images live | Final assets before launch |
| Outdated copyright year | Dynamic year |
| Missing legal pages | Privacy Policy, Terms required |
| Broken phone/email links | Test `tel:` and `mailto:` |
| Generic CTAs ("Click Here") | Action-specific CTAs |

## Architecture Anti-Patterns

| ❌ Don't | ✅ Do Instead |
|----------|---------------|
| Everything in `pages/` | Use components, layouts, lib |
| Repeated code across pages | Extract to components |
| No content collections | Use Astro content collections |
| Hardcoded data in templates | Move to data files or CMS |
| Monolithic CSS | Tailwind utilities |
| No design system | Define design tokens |
