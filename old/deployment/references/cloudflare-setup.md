# Cloudflare Pages Setup

## Prerequisites

- Cloudflare account
- GitHub repository connected
- Domain configured in Cloudflare

## Setup Steps

### 1. Connect Repository

1. Go to Cloudflare Dashboard → Pages
2. Create a project → Connect to Git
3. Select repository
4. Configure build settings:

```yaml
Framework preset: Astro
Build command: npm run build
Build output directory: dist
Root directory: /
```

### 2. Environment Variables

Set in Cloudflare Pages → Settings → Environment variables:

```env
NODE_VERSION=20
# Add project-specific variables
```

### 3. Custom Domain

1. Pages → Custom domains
2. Add domain
3. Cloudflare auto-configures DNS if domain is on Cloudflare

### 4. Preview Deployments

- Every push to non-production branch creates preview
- Preview URL: `<commit>.<project>.pages.dev`
- Share with clients for review

## Build Settings

| Setting | Value |
|---------|-------|
| Framework | Astro |
| Build command | `npm run build` |
| Output directory | `dist` |
| Node version | 20 |

## Troubleshooting

See [troubleshooting.md](troubleshooting.md) for common issues.
