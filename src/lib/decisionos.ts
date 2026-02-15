export type RegretRiskInputs = {
  context: string;
  fit: string;
  budget: string;
  influence: string;
  values: string;
  confidenceBefore: number;
};

export type RegretRiskResult = { score: number; label: "Low" | "Moderate" | "High"; drivers: string[] };

export function computeRegretRisk(inputs: RegretRiskInputs): RegretRiskResult {
  let score = 50;
  const driverReasons: string[] = [];
  const ctx = (inputs.context || "").trim();
  const fit = (inputs.fit || "").trim();
  const budget = (inputs.budget || "").trim().toLowerCase();
  const influence = (inputs.influence || "").trim().toLowerCase();
  const values = (inputs.values || "").trim();
  const confBefore = inputs.confidenceBefore ?? 50;

  if (influence.length >= 10 && /tiktok|instagram|youtube|influencer/.test(influence)) {
    score += 10;
    driverReasons.push("Influence from social media");
  }
  if (/stretch|over|credit|loan/.test(budget)) {
    score += 8;
    driverReasons.push("Budget may be a stretch");
  }
  if (confBefore >= 85 && (budget.length < 10 || influence.length < 10)) {
    score += 6;
    driverReasons.push("High confidence with little detail");
  }
  if (!values) {
    score += 6;
    driverReasons.push("No values selected");
  }
  if (budget.length >= 25) {
    score -= 8;
    driverReasons.push("Clear budgeting");
  }
  if (ctx.length >= 25) {
    score -= 8;
    driverReasons.push("Clear context");
  }

  score = Math.max(0, Math.min(100, score));
  const label: RegretRiskResult["label"] = score <= 33 ? "Low" : score <= 66 ? "Moderate" : "High";
  const drivers = driverReasons.slice(0, 2);
  if (drivers.length === 0) drivers.push(score <= 33 ? "Clear context" : "Mixed signals");
  return { score, label, drivers };
}

export type BiasHeatmapIntensities = {
  socialProof: number;
  scarcity: number;
  brandPrestige: number;
  haloEffect: number;
};

const BIAS_KEYWORDS = {
  socialProof: ["everyone", "viral", "trending", "popular", "friends have", "saw it on"],
  scarcity: ["limited", "last chance", "sell out", "running out", "only", "exclusive"],
  brandPrestige: ["designer", "luxury", "brand", "prestige", "premium", "expensive"],
  haloEffect: ["favorite", "love it", "must have", "obsessed", "icon"],
};

export function computeBiasHeatmap(text: string): BiasHeatmapIntensities & { rows: { key: string; label: string; intensity: number; interpretation: string }[] } {
  const lower = (text || "").toLowerCase();
  const count = (keywords: readonly string[]) => Math.min(5, keywords.filter((k) => lower.includes(k)).length);
  const socialProof = count(BIAS_KEYWORDS.socialProof);
  const scarcity = count(BIAS_KEYWORDS.scarcity);
  const brandPrestige = count(BIAS_KEYWORDS.brandPrestige);
  const haloEffect = count(BIAS_KEYWORDS.haloEffect);

  const rows = [
    { key: "socialProof", label: "Social Proof", intensity: socialProof, interpretation: socialProof >= 3 ? "High social proof" : "Low" },
    { key: "scarcity", label: "Scarcity", intensity: scarcity, interpretation: scarcity >= 3 ? "Urgency signals" : "Low" },
    { key: "brandPrestige", label: "Brand Prestige", intensity: brandPrestige, interpretation: brandPrestige >= 3 ? "Status focus" : "Low" },
    { key: "haloEffect", label: "Halo Effect", intensity: haloEffect, interpretation: haloEffect >= 3 ? "Strong attachment" : "Low" },
  ];
  return { socialProof, scarcity, brandPrestige, haloEffect, rows };
}

export function computeReflectionScore(inputs: {
  regretRisk: RegretRiskResult | null;
  heatmap: BiasHeatmapIntensities | null;
  confidenceBefore: number;
  confidenceAfter: number;
  values: string;
}): { total: number; breakdown: { riskComponent: number; biasComponent: number; calibrationComponent: number; valuesComponent: number } } {
  const { regretRisk, heatmap, confidenceBefore, confidenceAfter, values } = inputs;
  const riskScore = regretRisk?.score ?? 50;
  let base = 100 - riskScore;
  const riskComponent = Math.max(0, 100 - riskScore);

  const biasTotal = (heatmap?.socialProof ?? 0) + (heatmap?.scarcity ?? 0) + (heatmap?.brandPrestige ?? 0) + (heatmap?.haloEffect ?? 0);
  const penalty = Math.min(30, biasTotal * 3);
  const biasComponent = Math.max(0, 100 - penalty);
  base -= penalty;

  const delta = confidenceAfter - confidenceBefore;
  let calibrationComponent = 50;
  if (delta <= -10) {
    calibrationComponent = 58;
    base += 8;
  } else if (Math.abs(delta) <= 5) {
    calibrationComponent = 54;
    base += 4;
  } else if (delta >= 15 && (heatmap?.socialProof ?? 0) >= 3) {
    calibrationComponent = 44;
    base -= 6;
  }

  const valuesComponent = (values || "").trim() ? 55 : 45;
  base += (values || "").trim() ? 5 : -5;

  const total = Math.max(0, Math.min(100, Math.round(base * 10) / 10));
  return { total, breakdown: { riskComponent, biasComponent, calibrationComponent, valuesComponent } };
}

export type DetectAssumptionsResult = { assumptions: string[] };

export function detectAssumptions(inputs: RegretRiskInputs): DetectAssumptionsResult {
  const assumptions: string[] = [];
  const ctx = (inputs.context || "").trim();
  const fit = (inputs.fit || "").trim();
  const budget = (inputs.budget || "").trim().toLowerCase();
  const influence = (inputs.influence || "").trim().toLowerCase();

  if (ctx.length >= 5 && /assume|probably|likely|expect/.test(ctx.toLowerCase())) {
    assumptions.push("You may be assuming the situation requires a specific look or formality.");
  }
  if (influence.length >= 10 && /everyone|viral|popular|friends/.test(influence)) {
    assumptions.push("You may be assuming others' choices align with your own priorities.");
  }
  if (budget.length >= 10 && /worth it|quality|premium/.test(budget)) {
    assumptions.push("You may be assuming higher price means better outcome.");
  }
  if (fit.length >= 5 && fit.length < 20) {
    assumptions.push("You may be assuming fit needs are clear without detailing constraints.");
  }
  if (!assumptions.length) {
    assumptions.push("You may be assuming one option is clearly best.", "You may be assuming the decision is urgent.");
  }
  return { assumptions: assumptions.slice(0, 3) };
}
