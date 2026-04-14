import { Router, type Request, type Response } from 'express';
import { HfInference } from '@huggingface/inference';
import { MODELS }      from '../models.js';
import { parseJSON, mistralPrompt, clamp100, scrubPII, stableTextHash } from '../utils.js';
import type { ExtractRequestBody, ExtractResult, ApiSuccess, ApiError } from '../types.js';
import { storeAnalysisVersion } from '../services/analysis-version-store.js';

const router = Router();

router.post('/', async (
  req: Request<Record<string, never>, ApiSuccess<ExtractResult> | ApiError, ExtractRequestBody>,
  res: Response<ApiSuccess<ExtractResult> | ApiError>,
): Promise<void> => {
  const { text } = req.body;
  if (!text?.trim()) { res.status(400).json({ error: 'text is required' }); return; }

  const hf = new HfInference(process.env['HF_TOKEN']);

  const { text: safeText, redactions } = scrubPII(text);
  const inputHash = stableTextHash(safeText);

  const system = `You are an expert ATS CV parser.
Extract structured information and return ONLY a valid JSON object. No markdown or extra text.`;

  const user = `Extract all available info from the CV and return this exact JSON schema. Use null for missing fields.

{
  "name": "Full name",
  "email": "email address",
  "phone": "phone number",
  "location": "city, country",
  "title": "current or target job title",
  "summary": "2-sentence professional summary",
  "experience_years": <integer or null>,
  "skills": ["skill1"],
  "languages": ["language1"],
  "education": [{"degree":"","institution":"","year":""}],
  "experience": [{"role":"","company":"","duration":"","highlights":[""]}],
  "certifications": ["cert1"],
  "completeness_score": <0-100>,
  "completeness_notes": "brief note",
  "strengths": ["strength1"],
  "red_flags": ["flag1"]
}

CV TEXT:
${safeText.slice(0, 3500)}`;

  try {
    const output = await hf.textGeneration({
      model:  MODELS.TEXT_GEN,
      inputs: mistralPrompt(system, user),
      parameters: {
        max_new_tokens:     900,
        temperature:        0.2,
        repetition_penalty: 1.1,
        return_full_text:   false,
      },
    });

    const data = parseJSON<ExtractResult>(output.generated_text);
    if (data.completeness_score != null) {
      data.completeness_score = clamp100(data.completeness_score);
    }
    data._meta = { analysis_version: 'extract-v2', pii_redactions: redactions };
    const appId = (req.body as { applicationId?: string } | undefined)?.applicationId;
    if (appId) {
      try {
        await storeAnalysisVersion({
          applicationId: appId,
          analysisType: 'extract',
          version: data._meta.analysis_version,
          inputHash,
          result: data,
          piiRedactions: redactions,
        });
      } catch (e) {
        console.warn('[extract] version store failed:', e instanceof Error ? e.message : String(e));
      }
    }
    res.json({ success: true, data });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[extract]', msg);
    res.status(500).json({ error: msg });
  }
});

export default router;
