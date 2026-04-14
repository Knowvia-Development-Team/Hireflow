/**
 * Strip markdown fences and parse the first JSON object found in raw text.
 * Mistral sometimes wraps output in ```json … ``` even when told not to.
 */
export function parseJSON<T>(raw: string): T {
  const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  const start   = cleaned.indexOf('{');
  const end     = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON object found in model response');
  return JSON.parse(cleaned.slice(start, end + 1)) as T;
}

/** Cosine similarity between two numeric vectors. */
export function cosineSim(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot   += (a[i] ?? 0) * (b[i] ?? 0);
    normA += (a[i] ?? 0) ** 2;
    normB += (b[i] ?? 0) ** 2;
  }
  if (!normA || !normB) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/** Clamp a value to [0, 100] and round to nearest integer. */
export function clamp100(v: number): number {
  return Math.max(0, Math.min(100, Math.round(v)));
}

/** Build a Mistral-style [INST] … [/INST] prompt string. */
export function mistralPrompt(systemMsg: string, userMsg: string): string {
  return `<s>[INST] ${systemMsg.trim()}\n\n${userMsg.trim()} [/INST]`;
}

/** Tokenise text into lower-cased words longer than 2 characters. */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s+#.]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2);
}

export function stableTextHash(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

function replaceAllWithCount(text: string, regex: RegExp, replacement: string): { text: string; count: number } {
  let count = 0;
  const next = text.replace(regex, () => {
    count += 1;
    return replacement;
  });
  return { text: next, count };
}

export function scrubPII(input: string): { text: string; redactions: number } {
  let text = input;
  let redactions = 0;

  const steps: Array<[RegExp, string]> = [
    [/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[EMAIL]'],
    [/\b(?:\+?\d[\d\s().-]{7,}\d)\b/g, '[PHONE]'],
    [/\bhttps?:\/\/[^\s]+/gi, '[URL]'],
    [/\b(?:www\.)?[a-z0-9-]+\.[a-z]{2,}(?:\/[^\s]*)?/gi, '[URL]'],
    [/\b(linkedin|github)\s*:\s*[^\s]+/gi, '$1: [URL]'],
  ];

  for (const [regex, replacement] of steps) {
    const res = replaceAllWithCount(text, regex, replacement);
    text = res.text;
    redactions += res.count;
  }

  return { text, redactions };
}
import { createHash } from 'node:crypto';
