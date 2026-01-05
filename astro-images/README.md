# Astro Images Skill Package

A complete, production-ready skill for responsive image implementation in Astro projects.

## Version

**v1.1.0** — Production ready

> **Compatibility:** This skill is calibrated for Astro 4–5 and Sharp-based image services. Re-validate rules if Astro's image pipeline changes significantly.

## Files

| File | Purpose | Audience |
|------|---------|----------|
| `SKILL.md` | Core rules and copy-paste patterns | Claude / AI agents |
| `rules.json` | **Canonical source** for width arrays and machine-readable rules | Automated tooling / AI |
| `AUDIT_PROMPT.md` | Pre-output verification checklist | Claude / AI agents |
| `IMAGE_GUIDE.md` | Image preparation instructions | Clients / End users |

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
│  2. Runs AUDIT_PROMPT.md before outputting              │
│  3. References rules.json as canonical source           │
│  4. Outputs compliant image code                        │
└─────────────────────────┬───────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────┐
│                     CI / BUILD                          │
│  rules.json validates compliance automatically          │
└─────────────────────────────────────────────────────────┘
```

## Single Source of Truth

**`rules.json` is the canonical source for width arrays.**

All other files reference these presets:

```json
"widthPresets": {
  "HERO": [640, 750, 828, 1080, 1200, 1920, 2048, 2560],
  "CONTENT": [320, 640, 960, 1280, 1920],
  "THUMBNAIL": [256, 384, 512, 640, 750],
  "ZOOMABLE": [640, 750, 828, 1080, 1200, 1920, 2048, 2560, 3840]
}
```

If width arrays need to change, update `rules.json` first.

## Usage

### For Claude Code / AI Agents

1. Place this folder in your skills directory
2. Claude reads `SKILL.md` for the four canonical patterns
3. Before outputting image code, Claude runs the `AUDIT_PROMPT.md` checklist
4. Width arrays must match `rules.json` presets exactly
5. Validation commands in `SKILL.md` verify compliance

### For CI/Linting

The `rules.json` file contains machine-readable rules that can be integrated with:
- Custom ESLint plugins
- Pre-commit hooks
- Build validation scripts

### For Clients

Share `IMAGE_GUIDE.md` with clients to ensure they provide properly sized and formatted images.

## The Four Patterns

| Pattern | Use Case | Width Preset |
|---------|----------|--------------|
| HERO | Full-width, LCP, banners | `HERO` |
| CONTENT | Articles, columns | `CONTENT` |
| THUMBNAIL | Cards, grids | `THUMBNAIL` |
| FIXED | Logos, icons | `1x, 2x` density descriptors |

## Key Rules

1. Every `<Picture>` needs `widths` + `sizes` + `quality={60}` + `formats={['avif', 'webp']}`
2. Every image needs intrinsic dimensions
3. Images go in `/src/assets/`, never `/public/`
4. Only ONE image per page gets `fetchpriority="high"`
5. `sizes` must match actual CSS layout
6. Use exact presets from `rules.json` only — no custom widths
7. Descriptive `alt` text required
8. Aspect ratio must remain constant across all variants

## Changelog

### v1.1.0
- Added single source of truth (`widthPresets` in `rules.json`)
- Added aspect ratio consistency rule
- Added no-upscaling rule
- Added animated image guidance (prefer video/Lottie)
- Added authority rule (skill overrides user preferences)
- Made dimension check a warning (Astro may auto-infer)
- Made 100vw warning contextual (valid for HERO/ZOOMABLE)
- Made performance budgets explicitly advisory
- Added version pinning note
- Linked pattern names in client guide

### v1.0.0
- Initial release
