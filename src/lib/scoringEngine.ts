import type { Outfit } from "@/lib/fitmatch/types";
import { computeFitScore, DEFAULT_WEIGHTS } from "@/lib/fitmatch/scoring";
import type { BiasHeatmapIntensities } from "@/lib/decisionos";
import type { BiasAudit } from "@/lib/fitmatch/useBiasAudit";

export type UserProfile = {
  occasion: string;
  context: string;
  budget: string;
  budgetText: string;
  values: string;
};

export type BiasSignals = {
  socialProof: number;
  scarcity: number;
  brandPrestige: number;
  haloEffect: number;
};

export type OutfitReasoning = {
  contextMatch: string;
  valueAlignment: string;
  budgetComfort: string;
  biasExposure: string;
};

export type OutfitScoreResult = {
  score: number;
  reasoning: OutfitReasoning;
  fitScore: ReturnType<typeof computeFitScore>;
  influenceRiskLevel: "Low" | "Moderate" | "High";
};

function extractBiasSignals(source: BiasAudit | BiasHeatmapIntensities): BiasSignals {
  if ("socialProof" in source && typeof (source as BiasAudit).socialProof === "object") {
    const audit = source as BiasAudit;
    return {
      socialProof: audit.socialProof.score,
      scarcity: audit.scarcity.score,
      brandPrestige: audit.brandPrestige.score,
      haloEffect: audit.haloEffect.score,
    };
  }
  return source as BiasSignals;
}

function computeInfluenceRiskLevel(signals: BiasSignals): "Low" | "Moderate" | "High" {
  const avg = (signals.socialProof + signals.scarcity + signals.brandPrestige + signals.haloEffect) / 4;
  if (avg < 2) return "Low";
  if (avg < 3.5) return "Moderate";
  return "High";
}

function computeBiasRiskPenalty(signals: BiasSignals): number {
  let count = 0;
  if (signals.socialProof >= 3) count += 1;
  if (signals.scarcity >= 3) count += 1;
  if (signals.brandPrestige >= 3) count += 1;
  return Math.min(20, count * (20 / 3));
}

function computeValuesAlignment(outfit: Outfit, values: string): { score: number; text: string } {
  const v = (values || "").trim().toLowerCase();
  let score = 70;
  const reasons: string[] = [];
  if (/sustainability|sustainable|eco|green|secondhand|capsule/.test(v)) {
    if (outfit.baseRatings.sustainability >= 7) {
      score = 90;
      reasons.push("Strong sustainability alignment");
    } else if (outfit.baseRatings.sustainability >= 5) {
      score = 75;
      reasons.push("Moderate sustainability fit");
    } else {
      score = 55;
      reasons.push("Sustainability goals may not be met");
    }
  }
  if (/longevity|versatile|versatility|multi/.test(v)) {
    if (outfit.baseRatings.versatility >= 8) {
      score = Math.max(score, 90);
      reasons.push("Highly versatile for multiple contexts");
    } else if (outfit.baseRatings.versatility >= 6) {
      score = Math.max(score, 75);
      reasons.push("Good versatility");
    }
  }
  if (/expression|style|personal/.test(v) && outfit.baseRatings.styleAlignment >= 7) {
    score = Math.max(score, 85);
    reasons.push("Aligns with style expression");
  }
  if (reasons.length === 0) reasons.push("Values not specified; using neutral baseline");
  return { score, text: reasons.join(". ") };
}

function computeBudgetSafety(outfit: Outfit, budget: string): { score: number; text: string } {
  const rating = outfit.baseRatings.budget;
  const under100 = /under \$?100|<\s*100/i.test(budget);
  const mid = /\$?100[-–]\s*\$?250|100-250/i.test(budget);
  if (under100) {
    if (rating >= 8) return { score: 95, text: "Well within budget; outfit is cost-friendly" };
    if (rating >= 6) return { score: 80, text: "Within budget with some flexibility" };
    return { score: 60, text: "May stretch budget; review cost" };
  }
  if (mid) {
    if (rating >= 7) return { score: 90, text: "Comfortable within budget range" };
    if (rating >= 5) return { score: 75, text: "Reasonable for budget" };
    return { score: 55, text: "Approaching budget limit" };
  }
  if (rating >= 6) return { score: 85, text: "Budget flexibility allows this choice" };
  return { score: 70, text: "Within higher budget range" };
}

function computeContextMatch(outfit: Outfit, occasion: string, context: string): { score: number; text: string } {
  const occ = (occasion || "").toLowerCase();
  const ctx = (context || "").toLowerCase();
  const suit = outfit.baseRatings.occasionSuitability;
  let text = "";
  if (suit >= 8) {
    text = `Strong fit for ${occasion}`;
    if (ctx.length >= 10) text += "; your context reinforces suitability";
  } else if (suit >= 6) {
    text = `Appropriate for ${occasion}`;
    if (ctx.length >= 10) text += "; context adds nuance";
  } else {
    text = `May be under- or overdressed for ${occasion}`;
  }
  const score = Math.min(100, suit * 10);
  return { score, text };
}

function buildBiasExposureText(signals: BiasSignals, penalty: number): string {
  if (penalty <= 0) return "Low bias exposure in your inputs; outfit choice is less influenced";
  const parts: string[] = [];
  if (signals.socialProof >= 3) parts.push("social proof");
  if (signals.scarcity >= 3) parts.push("scarcity");
  if (signals.brandPrestige >= 3) parts.push("brand prestige");
  if (parts.length > 0) {
    return `Higher influence risk from ${parts.join(", ")}; consider waiting 72h or comparing alternatives`;
  }
  return "Moderate bias exposure; reflect before committing";
}

/**
 * Calculates a dynamic outfit score using weighted components:
 * - FitScore: 40%
 * - ValuesAlignment: 20%
 * - BudgetSafety: 20%
 * - BiasRiskPenalty: -20% (increases when socialProof, scarcity, or brandPrestige >= 3)
 */
export function calculateOutfitScore(
  outfit: Outfit,
  userProfile: UserProfile,
  biasAudit: BiasAudit | BiasHeatmapIntensities
): OutfitScoreResult {
  const signals = extractBiasSignals(biasAudit);
  const fitScore = computeFitScore(outfit, DEFAULT_WEIGHTS);
  const valuesResult = computeValuesAlignment(outfit, userProfile.values);
  const budgetResult = computeBudgetSafety(outfit, userProfile.budget);
  const contextResult = computeContextMatch(outfit, userProfile.occasion, userProfile.context);
  const biasPenalty = computeBiasRiskPenalty(signals);
  const influenceRiskLevel = computeInfluenceRiskLevel(signals);

  const fitContrib = 0.4 * fitScore.total;
  const valuesContrib = 0.2 * (valuesResult.score / 100) * 100;
  const budgetContrib = 0.2 * (budgetResult.score / 100) * 100;
  const score = Math.round(Math.max(0, Math.min(100, fitContrib + valuesContrib + budgetContrib - biasPenalty)) * 10) / 10;

  const reasoning: OutfitReasoning = {
    contextMatch: contextResult.text,
    valueAlignment: valuesResult.text,
    budgetComfort: budgetResult.text,
    biasExposure: buildBiasExposureText(signals, biasPenalty),
  };

  return { score, reasoning, fitScore, influenceRiskLevel };
}
