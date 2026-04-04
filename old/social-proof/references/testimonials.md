# Testimonial Components

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
