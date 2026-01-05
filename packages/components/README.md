# @leadgen/components

Astro component library for high-performance lead generation websites. Encapsulates best practices as reusable, type-safe components.

## Installation

```bash
# In your Astro project, add as a local package
# In package.json:
{
  "dependencies": {
    "@leadgen/components": "file:../claudeskills/packages/components"
  }
}
```

## Components

### Picture

Pattern-based responsive images. Replaces manual `widths`/`sizes` calculations with a single `pattern` prop.

#### Usage

```astro
---
import Picture from '@leadgen/components/Picture';
import heroImage from '../assets/hero.jpg';
import featureImage from '../assets/feature.jpg';
import teamMember from '../assets/team/john.jpg';
---

<!-- Full-bleed hero (LCP - only ONE per page) -->
<Picture src={heroImage} pattern="FULL" lcp alt="Hero banner" />

<!-- 50/50 split layout -->
<Picture src={featureImage} pattern="HALF" alt="Feature description" />

<!-- Team grid (4 columns) -->
<Picture src={teamMember} pattern="QUARTER" alt="John Smith, CEO" />

<!-- Above-fold but not LCP (2-3 images) -->
<Picture src={secondaryImage} pattern="HALF" aboveFold alt="Secondary" />
```

#### Patterns

| Pattern | Width | Use Case |
|---------|-------|----------|
| `FULL` | 100vw | Full-bleed hero banners |
| `TWO_THIRDS` | 66vw | Dominant side of 66/33 split |
| `LARGE` | 60vw | Dominant side of 60/40 split |
| `HALF` | 50vw | Split 50/50, checkerboard (default) |
| `SMALL` | 40vw | Text-dominant split (40/60) |
| `THIRD` | 33vw | 3-col grid, standing person |
| `QUARTER` | 25vw | 4-col team grid |
| `FIFTH` | 20vw | 5-col icons |
| `SIXTH` | 16vw | 6-col logos |

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `src` | `ImageMetadata` | required | Image from `/src/assets/` |
| `pattern` | `ImagePattern` | `'HALF'` | Rendered width pattern |
| `alt` | `string` | required | Alt text (use `""` for decorative) |
| `lcp` | `boolean` | `false` | LCP flag - only ONE per page |
| `aboveFold` | `boolean` | `false` | Eager load without fetchpriority |
| `quality` | `number` | `60` | Image quality (1-100) |
| `formats` | `array` | `['avif', 'webp']` | Output formats |
| `class` | `string` | - | CSS classes |

### FixedImage

For logos, avatars, and icons with fixed pixel dimensions.

#### Usage

```astro
---
import FixedImage from '@leadgen/components/FixedImage';
import logo from '../assets/logo.png';
import avatar from '../assets/avatar.jpg';
---

<!-- Logo at 200px -->
<FixedImage src={logo} width={200} alt="Company Logo" />

<!-- Avatar with 3x for high-DPI (icons >= 64px) -->
<FixedImage src={avatar} width={64} alt="User avatar" include3x />
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `src` | `ImageMetadata` | required | Image from `/src/assets/` |
| `width` | `number` | required | Display width in pixels |
| `height` | `number` | auto | Display height (auto from aspect ratio) |
| `alt` | `string` | required | Alt text |
| `include3x` | `boolean` | `false` | Add 3x for high-DPI |
| `quality1x` | `number` | `80` | Quality for 1x |
| `qualityHighDpi` | `number` | `60` | Quality for 2x/3x |
| `class` | `string` | - | CSS classes |
| `loading` | `'lazy' \| 'eager'` | `'lazy'` | Loading behavior |

### YouTubeFacade

Performance-optimized YouTube embeds. No YouTube scripts load until user clicks.

#### Usage

```astro
---
import YouTubeFacade from '@leadgen/components/YouTubeFacade';
import poster from '../assets/videos/intro.jpg';
---

<!-- Basic usage -->
<YouTubeFacade
  videoId="dQw4w9WgXcQ"
  title="Company Introduction"
  poster={poster}
/>

<!-- Above-fold video -->
<YouTubeFacade
  videoId="dQw4w9WgXcQ"
  title="Hero Video"
  poster={poster}
  priority
/>
```

#### Poster Images

Download from YouTube and store locally:
1. Try: `https://i.ytimg.com/vi/{VIDEO_ID}/maxresdefault.jpg`
2. Fallback: `https://i.ytimg.com/vi/{VIDEO_ID}/sddefault.jpg`
3. Save to: `src/assets/videos/{slug}.jpg`

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `videoId` | `string` | required | YouTube video ID |
| `title` | `string` | required | Video title for a11y & tracking |
| `poster` | `ImageMetadata` | required | Local poster image |
| `class` | `string` | - | CSS classes |
| `priority` | `boolean` | `false` | Eager load poster |
| `aspectRatio` | `'16/9' \| '4/3' \| '1/1'` | `'16/9'` | Video aspect ratio |

#### GA4 Event

Fires `video_play` event on click:
```javascript
{ event: 'video_play', video_id: '...', video_title: '...' }
```

#### Features

