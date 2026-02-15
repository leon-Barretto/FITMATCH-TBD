import type { BiasHeatmapIntensities } from "@/lib/decisionos";
import type { FitCriteria, FitScoreBreakdown, FinalScore } from "./types";
import type { RegretRiskResult } from "@/lib/decisionos";

const CRITERIA_LABELS: Record<FitCriteria, string> = {
  bodyProportion: "Body proportion", comfort: "Comfort", budget: "Budget",
  occasionSuitability: "Occasion fit", styleAlignment: "Style alignment",
  versatility: "Versatility", sustainability: "Sustainability",
};

export function computeFinalFitMatchScore(
  fitScore: FitScoreBreakdown,
  reflectionScore: number,
  regretRisk: RegretRiskResult | null,
  heatmap: BiasHeatmapIntensities | null
): FinalScore {
  const final = Math.round(Math.max(0, Math.min(100, 0.7 * fitScore.total + 0.3 * reflectionScore)) * 10) / 10;
  const socialProof = heatmap?.socialProof ?? 0;
  const scarcity = heatmap?.scarcity ?? 0;

  let verdict: FinalScore["verdict"];
  if (regretRisk?.label === "High" || scarcity >= 3 || socialProof >= 3) {
    verdict = "PAUSE 72H";
  } else if (final < 65) {
    verdict = "PROCEED WITH CHANGES";
  } else {
    verdict = "PROCEED";
  }

  const topReasons: string[] = [];
  const entries = (Object.entries(fitScore.byCriterion) as [FitCriteria, number][]).sort((a, b) => a[1] - b[1]);
  for (let i = 0; i < Math.min(2, entries.length); i++) {
    if (entries[i][1] < 70) topReasons.push(`Low ${CRITERIA_LABELS[entries[i][0]].toLowerCase()} score`);
  }
  if (socialProof >= 3 || scarcity >= 3) topReasons.push("Strong bias signals detected");
  if (regretRisk?.label === "High") topReasons.push("High regret risk");
  if (topReasons.length === 0) topReasons.push("Solid overall fit", "Reflection aligned");

  const nextActions: string[] = [];
  if (verdict === "PAUSE 72H") {
    nextActions.push("Wait 72 hours before committing.", "Compare 2 alternatives.");
  } else if (verdict === "PROCEED WITH CHANGES") {
    nextActions.push(fitScore.notes[0] ?? "Re-check budget and context.", "Re-check constraints.");
  } else {
    nextActions.push("Verify dress code.", "Proceed when ready.");
  }

  return { finalScore: final, verdict, topReasons: topReasons.slice(0, 2), nextActions: nextActions.slice(0, 2) };
}
