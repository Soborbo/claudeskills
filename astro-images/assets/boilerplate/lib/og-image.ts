/**
 * OG Image Generator
 *
 * Generates Open Graph and Schema.org image variants from a hero image.
 * All processing happens locally with Sharp at build time.
 *
 * Usage in a build script or Astro integration:
 * ```ts
 * import { generateOGImages, OG_VARIANTS } from '../lib/og-image';
 * await generateOGImages('src/assets/images/hero.jpg', 'public/og', 'homepage');
 * ```
 *
 * Usage in page frontmatter (reference pre-generated images):
 * ```astro
 * <BaseLayout ogImage={`/og/${slug}-og.jpg`} />
 * ```
 */
import sharp from 'sharp';
import path from 'path';

export interface OGVariant {
  /** File suffix (e.g. 'og', 'twitter', 'schema-16') */
  suffix: string;
  /** Output width in pixels */
  width: number;
  /** Output height in pixels */
  height: number;
  /** Description of what this variant is for */
  description: string;
}

/**
 * All required OG image variants.
 * Each page with a hero image needs all of these.
 */
export const OG_VARIANTS: OGVariant[] = [
  { suffix: 'og',        width: 1200, height: 630,  description: 'Facebook / LinkedIn / Generic og:image' },
  { suffix: 'twitter',   width: 1200, height: 600,  description: 'Twitter/X summary_large_image' },
  { suffix: 'schema-16', width: 1200, height: 675,  description: 'Schema.org 16:9' },
  { suffix: 'schema-4',  width: 1200, height: 900,  description: 'Schema.org 4:3' },
  { suffix: 'schema-1',  width: 1200, height: 1200, description: 'Schema.org 1:1 (also WhatsApp)' },
];

/**
 * Generate all OG image variants from a single hero image.
 *
 * @param heroPath - Path to the source hero image
 * @param outputDir - Directory to write OG images to (e.g. 'public/og')
 * @param slug - Page slug used for filenames (e.g. 'homepage', 'about', 'removals-bristol')
 * @returns Record mapping variant suffix to output file path
 *
 * @example
 * const paths = await generateOGImages(
 *   'src/assets/images/hero.jpg',
 *   'public/og',
 *   'homepage'
 * );
 * // paths = {
 * //   'og': 'public/og/homepage-og.jpg',
 * //   'twitter': 'public/og/homepage-twitter.jpg',
 * //   ...
 * // }
 */
export async function generateOGImages(
  heroPath: string,
  outputDir: string,
  slug: string
): Promise<Record<string, string>> {
  const results: Record<string, string> = {};

  for (const variant of OG_VARIANTS) {
    const outputPath = path.join(outputDir, `${slug}-${variant.suffix}.jpg`);

    await sharp(heroPath)
      .resize(variant.width, variant.height, {
        fit: 'cover',
        // 'attention' uses Sharp's smart crop — detects faces and points of interest
        position: 'attention',
      })
      .jpeg({
        quality: 80, // Higher than content images — these are page "posters"
        progressive: true,
      })
      .toFile(outputPath);

    results[variant.suffix] = outputPath;
  }

  return results;
}

/**
 * Generate OG images for all pages in a batch.
 *
 * @param pages - Array of { heroPath, slug } pairs
 * @param outputDir - Shared output directory
 *
 * @example
 * // In a build script (e.g. scripts/generate-og.ts)
 * await generateAllOGImages([
 *   { heroPath: 'src/assets/images/home-hero.jpg', slug: 'homepage' },
 *   { heroPath: 'src/assets/images/about-hero.jpg', slug: 'about' },
 * ], 'public/og');
 */
export async function generateAllOGImages(
  pages: Array<{ heroPath: string; slug: string }>,
  outputDir: string
): Promise<void> {
  const { mkdir } = await import('fs/promises');
  await mkdir(outputDir, { recursive: true });

  for (const page of pages) {
    try {
      await generateOGImages(page.heroPath, outputDir, page.slug);
      console.log(`✓ OG images: ${page.slug} (${OG_VARIANTS.length} variants)`);
    } catch (err) {
      console.error(`✗ OG images failed for ${page.slug}:`, err);
    }
  }
}
