/**
 * HTML sanitization — strips all tags, escapes entities
 */

const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeHtml(str: string): string {
  return str.replace(/[&<>"']/g, (char) => HTML_ENTITIES[char] || char);
}

export function stripTags(str: string): string {
  return str.replace(/<[^>]*>/g, '');
}

export function sanitizeInput(str: string): string {
  return escapeHtml(stripTags(str.trim()));
}
