#!/usr/bin/env node
/**
 * optimize-images.mjs — canonical preprocessor for /public/ image sets.
 *
 * Fixes two structural defects:
 *   A) AVIF heavier than WebP — caused by ONE shared quality for both formats.
 *      AVIF and WebP quality scales are NOT comparable. AVIF q50 ≈ WebP q60
 *      perceptually but ~25-40% smaller. We encode each format with its OWN
 *      quality, AVIF deliberately lower, with effort 5 for extra savings.
 *   C) PNG fallback for photos — caused by keeping the source format.
 *      We detect alpha (sharp metadata.hasAlpha): opaque -> JPG fallback,
 *      transparent -> PNG fallback (alpha preserved). Never PNG for opaque photos.
 *
 * Incremental by default (mtime check).
 *   --force   regenerate every variant in place (quality/format/ladder/codec changed).
 *   --clean   ALSO delete the whole output dir first, then regenerate. Incremental
 *             never deletes, so --clean is the only way to purge stale variants
 *             (reduced width ladder, renamed/removed source). OUT_DIR must be a dir
 *             this script OWNS — it is wiped wholesale by --clean.
 *
 * Requires `sharp` (already a transitive dep of Astro's image service — no extra install).
 *
 * Env overrides:
 *   IMG_SRC  source dir (default: src/assets/preprocess)
 *   IMG_OUT  output dir (default: public/img)
 *
 * Output naming: `${slug}-${width}w.${ext}` — the source basename (SEO slug)
 * is preserved in every served URL. Name sources as kebab-case keyword-locality.
 */
import { promises as fs } from 'node:fs';
import fssync from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const SRC_DIR = process.env.IMG_SRC ?? 'src/assets/preprocess';
const OUT_DIR = process.env.IMG_OUT ?? 'public/img';
const CLEAN = process.argv.includes('--clean');
const FORCE = CLEAN || process.argv.includes('--force');

// Per-format quality — AVIF deliberately lower than WebP/JPG (non-comparable scales).
const Q = { avif: 50, webp: 60, jpg: 62, png: 80 };
const AVIF_EFFORT = 5; // 0-9; higher = smaller & slower. 5 is a good build-time balance.

// Width ladder. Widths larger than a source are skipped (no upscaling).
const WIDTHS = [320, 480, 640, 828, 960, 1280, 1600, 1920, 2048, 2560];

const SOURCE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.tiff', '.tif']);

async function walk(dir) {
  const out = [];
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return out; // dir does not exist yet
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await walk(full)));
    } else if (entry.isFile() && SOURCE_EXTS.has(path.extname(entry.name).toLowerCase())) {
      out.push(full);
    }
  }
  return out;
}

function isFresh(outPath, srcMtimeMs) {
  try {
    return fssync.statSync(outPath).mtimeMs >= srcMtimeMs;
  } catch {
    return false; // missing -> not fresh
  }
}

async function emit(srcPath, width, format, outPath) {
  let pipe = sharp(srcPath).resize(width);
  if (format === 'avif') pipe = pipe.avif({ quality: Q.avif, effort: AVIF_EFFORT });
  else if (format === 'webp') pipe = pipe.webp({ quality: Q.webp });
  else if (format === 'jpg') pipe = pipe.jpeg({ quality: Q.jpg, progressive: true, mozjpeg: true });
  else if (format === 'png') pipe = pipe.png({ compressionLevel: 9 }); // lossless, alpha kept
  await pipe.toFile(outPath);
}

async function run() {
  const sources = await walk(SRC_DIR);
  if (sources.length === 0) {
    console.error(`[optimize-images] No sources found in ${SRC_DIR}`);
    process.exit(1);
  }

  if (CLEAN) {
    await fs.rm(OUT_DIR, { recursive: true, force: true });
    console.log(`[optimize-images] --clean: removed ${OUT_DIR}`);
  }

  let generated = 0;
  let skipped = 0;

  for (const srcPath of sources) {
    const ext = path.extname(srcPath).toLowerCase();
    const slug = path.basename(srcPath, ext);
    const srcMtimeMs = fssync.statSync(srcPath).mtimeMs;

    const meta = await sharp(srcPath).metadata();
    const fallback = meta.hasAlpha ? 'png' : 'jpg'; // <-- alpha-aware (fix C)
    const maxW = meta.width ?? Math.max(...WIDTHS);
    const widths = WIDTHS.filter((w) => w <= maxW);
    if (widths.length === 0) widths.push(maxW);

    const rel = path.relative(SRC_DIR, path.dirname(srcPath));
    const outDir = path.join(OUT_DIR, rel);
    await fs.mkdir(outDir, { recursive: true });

    let didWork = false;
    for (const w of widths) {
      // AVIF + WebP always; third file is the alpha-aware fallback.
      for (const format of ['avif', 'webp', fallback]) {
        const outExt = format; // already 'jpg'/'png'/'avif'/'webp'
        const outPath = path.join(outDir, `${slug}-${w}w.${outExt}`);
        if (!FORCE && isFresh(outPath, srcMtimeMs)) {
          skipped++;
          continue;
        }
        await emit(srcPath, w, format, outPath);
        generated++;
        didWork = true;
      }
    }
    if (didWork) console.log(`✓ ${slug}  (${widths.length} widths, fallback=${fallback})`);
  }

  console.log(`\nVariants generated: ${generated} (skipped ${skipped} up-to-date)`);
}

run().catch((err) => {
  console.error('[optimize-images] failed:', err);
  process.exit(1);
});
