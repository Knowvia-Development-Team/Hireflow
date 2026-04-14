import { createHash } from 'node:crypto';

export type SkillKind = 'required' | 'nice';

export interface SkillGapOptions {
  requiredWeight?: number;
  niceWeight?: number;
}

export interface SkillGapStrength {
  skill: string;
  evidence: string[];
}

export interface SkillGapMissing {
  skill: string;
  reason: string;
}

export interface SkillGapResult {
  fitScore: number; // 0-100
  confidence: number; // 0-100
  needsReview: boolean;
  explanations: string[];
  version: string;
  strengths: SkillGapStrength[];
  missing: SkillGapMissing[];
  summary: string[]; // 3-6 bullets
}

interface SkillDef {
  skill: string;
  terms: readonly string[];
}

const ANALYSIS_VERSION = 'skill-gap-v2';

// Base synonym mapping (used only when job mentions the skill)
const BASE_SKILLS: readonly SkillDef[] = [
  { skill: 'Java', terms: ['java'] },
  { skill: 'PHP', terms: ['php'] },
  { skill: 'JavaScript', terms: ['javascript', 'js'] },
  { skill: 'TypeScript', terms: ['typescript', 'ts'] },
  { skill: 'Node.js', terms: ['node.js', 'nodejs', 'node'] },
  { skill: 'Express', terms: ['express', 'express.js', 'expressjs'] },
  { skill: 'React', terms: ['react', 'react.js', 'reactjs'] },
  { skill: 'React Query', terms: ['react query', 'tanstack query', 'tanstack/react-query'] },
  { skill: 'Laravel', terms: ['laravel'] },
  { skill: 'HTML', terms: ['html', 'html5'] },
  { skill: 'CSS', terms: ['css', 'css3'] },
  { skill: 'Bootstrap', terms: ['bootstrap'] },
  { skill: 'PostgreSQL', terms: ['postgresql', 'postgres', 'psql'] },
  { skill: 'MySQL', terms: ['mysql'] },
  { skill: 'MongoDB', terms: ['mongodb', 'mongo'] },
  { skill: 'SQL', terms: ['sql', 'relational database', 'relational databases', 'rdbms'] },
  { skill: 'REST APIs', terms: ['rest', 'rest api', 'rest apis', 'api', 'apis'] },
  { skill: 'Git', terms: ['git', 'github', 'gitlab', 'bitbucket'] },
  { skill: 'Debugging', terms: ['debug', 'debugging', 'troubleshoot', 'troubleshooting'] },
  { skill: 'Testing', terms: ['test', 'testing', 'unit test', 'unit tests', 'integration test', 'integration tests'] },
  { skill: 'Agile', terms: ['agile', 'scrum', 'kanban'] },
  { skill: 'SDLC', terms: ['sdlc', 'software development life cycle', 'software development lifecycle'] },
  { skill: 'OOP', terms: ['oop', 'object oriented', 'object-oriented', 'object oriented programming'] },
  { skill: 'Mobile Development', terms: ['mobile', 'android', 'ios', 'react native'] },
  { skill: 'Web Development', terms: ['web', 'frontend', 'back-end', 'backend', 'full-stack', 'full stack'] },
];

