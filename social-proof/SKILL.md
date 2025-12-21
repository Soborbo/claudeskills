---
name: social-proof
description: Social proof patterns for lead generation sites. Testimonials, reviews, trust badges, stats, logos. Use for building trust and credibility.
---

# Social Proof Skill

## Purpose

Provides social proof patterns that build trust and increase conversions. Critical for lead generation.

## Core Rules

1. **Specific over vague** — "2,347 moves" not "thousands of moves"
2. **Named over anonymous** — "Sarah M., Clifton" not "Happy Customer"
3. **Recent over old** — Show dates, keep testimonials fresh
4. **Verified over claimed** — Google reviews > self-reported
5. **Strategic placement** — Trust before conversion points

## Testimonial Card

```astro
---
interface Props {
  quote: string;
  name: string;
  location: string;
  rating: number;
  image?: string;
  date?: string;
}

const { quote, name, location, rating, image, date } = Astro.props;
---

<blockquote class="bg-white rounded-xl p-6 shadow-card">
  <!-- Stars -->
  <div class="flex gap-1 mb-3" aria-label={`${rating} out of 5 stars`}>
    {[1, 2, 3, 4, 5].map((star) => (
      <svg
        class={`w-5 h-5 ${star <= rating ? 'text-yellow-400' : 'text-gray-200'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
      </svg>
    ))}
  </div>

  <!-- Quote -->
  <p class="text-gray-700 mb-4">"{quote}"</p>

  <!-- Attribution -->
  <footer class="flex items-center gap-3">
    {image ? (
      <img
        src={image}
        alt=""
        class="w-12 h-12 rounded-full object-cover"
        width="48"
        height="48"
      />
    ) : (
      <div class="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary font-semibold">
        {name.charAt(0)}
      </div>
    )}
    <div>
      <cite class="not-italic font-semibold text-gray-900">{name}</cite>
      <p class="text-sm text-gray-500">{location}</p>
    </div>
    {date && <time class="ml-auto text-xs text-gray-400">{date}</time>}
  </footer>
</blockquote>
```

## Stats Section

```astro
---
const stats = [
  { value: '2,500+', label: 'Moves Completed' },
  { value: '4.9', label: 'Google Rating', suffix: '/5' },
  { value: '15+', label: 'Years Experience' },
  { value: '0', label: 'Damage Claims' },
];
---

<section class="bg-primary-900 text-white py-12">
  <div class="container mx-auto px-4">
    <div class="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
      {stats.map((stat) => (
        <div>
          <p class="text-4xl md:text-5xl font-bold mb-2">
            {stat.value}{stat.suffix && <span class="text-2xl">{stat.suffix}</span>}
          </p>
          <p class="text-primary-200">{stat.label}</p>
        </div>
      ))}
    </div>
  </div>
</section>
```

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

## Video Testimonial

```astro
---
interface Props {
  videoId: string;
  poster: ImageMetadata;
  name: string;
  title: string;
}

const { videoId, poster, name, title } = Astro.props;
---

<div class="bg-white rounded-xl overflow-hidden shadow-card">
  <div class="aspect-video relative">
    <!-- Use YouTube facade skill -->
    <VideoFacade videoId={videoId} poster={poster} title={`${name} testimonial`} />
  </div>
  <div class="p-4">
    <p class="font-semibold">{name}</p>
    <p class="text-sm text-gray-500">{title}</p>
  </div>
</div>
```

## Review Schema

```astro
---
const aggregateRating = {
  "@type": "AggregateRating",
  "ratingValue": "4.9",
  "reviewCount": "127",
  "bestRating": "5",
  "worstRating": "1"
};
---

<script type="application/ld+json" set:html={JSON.stringify({
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Bristol Removals",
  "aggregateRating": aggregateRating
})} />
```

## Placement Strategy

| Location | What to Show |
|----------|--------------|
| Hero | Google rating badge, review count |
| After hero | Client logos or trust badges |
| Before form | 1-2 short testimonials |
| Mid-page | Stats section |
| After features | Full testimonial carousel |
| Footer | Trust badges |

## Testimonial Guidelines

### What Makes Good Testimonial

✅ Specific outcome: "Saved us £500 compared to quotes"
✅ Named person: "Sarah Mitchell, Clifton"
✅ Addresses objection: "I was worried about damage, but..."
✅ Recent: Within last 12 months
✅ Verifiable: Links to Google review

### What to Avoid

❌ Vague praise: "Great service!"
❌ Anonymous: "A happy customer"
❌ Too long: Over 3 sentences
❌ Fake-sounding: Overly perfect language
❌ Old: Dated 3+ years ago

## Forbidden

- ❌ Fake testimonials
- ❌ Stock photos for testimonial avatars
- ❌ Unverifiable claims
- ❌ Reviews without source
- ❌ Outdated stats
- ❌ Trust badges you don't have

## Definition of Done

- [ ] Google review badge in hero
- [ ] Stats section with real numbers
- [ ] 3+ testimonials with names/locations
- [ ] Trust badges if applicable
- [ ] Review schema markup
- [ ] All claims verifiable
- [ ] Testimonials recent (<12 months)