- Facade pattern (no YouTube until click)
- Privacy-enhanced (`youtube-nocookie.com`)
- Keyboard accessible (Enter/Space)
- GA4 tracking built-in
- Autoplay on click
- Hover effects

---

## Social Proof Components

### Testimonial

Testimonial card with rating, quote, and attribution.

```astro
---
import Testimonial from '@leadgen/components/Testimonial';
---

<Testimonial
  quote="The team was professional and efficient. Highly recommend!"
  name="Sarah Mitchell"
  location="Clifton, Bristol"
  rating={5}
  date="December 2024"
/>

<!-- Featured variant -->
<Testimonial
  quote="Best service we've ever used..."
  name="John Smith"
  location="Bath"
  rating={5}
  variant="featured"
/>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `quote` | `string` | required | Testimonial text |
| `name` | `string` | required | Customer name |
| `location` | `string` | required | Location for credibility |
| `rating` | `1-5` | required | Star rating |
| `image` | `ImageMetadata \| string` | - | Avatar (real photos only) |
| `date` | `string` | - | Date of testimonial |
| `variant` | `'card' \| 'minimal' \| 'featured'` | `'card'` | Visual variant |

### GoogleReviewBadge

Google rating badge for hero sections.

```astro
---
import GoogleReviewBadge from '@leadgen/components/GoogleReviewBadge';
---

<GoogleReviewBadge rating={4.9} reviewCount={127} url="https://g.page/..." />

<!-- Size variants -->
<GoogleReviewBadge rating={4.9} reviewCount={127} size="lg" />
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `rating` | `number` | required | Google rating (e.g., 4.9) |
| `reviewCount` | `number` | required | Total reviews |
| `url` | `string` | - | Link to Google reviews |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Size variant |

### Stats

Statistics section with big numbers.

```astro
---
import Stats from '@leadgen/components/Stats';
---

<Stats
  items={[
    { value: '2,500+', label: 'Moves Completed' },
    { value: '4.9', label: 'Google Rating', suffix: '/5' },
    { value: '15+', label: 'Years Experience' },
    { value: '0', label: 'Damage Claims' },
  ]}
  variant="dark"
/>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `StatItem[]` | required | Array of stats |
| `variant` | `'dark' \| 'light' \| 'primary'` | `'dark'` | Color scheme |
| `columns` | `2 \| 3 \| 4` | `4` | Grid columns |

### TrustBadges

Row of trust/accreditation badges.

```astro
---
import TrustBadges from '@leadgen/components/TrustBadges';
---

<TrustBadges
  badges={[
    { src: '/badges/which-trusted.svg', alt: 'Which? Trusted Trader' },
    { src: '/badges/checkatrade.svg', alt: 'Checkatrade Approved' },
  ]}
/>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `badges` | `Badge[]` | required | Array of badges |
| `variant` | `'default' \| 'grayscale' \| 'compact'` | `'grayscale'` | Display style |
| `align` | `'left' \| 'center' \| 'right'` | `'center'` | Alignment |

---

## Navigation Components

### Header

Fixed header with scroll-triggered frosted glass CTA bar.

```astro
---
import Header from '@leadgen/components/Header';
import MobileMenu from '@leadgen/components/MobileMenu';

const navItems = [
  { label: 'Szolgáltatások', href: '/szolgaltatasok' },
  { label: 'Árak', href: '/arak' },
  { label: 'Rólunk', href: '/rolunk' },
  { label: 'Kapcsolat', href: '/kapcsolat' },
];
---

<Header
  logo={{ src: '/logo.svg', alt: 'Cégünk', width: 120, height: 40 }}
  navItems={navItems}
  phone="+36 1 234 5678"
  address="Budapest, Példa utca 1."
  ctaText="Ingyenes Árajánlat"
  ctaHref="/arajanlat"
/>

<MobileMenu
  navItems={navItems}
  phone="+36 1 234 5678"
  ctaText="Ingyenes Árajánlat"
  ctaHref="/arajanlat"
/>
```

**Features:**
- Fixed header, hidden on scroll past 50vh
- Frosted glass CTA bar slides in on scroll
- Desktop: logo + nav + phone + CTA
- Mobile: logo + hamburger only

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `logo` | `Logo` | required | Logo config (src, alt, width, height) |
| `navItems` | `NavItem[]` | `[]` | Navigation items |
| `phone` | `string` | required | Phone number |
| `address` | `string` | - | Address for CTA bar |
| `ctaText` | `string` | required | CTA button text |
| `ctaHref` | `string` | required | CTA button href |

### MobileMenu

Slide-in overlay menu for mobile.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `navItems` | `NavItem[]` | required | Navigation items |
| `phone` | `string` | required | Phone number |
| `phoneButtonText` | `string` | `'Hívás'` | Phone button label |
| `ctaText` | `string` | required | CTA button text |
| `ctaHref` | `string` | required | CTA button href |

### MobileCtaBar

Sticky bottom CTA bar for mobile.

