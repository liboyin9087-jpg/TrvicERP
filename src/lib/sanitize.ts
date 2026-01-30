import DOMPurify from 'dompurify';

/**
 * Sanitize an HTML string to prevent XSS attacks.
 * Uses DOMPurify with a safe default configuration.
 */
export function sanitizeHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li',
      'span', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'blockquote', 'code', 'pre', 'img', 'hr',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'src', 'alt', 'width', 'height'],
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Strip all HTML tags and return plain text.
 */
export function stripHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [] });
}
