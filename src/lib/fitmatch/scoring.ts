import type { FitCriteria, FitScoreBreakdown, Outfit, Weights } from "./types";

export const DEFAULT_WEIGHTS: Record<FitCriteria, number> = {
  bodyProportion: 0.2,
  comfort: 0.15,
  budget: 0.12,
  occasionSuitability: 0.18,
  styleAlignment: 0.12,
  versatility: 0.13,
  sustainability: 0.1,
};

const CRITERIA_ORDER: FitCriteria[] = [
  "bodyProportion", "comfort", "budget", "occasionSuitability",
  "styleAlignment", "versatility", "sustainability",
];

export function normalizeWeights(weights: Weights): Record<FitCriteria, number> {
  const sum = CRITERIA_ORDER.reduce((s, c) => s + (weights[c] ?? DEFAULT_WEIGHTS[c]), 0);
  if (sum <= 0) return { ...DEFAULT_WEIGHTS };
  const out = {} as Record<FitCriteria, number>;
  for (const c of CRITERIA_ORDER) out[c] = (weights[c] ?? DEFAULT_WEIGHTS[c]) / sum;
  return out;
}

export function computeFitScore(outfit: Outfit, weights: Weights = {}): FitScoreBreakdown {
  const w = normalizeWeights(weights);
  const byCriterion: Record<FitCriteria, number> = {} as Record<FitCriteria, number>;
  let total = 0;
  for (const c of CRITERIA_ORDER) {
    const rating = Math.max(0, Math.min(10, outfit.baseRatings[c]));
    const contribution = w[c] * (rating / 10) * 100;
    byCriterion[c] = Math.round(contribution * 10) / 10;
    total += contribution;
  }
  total = Math.round(Math.max(0, Math.min(100, total)) * 10) / 10;

  const notes: string[] = [];
  if (outfit.baseRatings.budget <= 4) notes.push("Consider cost alternatives or secondhand.");
  if (outfit.baseRatings.bodyProportion <= 4) notes.push("Explore silhouette adjustments.");
  if (outfit.baseRatings.sustainability <= 4) notes.push("Consider secondhand or capsule approach.");

  return { total, byCriterion, notes };
}
