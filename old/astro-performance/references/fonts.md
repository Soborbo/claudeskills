# Font Loading

## Self-Host Fonts

```astro
---
// In BaseLayout.astro
---
<link rel="preconnect" href="/fonts" crossorigin>
<link
  rel="preload"
  as="font"
  type="font/woff2"
  href="/fonts/inter-var.woff2"
  crossorigin
>
```

## Subset Fonts

```bash
# Only include characters you need
npx glyphhanger --whitelist="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,!?@£$%&()+-=:;'\"" --subset=Inter.ttf
```

## Variable Fonts

Use variable fonts instead of multiple weights:
- `Inter-var.woff2` instead of `Inter-400.woff2` + `Inter-700.woff2`
