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
