/**
 * XSS Sanitisation
 * ─────────────────
 * All HTML rendered via dangerouslySetInnerHTML MUST pass through here first.
 * Uses DOMPurify with a strict allowlist: only formatting tags, no scripts,
 * no event handlers, no style attributes.
 */

import DOMPurify from 'dompurify';

const CONFIG = {
  ALLOWED_TAGS:  ['strong', 'em', 'b', 'i', 'span', 'br'],
  ALLOWED_ATTR:  [],          // no attributes on any tag
  FORBID_ATTR:   ['style', 'class', 'onerror', 'onload'],
  FORBID_TAGS:   ['script', 'object', 'embed', 'link', 'iframe', 'form'],
  RETURN_DOM:    false as const,
  RETURN_DOM_FRAGMENT: false as const,
};

/**
 * Sanitise untrusted HTML before rendering.
 * @example
 * <div dangerouslySetInnerHTML={{ __html: sanitize(activityItem.text) }} />
 */
export function sanitize(dirty: string): string {
  return DOMPurify.sanitize(dirty, CONFIG);
}

/**
 * Strip all HTML tags and return plain text.
 * Use for input validation and logging (don't log raw HTML).
 */
export function stripHtml(html: string): string {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}