```astro
---
import MobileCtaBar from '@leadgen/components/MobileCtaBar';
---

<MobileCtaBar
  phone="+36 1 234 5678"
  phoneText="Hívjon most"
  ctaText="Online Árkalkulátor"
  ctaHref="/kalkulator"
/>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `phone` | `string` | required | Phone number |
| `phoneText` | `string` | `'Hívjon most'` | Phone button text |
| `ctaText` | `string` | `'Online Árkalkulátor'` | CTA button text |
| `ctaHref` | `string` | required | CTA href |

### Footer

Site footer with columns and legal links.

```astro
---
import Footer from '@leadgen/components/Footer';
---

<Footer
  companyName="Cégünk Kft."
  companyInfo="Megbízható költöztetés 2005 óta."
  address="1234 Budapest, Példa utca 1."
  phone="+36 1 234 5678"
  email="info@example.hu"
  columns={[
    {
      title: 'Szolgáltatások',
      links: [
        { label: 'Lakásköltöztetés', href: '/szolgaltatasok/lakas' },
        { label: 'Irodaköltöztetés', href: '/szolgaltatasok/iroda' },
      ],
    },
  ]}
  legalLinks={[
    { label: 'Adatvédelem', href: '/adatvedelem' },
    { label: 'ÁSZF', href: '/aszf' },
  ]}
/>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `companyName` | `string` | required | Company name |
| `companyInfo` | `string` | - | Short description |
| `logo` | `string` | - | Logo image src |
| `address` | `string` | - | Physical address |
| `phone` | `string` | - | Phone number |
| `email` | `string` | - | Email address |
| `columns` | `FooterColumn[]` | `[]` | Link columns |
| `legalLinks` | `FooterLink[]` | `[]` | Legal/policy links |

---

## Form Components

### ContactForm

Lead generation form with spam protection, validation, and GDPR compliance.

```astro
---
import ContactForm from '@leadgen/components/ContactForm';
---

<ContactForm
  action="/api/contact"
  turnstileSiteKey={import.meta.env.PUBLIC_TURNSTILE_SITE_KEY}
  thankYouUrl="/koszonjuk"
  privacyPolicyUrl="/adatvedelem"
  title="Kérjen ingyenes árajánlatot"
  description="Töltse ki az űrlapot és 24 órán belül felvesszük Önnel a kapcsolatot."
/>
```

**Features:**
- Honeypot field (invisible spam trap)
- Form timing check (blocks bots)
- Turnstile CAPTCHA
- GDPR consent with timestamp
- Client-side validation (Hungarian messages)
- GA4 `form_submit` event
- UTM parameter tracking
- Accessible error messages

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `action` | `string` | required | API endpoint |
| `turnstileSiteKey` | `string` | required | Cloudflare Turnstile key |
| `thankYouUrl` | `string` | required | Redirect after submit |
| `privacyPolicyUrl` | `string` | required | Privacy policy link |
| `title` | `string` | - | Form title |
| `description` | `string` | - | Form description |
| `submitText` | `string` | `'Küldés'` | Submit button text |
| `showPhone` | `boolean` | `true` | Show phone field |
| `showMessage` | `boolean` | `true` | Show message field |

**Required API endpoint:**

The form posts JSON to your `action` endpoint. Create `/src/pages/api/contact.ts`:

```typescript
import type { APIRoute } from 'astro';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  message: z.string().optional(),
  gdprConsent: z.literal('true'),
  gdprTimestamp: z.string(),
  honeypot: z.string().max(0),
  formStartTime: z.coerce.number().refine(
    (start) => Date.now() - start > 3000,
    'Too fast'
  ),
  'cf-turnstile-response': z.string().min(1),
  sourceUrl: z.string(),
});

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  const result = schema.safeParse(body);

  if (!result.success) {
    return new Response(JSON.stringify({ errors: result.error.flatten() }), {
      status: 400,
    });
  }

  // Verify Turnstile, send email, store lead...

  return new Response(JSON.stringify({ success: true }));
};
```

---

## Source Requirements

Components will warn if source images are too small:

| Pattern | Minimum Source |
|---------|----------------|
| FULL | 2560px |
| TWO_THIRDS | 2048px |
| LARGE | 1920px |
| HALF | 1600px |
| SMALL, THIRD | 1280px |
| QUARTER | 960px |
| FIFTH | 768px |
| SIXTH | 640px |

## Migration from astro-images skill

Before (manual):
```astro
<Picture
  src={image}
  widths={[320, 640, 960, 1280, 1600]}
  sizes="(min-width: 1024px) 50vw, 100vw"
  formats={['avif', 'webp']}
  quality={60}
  alt="Feature"
  decoding="async"
/>
```

After (with component):
```astro
<Picture src={image} pattern="HALF" alt="Feature" />
```

## Type Exports

```typescript
import { PATTERNS, LAYOUT_PATTERNS } from '@leadgen/components';
import type { ImagePattern, PatternConfig } from '@leadgen/components';

// Use LAYOUT_PATTERNS for semantic lookups
const pattern = LAYOUT_PATTERNS['split-50']; // 'HALF'
const pattern2 = LAYOUT_PATTERNS['team'];    // 'QUARTER'
```
