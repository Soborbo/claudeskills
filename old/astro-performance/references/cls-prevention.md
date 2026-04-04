# CLS Prevention

## Always Set Dimensions

```astro
<!-- Images -->
<Picture
  src={image}
  width={800}
  height={600}
  class="aspect-[4/3]"
/>

<!-- Iframes -->
<iframe
  width="560"
  height="315"
  class="aspect-video"
></iframe>
```

## Reserve Space for Dynamic Content

```css
/* Skeleton for loading state */
.testimonial-skeleton {
  min-height: 200px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

## Font Display Swap

```css
@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter.woff2') format('woff2');
  font-display: swap; /* Prevents invisible text */
}
```

## Avoid Layout-Shifting Ads/Embeds

```html
<!-- Reserve space for third-party embeds -->
<div class="min-h-[250px]">
  <!-- Ad or embed loads here -->
</div>
```
