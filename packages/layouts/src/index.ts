/**
 * @leadgen/layouts
 *
 * Astro layouts for lead generation websites.
 */

// Re-export layouts
export { default as BaseLayout } from './BaseLayout.astro';
export { default as LandingLayout } from './LandingLayout.astro';
export { default as ArticleLayout } from './ArticleLayout.astro';

// Re-export types
export type { Props as BaseLayoutProps } from './BaseLayout.astro';
export type { Props as LandingLayoutProps } from './LandingLayout.astro';
export type { Props as ArticleLayoutProps } from './ArticleLayout.astro';
