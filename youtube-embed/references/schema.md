# VideoObject Schema

Add this markup to pages with embedded videos for rich snippets.

```astro
---
const { videoId, title, description, uploadDate, posterUrl } = Astro.props;
---

<script type="application/ld+json" set:html={JSON.stringify({
  "@context": "https://schema.org",
  "@type": "VideoObject",
  "name": title,
  "description": description,
  "thumbnailUrl": `${Astro.site}${posterUrl}`,
  "uploadDate": uploadDate,
  "contentUrl": `https://www.youtube.com/watch?v=${videoId}`,
  "embedUrl": `https://www.youtube-nocookie.com/embed/${videoId}`
})} />
```

## Required Fields

| Field | Description |
|-------|-------------|
| `name` | Video title |
| `thumbnailUrl` | Absolute URL to poster image |
| `uploadDate` | ISO 8601 date format |

## Optional Fields

| Field | Description |
|-------|-------------|
| `description` | Video description |
| `duration` | ISO 8601 duration (e.g., `PT5M30S`) |
| `contentUrl` | Direct video URL |
| `embedUrl` | Embed URL |
