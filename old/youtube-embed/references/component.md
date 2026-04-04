# VideoFacade Component

```astro
---
import { Picture } from 'astro:assets';
import type { ImageMetadata } from 'astro';

interface Props {
  videoId: string;
  title: string;
  poster: ImageMetadata;
  class?: string;
  priority?: boolean;
}

const { videoId, title, poster, class: className, priority = false } = Astro.props;
---

<div
  class:list={["video-facade aspect-[16/9] relative cursor-pointer group", className]}
  data-video-id={videoId}
  data-video-title={title}
  role="button"
  tabindex="0"
  aria-label={`Play video: ${title}`}
>
  <Picture
    src={poster}
    alt={title}
    formats={['avif', 'webp']}
    fallbackFormat="jpg"
    widths={[480, 640, 800, 1280]}
    sizes="(max-width: 800px) 100vw, 800px"
    loading={priority ? "eager" : "lazy"}
    decoding={priority ? "sync" : "async"}
    class="absolute inset-0 w-full h-full object-cover"
  />

  <div class="absolute inset-0 flex items-center justify-center">
    <div class="w-16 h-16 md:w-20 md:h-20 bg-red-600 rounded-full flex items-center justify-center group-hover:bg-red-700 transition-colors shadow-lg">
      <svg class="w-6 h-6 md:w-8 md:h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
        <path d="M8 5v14l11-7z"/>
      </svg>
    </div>
  </div>
</div>

<script>
  function initVideoFacades() {
    document.querySelectorAll('.video-facade').forEach(facade => {
      if (facade.dataset.initialized) return;
      facade.dataset.initialized = 'true';

      let played = false;

      const handler = () => {
        if (played) return;
        played = true;

        const videoId = facade.dataset.videoId;
        const title = facade.dataset.videoTitle;

        // GA4 Event
        if (window.dataLayer) {
          window.dataLayer.push({
            event: 'video_play',
            video_id: videoId,
            video_title: title
          });
        }

        // Replace with iframe
        const iframe = document.createElement('iframe');
        iframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
        iframe.title = title;
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        iframe.allowFullscreen = true;
        iframe.className = 'absolute inset-0 w-full h-full';

        facade.replaceChildren(iframe);
      };

      facade.addEventListener('click', handler);
      facade.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handler();
        }
      });
    });
  }

  initVideoFacades();
  document.addEventListener('astro:page-load', initVideoFacades);
</script>
```

## Usage

```astro
---
import VideoFacade from '@/components/VideoFacade.astro';
import poster from '@/assets/videos/intro.jpg';
---

<VideoFacade
  videoId="dQw4w9WgXcQ"
  title="Company Introduction Video"
  poster={poster}
/>
```

## GA4 Event

| Event | Parameters |
|-------|------------|
| `video_play` | `video_id`, `video_title` |

## Notes

- Autoplay on mobile not guaranteed (iOS restriction)
- `autoplay=1` is best effort
