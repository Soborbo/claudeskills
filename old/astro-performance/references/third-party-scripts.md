# Third-Party Scripts

## Load GTM Properly

```html
<!-- After user interaction or consent -->
<script>
  window.addEventListener('load', () => {
    setTimeout(() => {
      const script = document.createElement('script');
      script.src = 'https://www.googletagmanager.com/gtm.js?id=GTM-XXXX';
      script.async = true;
      document.head.appendChild(script);
    }, 2000); // Delay non-critical scripts
  });
</script>
```

## Facade Pattern for Embeds

```astro
<!-- YouTube: Load iframe only on click -->
<div class="video-facade" data-video-id="xxx">
  <img src="/poster.webp" alt="Video thumbnail">
  <button>Play</button>
</div>
```

## Script Loading Attributes

| Attribute | Use Case |
|-----------|----------|
| `async` | Independent scripts (analytics) |
| `defer` | Scripts that need DOM |
| `type="module"` | ES modules |
