import { Router, type Request, type Response } from 'express';
import { HfInference } from '@huggingface/inference';
import { MODELS, SENTIMENT_LABEL_MAP, THEME_CANDIDATES } from '../models.js';
import { parseJSON, clamp100, mistralPrompt } from '../utils.js';
import type {
  SentimentRequestBody, MistralWritingResult,
  SentimentResult, HFTextClassificationResult,
  HFZeroShotResult, ApiSuccess, ApiError,
} from '../types.js';

const router = Router();

/** Safely extract the top classification label and score. */
function parseTopLabel(raw: HFTextClassificationResult): { label: string; score: number } {
  if (Array.isArray(raw)) {
    const first = Array.isArray(raw[0]) ? raw[0][0] : raw[0];
    if (first && typeof first === 'object' && 'label' in first) {
      return { label: first.label as string, score: (first.score as number) ?? 0 };
    }
  }
  return { label: 'LABEL_1', score: 0.5 }; // neutral fallback
}

router.post('/', async (
  req: Request<Record<string, never>, ApiSuccess<SentimentResult> | ApiError, SentimentRequestBody>,
  res: Response<ApiSuccess<SentimentResult> | ApiError>,
): Promise<void> => {
  const { text } = req.body;
  if (!text?.trim()) { res.status(400).json({ error: 'text is required' }); return; }

  const hf = new HfInference(process.env['HF_TOKEN']);

  // ── Run all three models concurrently ────────────────────────────────────
  const [sentimentResult, themeResult, writingResult] = await Promise.allSettled([

    // 1. Cardiff RoBERTa
    hf.textClassification({ model: MODELS.SENTIMENT, inputs: text.slice(0, 512) }),

    // 2. BART zero-shot theme detection
    hf.zeroShotClassification({
      model:  MODELS.ZERO_SHOT,
      inputs: text.slice(0, 1024),
      parameters: { candidate_labels: [...THEME_CANDIDATES], multi_label: true },
    }),

    // 3. Mistral writing quality
    hf.textGeneration({
      model:  MODELS.TEXT_GEN,
      inputs: mistralPrompt(
        `You are an expert writing coach for professional recruitment documents.
Analyse the text and return ONLY a valid JSON object. No markdown, no extra text.`,
        `Analyse this professional text and return this exact JSON:

{
  "overall_tone":          "Confident|Professional|Casual|Uncertain|Formal|Enthusiastic",
  "tone_score":            <0-100>,
  "clarity_score":         <0-100>,
  "confidence_score":      <0-100>,
  "professionalism_score": <0-100>,
  "writing_quality_score": <0-100>,
  "power_words":           ["word1"],
  "weak_phrases":          ["phrase1"],
  "action_verbs":          ["verb1"],
  "improvement_tips":      ["tip1","tip2","tip3"],
  "standout_sentence":     "strongest sentence verbatim, max 30 words",
  "readability":           "Easy|Medium|Advanced"
}

TEXT:
${text.slice(0, 2500)}`,
      ),
      parameters: { max_new_tokens: 600, temperature: 0.3, repetition_penalty: 1.1, return_full_text: false },
    }),
  ]);

  // ── Parse Cardiff result ──────────────────────────────────────────────────
  let sentiment = 'Neutral';
  let toneScore = 50;
  if (sentimentResult.status === 'fulfilled') {
    const { label, score } = parseTopLabel(sentimentResult.value as HFTextClassificationResult);
    sentiment = SENTIMENT_LABEL_MAP[label] ?? label;
    toneScore = clamp100(score * 100);
  } else {
    console.warn('[sentiment] Cardiff failed:', sentimentResult.reason);
  }

  // ── Parse theme result ────────────────────────────────────────────────────
  let keyThemes: string[] = [];
  if (themeResult.status === 'fulfilled') {
    const zs = themeResult.value as HFZeroShotResult;
    keyThemes = (zs.labels ?? [])
      .map((label, i) => ({ label, score: zs.scores[i] ?? 0 }))
      .filter(x => x.score > 0.35)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map(x => x.label);
  } else {
    console.warn('[sentiment] Zero-shot failed:', themeResult.reason);
  }

  // ── Parse Mistral result ──────────────────────────────────────────────────
  let writing: MistralWritingResult = {};
  if (writingResult.status === 'fulfilled') {
    try { writing = parseJSON<MistralWritingResult>(writingResult.value.generated_text); }
    catch (e) { console.warn('[sentiment] Mistral parse failed:', e instanceof Error ? e.message : String(e)); }
  } else {
    console.warn('[sentiment] Mistral failed:', writingResult.reason);
  }

  const result: SentimentResult = {
    sentiment,
    overall_tone:          writing.overall_tone          ?? 'Professional',
    tone_score:            writing.tone_score             ?? toneScore,
    clarity_score:         clamp100(writing.clarity_score         ?? 65),
    confidence_score:      clamp100(writing.confidence_score      ?? 65),
    professionalism_score: clamp100(writing.professionalism_score ?? 70),
    writing_quality_score: clamp100(writing.writing_quality_score ?? 65),
    power_words:           writing.power_words      ?? [],
    weak_phrases:          writing.weak_phrases     ?? [],
    action_verbs:          writing.action_verbs     ?? [],
    improvement_tips:      writing.improvement_tips ?? [],
    standout_sentence:     writing.standout_sentence ?? null,
    readability:           writing.readability      ?? 'Medium',
    key_themes:            keyThemes.length ? keyThemes : (writing.key_themes ?? []),
    word_count:            text.trim().split(/\s+/).length,
  };

  res.json({ success: true, data: result });
});

export default router;
