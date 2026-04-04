/**
 * HTML strip and slug utilities
 */

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).replace(/\s+\S*$/, '') + '...';
}

export function readingTime(text: string, wordsPerMinute = 200): number {
  const words = stripHtml(text).split(/\s+/).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}
