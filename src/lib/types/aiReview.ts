/**
 * AI Ranking Review Layer – types and runtime validation for rank-review API.
 */

export type RankReviewScenario = {
  occasion: string;
  weather: string;
  budgetRange: string;
  bodyType: string;
};

export type RankReviewUserProfile = {
  contextText: string;
  fitComfortText: string;
  budgetText: string;
  influenceText: string;
  valuesText: string;
  confidenceBefore: number;
  confidenceAfter: number;
};

export type BiasAuditOrHeatmap = {
  socialProof: number;
  scarcity: number;
  brandPrestige: number;
  haloEffect: number;
};

export type RankReviewCandidate = {
  id: string;
  name: string;
  description: string;
  components?: Record<string, string>;
  tags?: string[];
  baseScore: number;
  baseReasoning: string[];
  fitScore: number;
  influenceRiskLevel: string;
};

export type RankReviewRequest = {
  scenario: RankReviewScenario;
  userProfile: RankReviewUserProfile;
  biasAuditOrHeatmap: BiasAuditOrHeatmap;
  candidates: RankReviewCandidate[];
};

export type RankReviewRecommendation = "Proceed" | "Proceed with caution" | "Wait 24h" | "Wait 72h";

export type CandidateReview = {
  id: string;
  delta: number;
  adjustedScore: number;
  tradeoffs: string[];
  caution: string;
  recommendation: RankReviewRecommendation;
};

export type RankReviewResponse = {
  ok: boolean;
  mode: "online" | "offline";
  reviews: CandidateReview[];
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function clampDelta(d: unknown): number {
  const n = typeof d === "number" && !Number.isNaN(d) ? d : 0;
  return Math.round(clamp(n, -10, 10));
}

function clampScore(s: unknown): number {
  const n = typeof s === "number" && !Number.isNaN(s) ? s : 0;
  return Math.round(clamp(n, 0, 100) * 10) / 10;
}

const VALID_RECOMMENDATIONS: RankReviewRecommendation[] = [
  "Proceed",
  "Proceed with caution",
  "Wait 24h",
  "Wait 72h",
];

function safeRecommendation(r: unknown): RankReviewRecommendation {
  if (typeof r === "string" && VALID_RECOMMENDATIONS.includes(r as RankReviewRecommendation)) {
    return r as RankReviewRecommendation;
  }
  return "Proceed with caution";
}

function safeStringArray(a: unknown): string[] {
  if (!Array.isArray(a)) return [];
  return (a as unknown[])
    .filter((x): x is string => typeof x === "string")
    .slice(0, 3);
}

function safeString(s: unknown): string {
  return typeof s === "string" ? s : "";
}

/**
 * Parse and validate LLM JSON response (or full RankReviewResponse). Returns null if invalid.
 * LLM output may have only "reviews" array; ok/mode are optional.
 */
export function parseRankReviewResponse(data: unknown): { reviews: CandidateReview[] } | null {
  if (!data || typeof data !== "object") return null;
  const obj = data as Record<string, unknown>;

  const reviewsRaw = obj.reviews;
  if (!Array.isArray(reviewsRaw)) return null;

  const reviews: CandidateReview[] = [];
  for (const r of reviewsRaw as unknown[]) {
    if (!r || typeof r !== "object") continue;
    const entry = r as Record<string, unknown>;
    const id = safeString(entry.id);
    if (!id) continue;
    const delta = clampDelta(entry.delta);
    const rawAdjusted = entry.adjustedScore;
    const adjustedScore = typeof rawAdjusted === "number" && !Number.isNaN(rawAdjusted)
      ? clampScore(rawAdjusted)
      : 0;
    const tradeoffs = safeStringArray(entry.tradeoffs);
    const caution = safeString(entry.caution) || "Review your choice against your stated values and budget.";
    const recommendation = safeRecommendation(entry.recommendation);
    reviews.push({ id, delta, adjustedScore, tradeoffs, caution, recommendation });
  }

  return reviews.length > 0 ? { reviews } : null;
}
