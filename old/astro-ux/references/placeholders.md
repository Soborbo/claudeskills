# Placeholder Images

Located in `assets/placeholders/`. Replace before launch.

## Available
| File | Size | Use |
|------|------|-----|
| hero-1440x600.svg | 1440×600 | Desktop hero |
| hero-mobile-375x400.svg | 375×400 | Mobile hero |
| benefit-400x300.svg | 400×300 | Benefit cards |
| team-600x400.svg | 600×400 | About/Problem |
| testimonial-80x80.svg | 80×80 | Review avatars |
| logo-placeholder-200x80.svg | 200×80 | Partner logos |
| before-after-600x400.svg | 600×400 | Comparison |
| gallery-thumb-150x150.svg | 150×150 | Gallery |
| case-study-800x500.svg | 800×500 | Case studies |

## Style
- Background: #F3F4F6
- Border: 2px dashed #D1D5DB
- Text: #6B7280 with dimensions

## Usage
```astro
import ph from '../assets/placeholders/benefit-400x300.svg';
<img src={ph.src} width="400" height="300" />
```

## Checklist
- [ ] All replaced with real images
- [ ] Alt text updated
- [ ] Optimized (WebP/AVIF)
