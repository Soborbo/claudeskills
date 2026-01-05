/**
 * @leadgen/components
 *
 * Astro component library for high-performance lead generation websites.
 * Encapsulates best practices as reusable, type-safe components.
 */

// Types
export type { ImagePattern, PatternConfig } from './types';
export { PATTERNS, LAYOUT_PATTERNS } from './types';

// Component re-exports for convenience
// Primary usage: import Picture from '@leadgen/components/Picture'
// Alternative: import { Picture } from '@leadgen/components'
export { default as Picture } from './Picture/Picture.astro';
export { default as FixedImage } from './FixedImage/FixedImage.astro';
