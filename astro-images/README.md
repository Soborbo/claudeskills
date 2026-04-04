# Astro Images Skill Package

A complete, production-ready skill for responsive image implementation in Astro projects.

## Version

**v3.0.0** — Production ready

> **Compatibility:** This skill is calibrated for Astro 4–6 and Sharp-based image services. Re-validate rules if Astro's image pipeline changes significantly.

## Files

| File | Purpose | Audience |
|------|---------|----------|
| `SKILL.md` | Core rules and patterns — pattern-based API | Claude / AI agents |
| `rules.json` | **Canonical source** for width arrays and machine-readable rules | Automated tooling / AI |
| `AUDIT_PROMPT.md` | Pre-output verification checklist | Claude / AI agents |
| `IMAGE_GUIDE.md` | Image preparation instructions | Clients / End users |
| `assets/boilerplate/` | Copy-into-project components and config | Developers |

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      CLIENT                             │
│  Reads IMAGE_GUIDE.md → Provides correct source images  │
└─────────────────────────┬───────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    CLAUDE CODE                          │
│  1. Reads SKILL.md (patterns + rules)                   │
│  2. Copies boilerplate components into project          │
│  3. Runs AUDIT_PROMPT.md before outputting              │
│  4. References rules.json as canonical source           │
│  5. Outputs compliant image code using <Picture> +      │
│     pattern prop                                        │
└─────────────────────────┬───────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────┐
│                     CI / BUILD                          │
│  rules.json validates compliance automatically          │
└─────────────────────────────────────────────────────────┘
```

## Single Source of Truth

**`rules.json` is the canonical source for width arrays.** All pattern definitions must match `rules.json`:

```json
"widthPresets": {
  "FULL":       [480, 640, 750, 828, 1080, 1200, 1920, 2048, 2560],
  "TWO_THIRDS": [384, 480, 640, 768, 1024, 1280, 1706, 2048],
  "LARGE":      [384, 480, 640, 768, 1024, 1280, 1536, 1920],
  "HALF":       [320, 480, 640, 960, 1280, 1600],
  "HALF_CARD":  [320, 480, 640, 828, 960, 1280],
  "SMALL":      [256, 480, 512, 640, 1024, 1280],
  "THIRD":      [256, 480, 512, 640, 853, 1280],
  "QUARTER":    [192, 384, 480, 512, 640, 960],
  "FIFTH":      [160, 320, 480, 512, 640, 768],
  "SIXTH":      [128, 256, 427, 480, 512, 640]
}
```

480px is mandatory in every pattern. If width arrays need to change, update `rules.json` first.

## Boilerplate Components

On first use in a project, copy into the project:

```bash
cp assets/boilerplate/config/image-patterns.ts  → src/config/image-patterns.ts
cp assets/boilerplate/components/Picture.astro   → src/components/Picture.astro
cp assets/boilerplate/components/FixedImage.astro → src/components/FixedImage.astro
```

## The Ten Patterns

| Pattern | Width | Use Case |
|---------|-------|----------|
| FULL | 100vw | Full-bleed hero banners |
| TWO_THIRDS | 66vw | Dominant side of 66/33 split |
| LARGE | 60vw | Dominant side of 60/40 split |
| HALF | 50vw | Split 50/50, checkerboard, features |
| HALF_CARD | 50vw | Card with max-height constraint |
| SMALL | 40vw | Text-dominant split (40/60) |
| THIRD | 33vw | 3-col grid, standing person |
| QUARTER | 25vw | 4-col team grid |
| FIFTH | 20vw | 5-col icons |
| SIXTH | 16vw | 6-col logos |

Unknown layout → default to HALF.

## Usage

### Pattern-based API (v3)

```astro
<!-- Use pattern prop — handles widths, sizes, formats automatically -->
<Picture src={heroImage} pattern="FULL" lcp alt="Hero" />
<Picture src={featureImage} pattern="HALF" alt="Feature" />
<Picture src={teamMember} pattern="QUARTER" alt="John Smith" />

<!-- Fixed-size images (logos, avatars) -->
<FixedImage src={logo} width={200} alt="Company Logo" />
```

### Key Rules

1. Use `<Picture>` with `pattern` prop — handles widths/sizes/formats
2. Three formats always: AVIF → WebP → JPG (never PNG fallback for photos)
3. 480px width in every pattern — mandatory for mobile
4. Only ONE `lcp` prop per page
5. Images in `/src/assets/`, never `/public/`
6. Face focus by default — `object-position` keeps faces visible
7. Checkerboard: image first in DOM (mobile = image→text)
8. Generate OG images from hero — 5 variants (og, twitter, schema-16, schema-4, schema-1)

## Changelog

### v3.0.0
- Pattern-based API: `<Picture pattern="HALF">` replaces manual widths/sizes/quality/formats
- Added Picture and FixedImage boilerplate components
- Added image-patterns.ts config with PATTERNS and LAYOUT_PATTERNS
- Added HALF_CARD pattern for card layouts
- 480px mandatory in every pattern
- OG image generation (5 variants)
- Face focus rules
- Checkerboard layout rules
- Undersized source handling (cap widths, warn)

### v1.4.0
- Added Cloudflare adapter configuration documentation

### v1.1.0
- Added single source of truth (`widthPresets` in `rules.json`)

### v1.0.0
- Initial release
