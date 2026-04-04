---
name: astro-audit
description: Full code audit for Astro lead generation projects. Build, deps, performance, security, a11y, SEO, browser compat, form testing. Run before every deploy.
---

# Astro Audit Skill

Production readiness audit.

## Core Rules (BLOCK)

| Check | Threshold |
|-------|-----------|
| Build/TypeScript fails | Any error |
| Lighthouse Performance | < 90 |
| Lighthouse Accessibility | < 95 |
| npm audit high/critical | Any |
| Credentials in source | Any match |
| .env in git | Exists |

## Core Rules (WARN)

| Check | Threshold |
|-------|-----------|
| Bundle JS | > 100kb |
| Unused dependencies | Any |
| console.log in code | Any |

## Audit Sequence

```bash
npx astro check           # TypeScript
npm audit --audit-level=high  # Security
npx depcheck              # Unused deps
npx astro build           # Build
# Then: Lighthouse, Browser tests, Form tests
```

Run `scripts/audit.sh` for automated checks.

## Browser Compatibility (Required)

| Platform | Test |
|----------|------|
| Desktop | Chrome, Firefox, Safari, Edge |
| iOS | Safari, Chrome (SE, 14, 15 Pro Max) |
| Android | Chrome, Samsung Internet |

See [references/browser-tests.md](references/browser-tests.md).

## Form Testing (10 Scenarios)

| # | Test |
|---|------|
| 1 | Valid submission → success + email |
| 2 | Empty fields → validation errors |
| 3 | Invalid email → error |
| 4 | Invalid phone → error |
| 5 | XSS `<script>` → sanitized |
| 6 | SQL injection → no error |
| 7 | Honeypot filled → silent reject |
| 8 | No Turnstile → reject |
| 9 | 5x rapid submit → rate limited |
| 10 | Mobile keyboard → works |

See [references/form-tests.md](references/form-tests.md).

## Credential Scan (BLOCK)

```bash
grep -rn "sk_live\|pk_live\|api_key\|secret" src/
git ls-files | grep "\.env$"
```

**ANY match = BLOCK RELEASE**

See [references/credential-scan.md](references/credential-scan.md).

## Skill Compliance

Verify against all active skills:
- astro-forms (Turnstile, honeypot, Zod)
- astro-security (headers, CSP, rate limit)
- astro-ux (sections, CTAs, mobile bar)
- Project SPEC.md

See [references/skill-compliance.md](references/skill-compliance.md).

## Definition of Done

**BLOCK (must fix):**
- [ ] `astro check` passes
- [ ] `astro build` succeeds
- [ ] `npm audit` clean
- [ ] No credentials in code
- [ ] .env not in git
- [ ] Lighthouse 90+ all categories
- [ ] All 10 form tests pass
- [ ] Browser compatibility verified

**Quality:**
- [ ] Bundle < 100kb JS
- [ ] No console.logs
- [ ] Skill compliance verified
- [ ] Mobile tested real device

## Automated Script

```bash
#!/bin/bash
# scripts/audit.sh
set -e

echo "🔍 Audit..."
npx astro check
npm audit --audit-level=high

# Credential scan
if grep -rn "sk_live\|pk_live" src/ 2>/dev/null; then
  echo "❌ BLOCK: Credentials found"; exit 1
fi
if git ls-files | grep -qE "^\.env$"; then
  echo "❌ BLOCK: .env in git"; exit 1
fi

npx astro build

JS=$(find dist -name "*.js" -exec cat {} + 2>/dev/null | wc -c)
[ $JS -gt 102400 ] && echo "⚠️ JS > 100kb"

echo "✅ Auto-audit done. Run browser + form tests manually."
```

## References

- [browser-tests.md](references/browser-tests.md) — Cross-browser matrix
- [form-tests.md](references/form-tests.md) — 10-scenario form testing
- [credential-scan.md](references/credential-scan.md) — Secret patterns
- [skill-compliance.md](references/skill-compliance.md) — Skill verification
- [seo-checks.md](references/seo-checks.md) — SEO audit
- [performance.md](references/performance.md) — Core Web Vitals
- [a11y-checks.md](references/a11y-checks.md) — Accessibility
