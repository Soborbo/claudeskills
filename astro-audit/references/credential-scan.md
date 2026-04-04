# Credential & Secret Scanning

## BLOCK Level Check

Any credential in source code = **BLOCK RELEASE**

No exceptions. No "it's just for testing."

## Automated Scan Script

```bash
#!/bin/bash
# scripts/credential-scan.sh

echo "🔐 Scanning for credentials..."

FOUND=0

# Generic patterns
echo "Checking generic patterns..."
grep -rn "api[_-]?key\s*[:=]" src/ --include="*.ts" --include="*.js" --include="*.astro" && FOUND=1
grep -rn "secret\s*[:=]" src/ --include="*.ts" --include="*.js" --include="*.astro" && FOUND=1
grep -rn "password\s*[:=]" src/ --include="*.ts" --include="*.js" --include="*.astro" && FOUND=1
grep -rn "token\s*[:=]\s*['\"][a-zA-Z0-9]" src/ && FOUND=1

# Stripe
echo "Checking Stripe..."
grep -rn "sk_live_\|pk_live_\|sk_test_\|pk_test_" src/ && FOUND=1
grep -rn "rk_live_\|rk_test_" src/ && FOUND=1

# Cloudflare
echo "Checking Cloudflare..."
grep -rn "TURNSTILE_SECRET" src/ --include="*.ts" --include="*.astro" && FOUND=1

# Resend / Email
echo "Checking email services..."
grep -rn "re_[a-zA-Z0-9]" src/ && FOUND=1
grep -rn "RESEND_API" src/ --include="*.ts" && FOUND=1

# Google
echo "Checking Google..."
grep -rn "AIza[a-zA-Z0-9_-]" src/ && FOUND=1
grep -rn "GOOGLE_SHEETS_ID\|GOOGLE_API" src/ --include="*.ts" && FOUND=1

# GitHub
echo "Checking GitHub..."
grep -rn "ghp_[a-zA-Z0-9]\|gho_[a-zA-Z0-9]\|github_pat_" src/ && FOUND=1

# OpenAI
echo "Checking OpenAI..."
grep -rn "sk-[a-zA-Z0-9]{20,}" src/ && FOUND=1

# AWS
echo "Checking AWS..."
grep -rn "AKIA[A-Z0-9]{16}" src/ && FOUND=1
grep -rn "aws_secret\|aws_access" src/ && FOUND=1

# Slack
echo "Checking Slack..."
grep -rn "xox[baprs]-[a-zA-Z0-9]" src/ && FOUND=1

# Database URLs
echo "Checking database URLs..."
grep -rn "postgres://\|mysql://\|mongodb://" src/ | grep -v ".env" && FOUND=1
grep -rn "://[^:]+:[^@]+@" src/ && FOUND=1

# Private keys
echo "Checking private keys..."
grep -rn "BEGIN RSA PRIVATE\|BEGIN OPENSSH\|BEGIN PGP PRIVATE" src/ && FOUND=1

# .env files in git
echo "Checking .env in git..."
git ls-files | grep -E "^\.env$|\.env\.local$|\.env\.production$" && FOUND=1

# Hardcoded in config files
echo "Checking config files..."
grep -rn "secret\|key\|password\|token" astro.config.* tsconfig.* package.json | grep -v "\"@\|version\|type" && echo "⚠️ Check manually"

if [ $FOUND -eq 1 ]; then
  echo ""
  echo "❌ CREDENTIALS FOUND - RELEASE BLOCKED"
  exit 1
else
  echo "✅ No credentials found"
fi
```

## Patterns Reference

### High Risk (BLOCK)

| Service | Pattern | Example |
|---------|---------|---------|
| Stripe Live | `sk_live_*` | sk_live_abc123... |
| Stripe Test | `sk_test_*` | sk_test_abc123... |
| OpenAI | `sk-[a-zA-Z0-9]{20,}` | sk-abc123... |
| GitHub PAT | `ghp_*`, `gho_*` | ghp_abc123... |
| AWS Access | `AKIA[A-Z0-9]{16}` | AKIAIOSFODNN7EXAMPLE |
| Google API | `AIza*` | AIzaSyA... |
| Slack | `xox[baprs]-*` | xoxb-abc123... |

### Medium Risk (WARN)

| Pattern | Reason |
|---------|--------|
| `localhost:*` | Dev URLs in production |
| `http://` (not https) | Insecure URLs |
| `console.log(data)` | May leak sensitive info |
| Hardcoded emails | May expose internal emails |

## Allowed Patterns

These are OK in source:

```typescript
// ✅ OK - Using env vars
const key = import.meta.env.TURNSTILE_SECRET_KEY;

// ✅ OK - Public keys client-side
const publicKey = import.meta.env.PUBLIC_TURNSTILE_SITE_KEY;

// ✅ OK - Empty placeholders
const TURNSTILE_KEY = ''; // Set in .env

// ✅ OK - Example comments
// Example: sk_test_abc123 (not real)
```

## NOT Allowed

```typescript
// ❌ BLOCK - Hardcoded secret
const secret = 'sk_live_abc123xyz';

// ❌ BLOCK - In template literal
const url = `https://api.stripe.com?key=sk_live_abc123`;

// ❌ BLOCK - In JSON
const config = { apiKey: 'real_key_here' };

// ❌ BLOCK - Commented but real
// const oldKey = 'sk_live_abc123'; // TODO: remove

// ❌ BLOCK - Base64 encoded secrets
const encoded = 'c2tfbGl2ZV9hYmMxMjM='; // base64 of sk_live_abc123
```

## Pre-Commit Hook

Add to `.git/hooks/pre-commit`:

```bash
#!/bin/bash
# Prevent committing credentials

if git diff --cached --name-only | xargs grep -l "sk_live_\|AKIA\|ghp_" 2>/dev/null; then
  echo "❌ Potential credentials detected. Commit blocked."
  exit 1
fi
```

## CI Integration

```yaml
# .github/workflows/security.yml
- name: Credential Scan
  run: |
    if grep -rn "sk_live_\|pk_live_\|AKIA\|ghp_\|gho_" src/; then
      echo "Credentials found!"
      exit 1
    fi
```

## What To Do If Found

1. **DON'T** commit/push
2. **DO** remove immediately
3. **DO** rotate the compromised key
4. **DO** check git history: `git log -p | grep -i "sk_live"`
5. **DO** use `git filter-branch` or BFG if in history
6. **DO** move to `.env` file
7. **DO** add to `.env.example` (empty value only)

## Definition of Done

- [ ] Automated scan passes
- [ ] No secrets in source files
- [ ] No secrets in git history
- [ ] .env in .gitignore
- [ ] .env.example exists
- [ ] Pre-commit hook installed
