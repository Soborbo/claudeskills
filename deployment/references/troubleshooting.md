# Deployment Troubleshooting

## Build Fails

```bash
# Always check locally first
npm run build
```

| Issue | Fix |
|-------|-----|
| Node version mismatch | Add `"engines": {"node": ">=18"}` to package.json |
| Missing dependencies | Run `npm ci` (not `npm install`) |
| TypeScript errors | Run `npx astro check` and fix |
| Import errors | Check case sensitivity (Linux is strict) |

## Environment Variables Not Working

| Check | Solution |
|-------|----------|
| Not in dashboard | Add in Cloudflare Pages settings |
| Wrong environment | Separate Production/Preview values |
| Missing PUBLIC_ prefix | Client-side vars need `PUBLIC_` prefix |
| Cache | Trigger new deployment after adding |

```bash
# Verify env vars are set
npx wrangler pages deployment list --project-name=[name]
```

## Custom Domain Not Working

| Issue | Fix |
|-------|-----|
| DNS not propagated | Wait 24-48h, check with `dig domain.com` |
| Wrong CNAME | Must point to `[project].pages.dev` |
| Proxy disabled | Enable orange cloud in Cloudflare DNS |
| SSL pending | Wait for certificate provisioning (~15 min) |

## Forms Not Sending

| Check | Solution |
|-------|----------|
| Turnstile key wrong | Different keys for prod/preview |
| CORS error | Check `PUBLIC_SITE_URL` matches domain |
| Email API error | Verify `RESEND_API_KEY` in dashboard |
| Rate limited | Check Cloudflare KV or rate limit logs |

## 404 on Routes

| Issue | Fix |
|-------|-----|
| SSR routes | Enable `output: 'server'` or `'hybrid'` |
| Trailing slashes | Configure in `astro.config.mjs` |
| Case mismatch | URLs are case-sensitive on Linux |

## Staging Indexed by Google

Emergency fix:

1. Add `noindex` meta tag immediately
2. Check robots.txt is correct
3. Request removal in Search Console
4. Enable Cloudflare Access

```html
<!-- Emergency noindex -->
<meta name="robots" content="noindex, nofollow" />
```

## Rollback Not Working

```bash
# List all deployments
npx wrangler pages deployment list --project-name=[name]

# Get deployment ID and rollback
npx wrangler pages deployment rollback --project-name=[name] [deployment-id]
```

If CLI fails, use Dashboard:
`Pages → Project → Deployments → [Previous] → Rollback to this deployment`
