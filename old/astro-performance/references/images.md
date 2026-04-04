# Image Optimization

## Format Priority

1. AVIF (best compression)
2. WebP (broad support)
3. JPEG/PNG (fallback)

## Responsive Images

```astro
<Picture
  src={image}
  widths={[400, 800, 1200, 1600]}
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
  formats={['avif', 'webp']}
/>
```
