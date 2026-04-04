/**
 * HTML Sanitisation
 * Escape user input before interpolation into email HTML.
 */

const ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
};

const ESCAPE_REGEX = /[&<>"']/g;

/**
 * Escape HTML special characters.
 * Use on ALL user-provided strings before putting them in email HTML.
 */
export function escapeHtml(str: string): string {
  if (!str) return '';
  return str.replace(ESCAPE_REGEX, (char) => ESCAPE_MAP[char] || char);
}

/**
 * Strip all HTML tags. Use when you need plain text only.
 */
export function stripHtml(str: string): string {
  if (!str) return '';
  return str.replace(/<[^>]*>/g, '');
}
