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
export { default as YouTubeFacade } from './YouTubeFacade/YouTubeFacade.astro';

// Social Proof
export { default as Testimonial } from './Testimonial/Testimonial.astro';
export { default as GoogleReviewBadge } from './GoogleReviewBadge/GoogleReviewBadge.astro';
export { default as Stats } from './Stats/Stats.astro';
export { default as TrustBadges } from './TrustBadges/TrustBadges.astro';

// Navigation
export { default as Header } from './Header/Header.astro';
export { default as MobileMenu } from './MobileMenu/MobileMenu.astro';
export { default as MobileCtaBar } from './MobileCtaBar/MobileCtaBar.astro';
export { default as Footer } from './Footer/Footer.astro';
