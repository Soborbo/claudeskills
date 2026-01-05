#!/usr/bin/env node
/**
 * i18n SEO Lint Script
 * 
 * Run in CI before deploy to catch SEO issues.
 * Cloudflare Pages compatible - runs at build time only.
 * 
 * Usage:
 *   npx ts-node scripts/i18n-seo-lint.ts
 *   npm run i18n:lint
 * 
 * Checks:
 * 1. Translation completeness (80% threshold)
 * 2. Placeholder consistency
 * 3. Locale lifecycle compliance
 * 4. Hreflang requirements
 * 5. Missing lang attributes in layouts
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

// Configuration - adjust paths as needed
const CONFIG = {
  translationsDir: 'src/i18n/translations',
  layoutsDir: 'src/layouts',
  pagesDir: 'src/pages',
  configFile: 'src/i18n/config.ts',
  completenessThreshold: 0.8,
  baseLocale: 'en',
};

interface LintResult {
  errors: string[];
  warnings: string[];
}

const result: LintResult = { errors: [], warnings: [] };

// ============================================
// 1. Translation Completeness
// ============================================

function checkTranslationCompleteness(): void {
  console.log('\n📝 Checking translation completeness...');
  
  const baseFile = path.join(CONFIG.translationsDir, `${CONFIG.baseLocale}.json`);
  
  if (!fs.existsSync(baseFile)) {
    // Try namespaced structure
    const namespacedDir = path.join(CONFIG.translationsDir, CONFIG.baseLocale);
    if (!fs.existsSync(namespacedDir)) {
      result.errors.push(`Base translation not found: ${baseFile}`);
      return;
    }
  }
  
  // Get all locale directories/files
  const items = fs.readdirSync(CONFIG.translationsDir);
  const locales = items
    .filter(item => {
      const fullPath = path.join(CONFIG.translationsDir, item);
      return fs.statSync(fullPath).isDirectory() || item.endsWith('.json');
    })
    .map(item => item.replace('.json', ''));
  
  // Compare each locale to base
  for (const locale of locales) {
    if (locale === CONFIG.baseLocale) continue;
    
    const baseKeys = getTranslationKeys(CONFIG.baseLocale);
    const localeKeys = getTranslationKeys(locale);
    
    const missing = [...baseKeys].filter(k => !localeKeys.has(k));
    const extra = [...localeKeys].filter(k => !baseKeys.has(k));
    const completeness = (baseKeys.size - missing.length) / baseKeys.size;
    
    console.log(`  ${locale}: ${(completeness * 100).toFixed(1)}% complete`);
    
    if (completeness < CONFIG.completenessThreshold) {
      result.errors.push(
        `${locale} is ${(completeness * 100).toFixed(1)}% complete (threshold: ${CONFIG.completenessThreshold * 100}%)`
      );
      missing.slice(0, 5).forEach(k => {
        result.errors.push(`  Missing: ${k}`);
      });
      if (missing.length > 5) {
        result.errors.push(`  ... and ${missing.length - 5} more missing keys`);
      }
    }
    
    if (extra.length > 0) {
      result.warnings.push(`${locale} has ${extra.length} stale keys`);
    }
  }
}

function getTranslationKeys(locale: string): Set<string> {
  const keys = new Set<string>();
  
  const flatFile = path.join(CONFIG.translationsDir, `${locale}.json`);
  const namespacedDir = path.join(CONFIG.translationsDir, locale);
  
  if (fs.existsSync(flatFile)) {
    const content = JSON.parse(fs.readFileSync(flatFile, 'utf-8'));
    collectKeys(content, '', keys);
  } else if (fs.existsSync(namespacedDir)) {
    const files = glob.sync(`${namespacedDir}/**/*.json`);
    for (const file of files) {
      const namespace = path.relative(namespacedDir, file).replace('.json', '').replace(/\//g, '.');
      const content = JSON.parse(fs.readFileSync(file, 'utf-8'));
      collectKeys(content, namespace, keys);
    }
  }
  
  return keys;
}

function collectKeys(obj: unknown, prefix: string, keys: Set<string>): void {
  if (typeof obj !== 'object' || obj === null) return;
  
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null) {
      collectKeys(value, fullKey, keys);
    } else {
      keys.add(fullKey);
    }
  }
}

// ============================================
// 2. Placeholder Consistency
// ============================================

function checkPlaceholderConsistency(): void {
  console.log('\n🔗 Checking placeholder consistency...');
  
  const items = fs.readdirSync(CONFIG.translationsDir);
  const locales = items
    .filter(item => item.endsWith('.json') || fs.statSync(path.join(CONFIG.translationsDir, item)).isDirectory())
    .map(item => item.replace('.json', ''));
  
  const basePlaceholders = getPlaceholders(CONFIG.baseLocale);
  
  for (const locale of locales) {
    if (locale === CONFIG.baseLocale) continue;
    
    const localePlaceholders = getPlaceholders(locale);
    
    for (const [key, basePh] of basePlaceholders) {
      const localePh = localePlaceholders.get(key);
      if (!localePh) continue; // Missing key handled elsewhere
      
      const missingPh = basePh.filter(p => !localePh.includes(p));
      const extraPh = localePh.filter(p => !basePh.includes(p));
      
      if (missingPh.length > 0) {
        result.errors.push(
          `${locale}.${key}: Missing placeholders: {${missingPh.join('}, {')}}`
        );
      }
      
      if (extraPh.length > 0) {
        result.warnings.push(
          `${locale}.${key}: Extra placeholders: {${extraPh.join('}, {')}}`
        );
      }
    }
  }
}

function getPlaceholders(locale: string): Map<string, string[]> {
  const placeholders = new Map<string, string[]>();
  
  const flatFile = path.join(CONFIG.translationsDir, `${locale}.json`);
  if (fs.existsSync(flatFile)) {
    const content = JSON.parse(fs.readFileSync(flatFile, 'utf-8'));
    collectPlaceholders(content, '', placeholders);
  }
  
  return placeholders;
}

function collectPlaceholders(obj: unknown, prefix: string, map: Map<string, string[]>): void {
  if (typeof obj !== 'object' || obj === null) return;
  
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') {
      const matches = [...value.matchAll(/\{(\w+)\}/g)].map(m => m[1]);
      if (matches.length > 0) {
        map.set(fullKey, matches);
      }
    } else if (typeof value === 'object') {
      collectPlaceholders(value, fullKey, map);
    }
  }
}

// ============================================
// 3. Layout Lang Attribute Check
// ============================================

function checkLangAttributes(): void {
  console.log('\n🏷️  Checking lang attributes in layouts...');
  
  if (!fs.existsSync(CONFIG.layoutsDir)) {
    result.warnings.push('Layouts directory not found');
    return;
  }
  
  const layouts = glob.sync(`${CONFIG.layoutsDir}/**/*.astro`);
  
  for (const layout of layouts) {
    const content = fs.readFileSync(layout, 'utf-8');
    
    // Check for <html> tag
    if (content.includes('<html')) {
      // Check if lang attribute exists
      const htmlTagMatch = content.match(/<html[^>]*>/);
      if (htmlTagMatch) {
        const htmlTag = htmlTagMatch[0];
        if (!htmlTag.includes('lang=')) {
          result.errors.push(`${layout}: <html> missing lang attribute`);
        }
      }
    }
  }
}

// ============================================
// 4. Hreflang Component Check
// ============================================

function checkHreflangUsage(): void {
  console.log('\n🔗 Checking HreflangHead usage...');
  
  if (!fs.existsSync(CONFIG.layoutsDir)) return;
  
  const layouts = glob.sync(`${CONFIG.layoutsDir}/**/*.astro`);
  let hasHreflang = false;
  
  for (const layout of layouts) {
    const content = fs.readFileSync(layout, 'utf-8');
    if (content.includes('HreflangHead') || content.includes('hreflang')) {
      hasHreflang = true;
      break;
    }
  }
  
  if (!hasHreflang) {
    result.warnings.push('No HreflangHead component found in layouts');
  }
}

// ============================================
// 5. Locale Lifecycle Check
// ============================================

function checkLocaleLifecycle(): void {
  console.log('\n⚙️  Checking locale lifecycle configuration...');
  
  if (!fs.existsSync(CONFIG.configFile)) {
    result.warnings.push('i18n config file not found');
    return;
  }
  
  const content = fs.readFileSync(CONFIG.configFile, 'utf-8');
  
  if (!content.includes('localeStates')) {
    result.warnings.push('localeStates not configured - all locales treated as active');
  }
  
  // Check for deprecated locales with existing translations
  if (content.includes("'deprecated'")) {
    result.warnings.push('Deprecated locales detected - ensure 301 redirects are configured');
  }
}

// ============================================
// Main
// ============================================

async function main(): Promise<void> {
  console.log('🔍 i18n SEO Lint\n');
  console.log('='.repeat(50));
  
  checkTranslationCompleteness();
  checkPlaceholderConsistency();
  checkLangAttributes();
  checkHreflangUsage();
  checkLocaleLifecycle();
  
  console.log('\n' + '='.repeat(50));
  
  // Summary
  if (result.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    result.warnings.forEach(w => console.log(`   ${w}`));
  }
  
  if (result.errors.length > 0) {
    console.log('\n❌ Errors:');
    result.errors.forEach(e => console.log(`   ${e}`));
    console.log('\n🛑 i18n SEO lint FAILED\n');
    process.exit(1);
  }
  
  console.log('\n✅ i18n SEO lint passed\n');
}

main().catch(console.error);
