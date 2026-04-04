# Trust Badge Components

## Google Review Badge

```astro
---
interface Props {
  rating: number;
  reviewCount: number;
  url?: string;
}

const { rating, reviewCount, url } = Astro.props;
---

<a
  href={url || '#reviews'}
  class="inline-flex items-center gap-3 bg-white rounded-lg px-4 py-3 shadow-sm border hover:shadow-md transition-shadow"
>
  <img src="/google-g.svg" alt="Google" class="w-8 h-8" width="32" height="32">
  <div>
    <div class="flex items-center gap-1">
      <span class="font-bold text-lg">{rating}</span>
      <div class="flex" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            class={`w-4 h-4 ${star <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-200'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
          </svg>
        ))}
      </div>
    </div>
    <p class="text-sm text-gray-500">{reviewCount} Google Reviews</p>
  </div>
</a>
```

## Trust Badges Row

```astro
---
const badges = [
  { src: '/badges/which-trusted.svg', alt: 'Which? Trusted Trader' },
  { src: '/badges/checkatrade.svg', alt: 'Checkatrade Approved' },
  { src: '/badges/bar.svg', alt: 'British Association of Removers' },
  { src: '/badges/insured.svg', alt: 'Fully Insured' },
];
---

<div class="flex flex-wrap justify-center items-center gap-8 py-8">
  {badges.map((badge) => (
    <img
      src={badge.src}
      alt={badge.alt}
      class="h-12 md:h-16 grayscale hover:grayscale-0 transition-all"
      width="auto"
      height="64"
    />
  ))}
</div>
```

## Client Logos

```astro
---
const clients = [
  { src: '/clients/bbc.svg', alt: 'BBC' },
  { src: '/clients/nhs.svg', alt: 'NHS' },
  { src: '/clients/university.svg', alt: 'University of Bristol' },
  { src: '/clients/council.svg', alt: 'Bristol City Council' },
];
---

<section class="py-12 bg-gray-50">
  <div class="container mx-auto px-4">
    <p class="text-center text-gray-500 mb-8">Trusted by leading organisations</p>
    <div class="flex flex-wrap justify-center items-center gap-12">
      {clients.map((client) => (
        <img
          src={client.src}
          alt={client.alt}
          class="h-8 md:h-10 opacity-60 hover:opacity-100 transition-opacity"
          width="auto"
          height="40"
        />
      ))}
    </div>
  </div>
</section>
```
