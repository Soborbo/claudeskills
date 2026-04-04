/**
 * Image optimization script
 * Processes new/modified images to AVIF, WebP, JPG
 * Hash-based caching — skips already optimized files
 *
 * Usage: npx tsx scripts/optimize-images.ts
 */

import { readdir, stat, mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, extname, basename, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

const INPUT_DIR = 'src/assets/images';
const OUTPUT_DIR = 'public/images';
const CACHE_FILE = '.image-cache.json';
const QUALITY = 60;
const SUPPORTED_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.tiff'];

interface CacheEntry {
  hash: string;
  outputs: string[];
}

type Cache = Record<string, CacheEntry>;

async function getFileHash(filePath: string): Promise<string> {
  const content = await readFile(filePath);
  return createHash('sha256').update(content).digest('hex').slice(0, 16);
}

async function loadCache(): Promise<Cache> {
  try {
    const data = await readFile(CACHE_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

async function saveCache(cache: Cache): Promise<void> {
  await writeFile(CACHE_FILE, JSON.stringify(cache, null, 2));
}

async function findImages(dir: string): Promise<string[]> {
  const images: string[] = [];

  try {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        images.push(...(await findImages(fullPath)));
      } else if (SUPPORTED_EXTS.includes(extname(entry.name).toLowerCase())) {
        images.push(fullPath);
      }
    }
  } catch {
    // Directory might not exist
  }

  return images;
}

async function optimizeImage(inputPath: string, outputDir: string): Promise<string[]> {
  const name = basename(inputPath, extname(inputPath));
  const outputs: string[] = [];

  await mkdir(outputDir, { recursive: true });

  const formats = [
    { ext: '.avif', format: 'avif' as const },
    { ext: '.webp', format: 'webp' as const },
    { ext: '.jpg', format: 'jpeg' as const },
  ];

  for (const { ext, format } of formats) {
    const outputPath = join(outputDir, `${name}${ext}`);
    await sharp(inputPath)
      .toFormat(format, { quality: QUALITY })
      .toFile(outputPath);
    outputs.push(outputPath);
  }

  return outputs;
}

async function main() {
  console.log('Scanning for images...');

  const cache = await loadCache();
  const images = await findImages(INPUT_DIR);

  if (images.length === 0) {
    console.log(`No images found in ${INPUT_DIR}. Create this directory and add your source images.`);
    return;
  }

  let processed = 0;
  let skipped = 0;

  for (const imagePath of images) {
    const hash = await getFileHash(imagePath);
    const relativePath = imagePath.replace(INPUT_DIR, '');
    const outputSubDir = join(OUTPUT_DIR, dirname(relativePath));

    if (cache[imagePath]?.hash === hash) {
      skipped++;
      continue;
    }

    console.log(`Optimizing: ${imagePath}`);
    const outputs = await optimizeImage(imagePath, outputSubDir);

    cache[imagePath] = { hash, outputs };
    processed++;
  }

  await saveCache(cache);

  console.log(`\nDone! Processed: ${processed}, Skipped: ${skipped}, Total: ${images.length}`);
}

main().catch(console.error);
