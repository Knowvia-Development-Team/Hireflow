/**
 * Slug Generator
 * ──────────────────
 * Generates short unique slugs like "aB3kR9mX2pLq" for public job URLs
 */

import { customAlphabet } from 'nanoid';

// URL-safe, unambiguous characters (excludes 0, O, I, l to avoid confusion)
const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz';

// Generate 10-character slugs
const nanoid = customAlphabet(ALPHABET, 10);

/**
 * Generates a unique short slug for job URLs
 * @returns A 10-character alphanumeric string
 */
export function generateSlug(): string {
  return nanoid();
}