function escapeRegExp(lit: string): string {
  return lit.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function termRegex(term: string): RegExp {
  const pattern = escapeRegExp(term.trim()).replace(/\s+/g, '\\s+');
  // Custom "word boundary" so punctuation terms like "node.js" still match.
  return new RegExp(`(^|[^a-z0-9])${pattern}([^a-z0-9]|$)`, 'i');
}

const STOPWORDS = new Set([
  'and', 'or', 'with', 'using', 'use', 'for', 'the', 'a', 'an', 'to', 'of', 'in', 'on',
  'skills', 'requirements', 'required', 'preferred', 'experience', 'strong', 'ability',
]);

export function stableTextHash(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

function normaliseSnippet(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

function splitSnippets(text: string): string[] {
  return text
    .replace(/\r/g, '')
    .split(/(?:\n{2,}|[.!?]\s+)/)
    .map(normaliseSnippet)
    .filter(Boolean);
}

function inferKind(line: string): SkillKind {
  const s = line.toLowerCase();
  if (/(nice to have|preferred|bonus|plus|good to have)\b/.test(s)) return 'nice';
  if (/\b(must have|required|essential)\b/.test(s)) return 'required';
  return 'required';
}

function findSkillsInText(text: string, defs: readonly SkillDef[]): Set<string> {
  const found = new Set<string>();
  const regexMap: ReadonlyMap<string, readonly RegExp[]> = new Map(
    defs.map(def => [def.skill, def.terms.map(termRegex)] as const),
  );
  for (const def of defs) {
    const regs = regexMap.get(def.skill) ?? [];
    if (regs.some(r => r.test(text))) found.add(def.skill);
  }
  return found;
}

function extractCustomSkills(jobText: string): SkillDef[] {
  const lines = jobText.replace(/\r/g, '').split(/\n+/).map(l => l.trim()).filter(Boolean);
  const skills: SkillDef[] = [];
  for (const line of lines) {
    if (!/(skills?|requirements?|technolog(y|ies)|stack|experience with|tools)/i.test(line)) continue;
    const parts = line
      .replace(/^[^:]*:/, '')
      .split(/[,/]| and | or /i)
      .map(p => p.trim())
      .filter(Boolean);
    for (const part of parts) {
      const clean = part.replace(/[^a-z0-9.+#\s-]/gi, '').trim();
      if (!clean || clean.length < 2) continue;
      const lower = clean.toLowerCase();
      if (STOPWORDS.has(lower)) continue;
      skills.push({ skill: clean, terms: [clean.toLowerCase()] });
    }
  }
  return skills;
}

function buildTaxonomy(jobText: string): SkillDef[] {
  const custom = extractCustomSkills(jobText);
  const baseMatched = BASE_SKILLS.filter(def =>
    def.terms.some(t => termRegex(t).test(jobText)),
  );
  const seen = new Set(custom.map(c => c.skill.toLowerCase()));
  for (const def of baseMatched) {
    const key = def.skill.toLowerCase();
    if (!seen.has(key)) custom.push(def);
  }
  return custom.length ? custom : BASE_SKILLS;
}

function extractJobSkills(jobText: string, defs: readonly SkillDef[]): Map<string, SkillKind> {
  const map = new Map<string, SkillKind>();
  const lines = jobText.replace(/\r/g, '').split(/\n+/).map(l => l.trim()).filter(Boolean);
  for (const line of lines) {
    const kind = inferKind(line);
    const skills = findSkillsInText(line, defs);
    for (const skill of skills) {
      const prev = map.get(skill);
      // required overrides nice
      if (prev === 'required') continue;
      map.set(skill, kind === 'required' ? 'required' : (prev ?? kind));
    }
  }
  // Fallback: scan whole job text if line-based extraction found nothing.
  if (map.size === 0) {
    for (const skill of findSkillsInText(jobText, defs)) map.set(skill, 'required');
  }
  return map;
}

function extractCvSkills(cvText: string, defs: readonly SkillDef[]): Set<string> {
  return findSkillsInText(cvText, defs);
}

function evidenceForSkill(cvText: string, def: SkillDef, max = 3): string[] {
  const regs = def.terms.map(termRegex);
  if (!regs.length) return [];
  const snippets = splitSnippets(cvText);
  const hits: string[] = [];
  for (const snip of snippets) {
    if (regs.some(r => r.test(snip))) {
      const clipped = snip.length > 180 ? `${snip.slice(0, 177)}...` : snip;
      hits.push(clipped);
      if (hits.length >= max) break;
    }
  }
  return hits;
}

export function analyseSkillGap(
  jobText: string,
  cvText: string,
  options?: SkillGapOptions,
): SkillGapResult {
  const requiredWeight = options?.requiredWeight ?? 1;
  const niceWeight = options?.niceWeight ?? 0.5;

  const taxonomy = buildTaxonomy(jobText);
  const defMap = new Map(taxonomy.map(d => [d.skill, d]));
  const jobSkills = extractJobSkills(jobText, taxonomy);
  const cvSkills = extractCvSkills(cvText, taxonomy);

  const strengths: SkillGapStrength[] = [];
  const missing: SkillGapMissing[] = [];

  let total = 0;
  let matched = 0;

  const entries = [...jobSkills.entries()].sort(([aSkill, aKind], [bSkill, bKind]) => {
    if (aKind !== bKind) return aKind === 'required' ? -1 : 1;
    return aSkill.localeCompare(bSkill);
  });

  for (const [skill, kind] of entries) {
    const weight = kind === 'required' ? requiredWeight : niceWeight;
    total += weight;
    if (cvSkills.has(skill)) {
      matched += weight;
      const def = defMap.get(skill);
      strengths.push({ skill, evidence: def ? evidenceForSkill(cvText, def) : [] });
    } else {
      missing.push({
        skill,
        reason: kind === 'required'
          ? 'Required by the job, but not mentioned in the CV.'
          : 'Nice-to-have skill mentioned in the job, but not present in the CV.',
      });
    }
  }

  const fitScore = total > 0 ? Math.max(0, Math.min(100, Math.round((matched / total) * 100))) : 0;

  const topStrengths = strengths
    .slice()
    .sort((a, b) => (b.evidence.length - a.evidence.length) || a.skill.localeCompare(b.skill))
    .slice(0, 3)
    .map(s => s.skill);
  const topMissing = missing.slice(0, 3).map(m => m.skill);

  const requiredCount = entries.filter(([, k]) => k === 'required').length;
  const requiredMatched = entries.filter(([s, k]) => k === 'required' && cvSkills.has(s)).length;
  const niceCount = entries.filter(([, k]) => k === 'nice').length;
  const niceMatched = entries.filter(([s, k]) => k === 'nice' && cvSkills.has(s)).length;

  const summary: string[] = [];
  const explanations: string[] = [];
  summary.push(`Fit score: ${fitScore}/100.`);
  if (requiredCount > 0) summary.push(`Required skills matched: ${requiredMatched}/${requiredCount}.`);
  if (niceCount > 0) summary.push(`Nice-to-have skills matched: ${niceMatched}/${niceCount}.`);
  if (topStrengths.length) summary.push(`Strengths: ${topStrengths.join(', ')}.`);
  if (topMissing.length) summary.push(`Missing: ${topMissing.join(', ')}.`);

  explanations.push(`Job taxonomy derived from ${taxonomy.length} skill entries found in the job text.`);
  if (requiredCount > 0) explanations.push(`Matched ${requiredMatched}/${requiredCount} required skills.`);
  if (niceCount > 0) explanations.push(`Matched ${niceMatched}/${niceCount} nice-to-have skills.`);
  if (missing.length > 0) explanations.push(`Missing skills include: ${missing.slice(0, 3).map(m => m.skill).join(', ')}.`);

  const finalSummary = summary.slice(0, 6);
  while (finalSummary.length < 3) finalSummary.push('Review evidence snippets to validate key claims.');

  const evidenceCount = strengths.reduce((acc, s) => acc + (s.evidence?.length ?? 0), 0);
  const coverageScore = total > 0 ? (matched / total) * 100 : 0;
  const evidenceScore = Math.min(100, evidenceCount * 12);
  const confidence = Math.max(0, Math.min(100, Math.round(coverageScore * 0.7 + evidenceScore * 0.3)));
  const needsReview = confidence < 60 || requiredCount < 3;

  return {
    fitScore,
    confidence,
    needsReview,
    explanations,
    version: ANALYSIS_VERSION,
    strengths,
    missing,
    summary: finalSummary,
  };
}
