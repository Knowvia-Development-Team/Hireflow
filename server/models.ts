export const MODELS = {
  TEXT_GEN:   'mistralai/Mistral-7B-Instruct-v0.3',
  EMBEDDINGS: 'sentence-transformers/all-MiniLM-L6-v2',
  SENTIMENT:  'cardiffnlp/twitter-roberta-base-sentiment-latest',
  ZERO_SHOT:  'facebook/bart-large-mnli',
} as const;

export type ModelKey = keyof typeof MODELS;

export const SENTIMENT_LABEL_MAP: Readonly<Record<string, string>> = {
  LABEL_0: 'Negative',
  LABEL_1: 'Neutral',
  LABEL_2: 'Positive',
};

export const THEME_CANDIDATES = [
  'leadership', 'technical skills', 'collaboration', 'innovation',
  'problem solving', 'communication', 'results-driven', 'growth mindset',
  'customer focus', 'project management', 'attention to detail',
] as const;
