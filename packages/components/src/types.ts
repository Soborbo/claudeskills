/**
 * Image pattern types based on rendered width
 * Pattern = rendered width, NOT aspect ratio
 */
export type ImagePattern =
  | 'FULL'        // 100vw - Full-bleed hero
  | 'TWO_THIRDS'  // 66vw - Dominant side of 66/33 split
  | 'LARGE'       // 60vw - Dominant side of 60/40 split
  | 'HALF'        // 50vw - Split 50/50, checkerboard
  | 'SMALL'       // 40vw - Text-dominant split (40/60)
  | 'THIRD'       // 33vw - 3-col grid, standing person
  | 'QUARTER'     // 25vw - 4-col team grid
  | 'FIFTH'       // 20vw - 5-col icons
  | 'SIXTH';      // 16vw - 6-col logos

/**
 * Pattern configuration with exact widths and sizes
 * These arrays are optimized for common viewport widths and DPR combinations
 */
export interface PatternConfig {
  widths: number[];
  sizes: string;
  minSourceWidth: number;
}

/**
 * Complete pattern definitions
 * Matches the astro-images skill specification exactly
 */
export const PATTERNS: Record<ImagePattern, PatternConfig> = {
  FULL: {
    widths: [640, 750, 828, 1080, 1200, 1920, 2048, 2560],
    sizes: '100vw',
    minSourceWidth: 2560,
  },
  TWO_THIRDS: {
    widths: [384, 640, 768, 1024, 1280, 1706, 2048],
    sizes: '(min-width: 1024px) 66vw, 100vw',
    minSourceWidth: 2048,
  },
  LARGE: {
    widths: [384, 640, 768, 1024, 1280, 1536, 1920],
    sizes: '(min-width: 1024px) 60vw, 100vw',
    minSourceWidth: 1920,
  },
  HALF: {
    widths: [320, 640, 960, 1280, 1600],
    sizes: '(min-width: 1024px) 50vw, 100vw',
    minSourceWidth: 1600,
  },
  SMALL: {
    widths: [256, 512, 640, 1024, 1280],
    sizes: '(min-width: 1024px) 40vw, 100vw',
    minSourceWidth: 1280,
  },
  THIRD: {
    widths: [256, 512, 640, 853, 1280],
    sizes: '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw',
    minSourceWidth: 1280,
  },
  QUARTER: {
    widths: [192, 384, 512, 640, 960],
    sizes: '(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw',
    minSourceWidth: 960,
  },
  FIFTH: {
    widths: [160, 320, 512, 640, 768],
    sizes: '(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw',
    minSourceWidth: 768,
  },
  SIXTH: {
    widths: [128, 256, 427, 512, 640],
    sizes: '(min-width: 1024px) 16vw, (min-width: 640px) 33vw, 50vw',
    minSourceWidth: 640,
  },
} as const;

/**
 * Layout to pattern mapping helper
 * Use this to determine the correct pattern for common layouts
 */
export const LAYOUT_PATTERNS: Record<string, ImagePattern> = {
  'full-bleed': 'FULL',
  'hero-full': 'FULL',
  'split-66': 'TWO_THIRDS',
  'split-60': 'LARGE',
  'split-50': 'HALF',
  'checkerboard': 'HALF',
  'split-40': 'SMALL',
  'grid-3': 'THIRD',
  'standing-person': 'THIRD',
  'grid-4': 'QUARTER',
  'team': 'QUARTER',
  'grid-5': 'FIFTH',
  'icons': 'FIFTH',
  'grid-6': 'SIXTH',
  'logos': 'SIXTH',
} as const;
