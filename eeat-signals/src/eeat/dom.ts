/**
 * DOM + text helpers. jsdom is used so the auditor can run in Node/CI over
 * built HTML without a browser.
 */
import { JSDOM } from 'jsdom';
import type { PageKind } from './types';

export function parse(html: string): Document {
  return new JSDOM(html).window.document;
}

/** Visible text of an element, whitespace-collapsed. */
export function text(el: Element | Document | null | undefined): string {
  if (!el) return '';
  const node = 'body' in el ? (el as Document).body : (el as Element);
  return (node?.textContent ?? '').replace(/\s+/g, ' ').trim();
}

/** Lower-cased visible text of the whole document body. */
export function bodyText(doc: Document): string {
  return text(doc).toLowerCase();
}

/** Parse every JSON-LD block; tolerate malformed blocks by skipping them. */
export function jsonLd(doc: Document): unknown[] {
  const out: unknown[] = [];
  doc.querySelectorAll('script[type="application/ld+json"]').forEach((s) => {
    try {
      const parsed = JSON.parse(s.textContent ?? '');
      if (Array.isArray(parsed)) out.push(...parsed);
      else out.push(parsed);
    } catch {
      /* skip malformed JSON-LD — schema-audit owns validity, not this kit */
    }
  });
  return out;
}

/** Collect every `@type` string that appears anywhere in the JSON-LD graph. */
export function schemaTypes(doc: Document): Set<string> {
  const types = new Set<string>();
  const walk = (v: unknown): void => {
    if (!v || typeof v !== 'object') return;
    if (Array.isArray(v)) return v.forEach(walk);
    const obj = v as Record<string, unknown>;
    const t = obj['@type'];
    if (typeof t === 'string') types.add(t);
    if (Array.isArray(t)) t.forEach((x) => typeof x === 'string' && types.add(x));
    Object.values(obj).forEach(walk);
  };
  jsonLd(doc).forEach(walk);
  return types;
}

const PRODUCT_TYPES = new Set(['Product', 'ProductGroup', 'Offer', 'AggregateOffer']);
const ARTICLE_TYPES = new Set(['Article', 'BlogPosting', 'NewsArticle']);
const SERVICE_TYPES = new Set(['Service']);

/**
 * Best-effort page-kind detection. Order matters: an explicit Product graph
 * wins over an Article wrapper, which wins over Service, then DOM fallbacks.
 */
export function detectKind(doc: Document, urlHint = ''): PageKind {
  const types = schemaTypes(doc);
  const has = (set: Set<string>) => [...types].some((t) => set.has(t));
  if (has(PRODUCT_TYPES)) return 'product';
  if (has(ARTICLE_TYPES) || doc.querySelector('article')) return 'article';
  if (has(SERVICE_TYPES)) return 'service';
  if (/\/(blog|news|guide|cikk|hir)\b/i.test(urlHint)) return 'article';
  if (/\/(shop|product|termek|webaruhaz)\b/i.test(urlHint)) return 'product';
  return 'generic';
}

/** True if the text contains at least one "specificity" token (number, year,
 * duration, or an explicit credential word) — the difference between a CLAIM
 * of expertise and a DEMONSTRATION of it. */
export function hasSpecificity(s: string): boolean {
  const t = s.toLowerCase();
  if (/\b(19|20)\d{2}\b/.test(t)) return true; // a year
  if (/\b\d+\s*(\+|plus)?\s*(years?|év|éve|hónap|months?)\b/.test(t)) return true; // duration
  if (/\b(£|€|\$|ft|huf)\s?\d/.test(t)) return true; // money
  if (/\b\d{2,}\b/.test(t)) return true; // any 2+ digit number
  if (
    /\b(certified|accredited|registered|qualified|chartered|gas safe|niceic|trustmark|képesített|tanúsított|regisztrált|szakképzett|vizsga)\b/.test(
      t,
    )
  )
    return true;
  return false;
}
