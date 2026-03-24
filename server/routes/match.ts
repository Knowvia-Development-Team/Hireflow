import { Router, type Request, type Response } from 'express';
import { HfInference } from '@huggingface/inference';
import { MODELS }      from '../models.js';
import { parseJSON, cosineSim, clamp100, mistralPrompt, tokenize } from '../utils.js';
import type { MatchRequestBody, MistralMatchResult, MatchResult, ApiSuccess, ApiError } from '../types.js';

const router = Router();

/** Embed a list of strings and return their feature vectors. */
async function embedAll(hf: HfInference, texts: string[]): Promise<number[][]> {
  const results = await Promise.all(
    texts.map(t => hf.featureExtraction({ model: MODELS.EMBEDDINGS, inputs: t })),
  );
  return results.map((r: number[] | number[][]) => {
    // HF returns number[] | number[][] depending on batch size; normalise to 1-D
    if (Array.isArray(r[0])) return r[0] as number[];
    return r as number[];
  });
}

/** Best cosine match for each JD skill vector against all CV skill vectors. */
function skillMatchScore(cvVecs: number[][], jdVecs: number[][]): number {
  if (!cvVecs.length || !jdVecs.length) return 0;
  const scores = jdVecs.map(jdVec =>
    Math.max(...cvVecs.map(cvVec => cosineSim(cvVec, jdVec))),
  );
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

router.post('/', async (
  req: Request<Record<string, never>, ApiSuccess<MatchResult> | ApiError, MatchRequestBody>,
  res: Response<ApiSuccess<MatchResult> | ApiError>,
): Promise<void> => {
  const { cvText, jobText } = req.body;
  if (!cvText?.trim())  { res.status(400).json({ error: 'cvText is required'  }); return; }
  if (!jobText?.trim()) { res.status(400).json({ error: 'jobText is required' }); return; }

  const hf = new HfInference(process.env['HF_TOKEN']);

  // ── Step 1: Mistral skill extraction + qualitative score ──────────────────
  const system = `You are a senior ATS matching engine.
Compare the CV against the job description and return ONLY valid JSON.`;

  const user = `Compare the CV and JOB DESCRIPTION. Return this exact JSON:

{
  "cv_skills":          ["skill"],
  "jd_skills":          ["required skill"],
  "matched_skills":     ["skills in both"],
  "missing_skills":     ["JD skills absent from CV"],
  "bonus_skills":       ["valuable CV skills not in JD"],
  "qualitative_score":  <0-100>,
  "recommendation":     "Strong Match|Good Match|Partial Match|Poor Match",
  "summary":            "2-sentence verdict",
  "experience_fit":     {"score":<0-100>,"note":"one sentence"},
  "education_fit":      {"score":<0-100>,"note":"one sentence"},
  "interview_questions":["Q1?","Q2?","Q3?"],
  "risks":              ["risk1"],
  "culture_signals":    ["signal1"]
}

CV:
${cvText.slice(0, 2000)}

JOB DESCRIPTION:
${jobText.slice(0, 1500)}`;

  let mistralData: MistralMatchResult;
  try {
    const out = await hf.textGeneration({
      model:  MODELS.TEXT_GEN,
      inputs: mistralPrompt(system, user),
      parameters: { max_new_tokens: 700, temperature: 0.2, repetition_penalty: 1.1, return_full_text: false },
    });
    mistralData = parseJSON<MistralMatchResult>(out.generated_text);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[match] Mistral step failed:', msg);
    res.status(500).json({ error: `Skill extraction failed: ${msg}` });
    return;
  }

  // ── Step 2: Semantic similarity via MiniLM embeddings ────────────────────
  let semanticScore = 50;
  try {
    const cvSkills = (mistralData.cv_skills ?? []).slice(0, 20);
    const jdSkills = (mistralData.jd_skills ?? []).slice(0, 20);
    if (cvSkills.length && jdSkills.length) {
      const [cvVecs, jdVecs] = await Promise.all([embedAll(hf, cvSkills), embedAll(hf, jdSkills)]);
      semanticScore = clamp100(skillMatchScore(cvVecs, jdVecs) * 100);
    }
  } catch (err) {
    console.warn('[match] Embedding step failed (using fallback):', err instanceof Error ? err.message : String(err));
  }

  // ── Step 3: Keyword overlap ───────────────────────────────────────────────
  const cvTokens    = new Set(tokenize(cvText));
  const jdTokens    = tokenize(jobText);
  const overlap     = jdTokens.filter(t => cvTokens.has(t)).length;
  const keywordScore = clamp100((overlap / Math.max(jdTokens.length, 1)) * 200);

  // ── Weighted composite score ──────────────────────────────────────────────
  const qualScore  = clamp100(mistralData.qualitative_score ?? 60);
  const finalScore = clamp100(semanticScore * 0.50 + keywordScore * 0.20 + qualScore * 0.30);

  const result: MatchResult = {
    ...mistralData,
    overall_score: finalScore,
    category_scores: {
      skills:      semanticScore,
      experience:  clamp100(mistralData.experience_fit?.score ?? qualScore),
      education:   clamp100(mistralData.education_fit?.score  ?? 70),
      soft_skills: clamp100(keywordScore * 0.8 + qualScore * 0.2),
    },
    _meta: { semantic_score: semanticScore, keyword_score: keywordScore, qualitative_score: qualScore },
  };

  res.json({ success: true, data: result });
});

export default router;
