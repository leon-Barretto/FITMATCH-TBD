export type DeinfluenceEvidence = {
  sourceTitle: string;
  sourceUrl: string;
  quote: string;
  whyItMatters: string;
};

export type DeinfluenceRequest = {
  productName?: string;
  productUrl?: string;
  influencerClaim?: string;
  platform?: string;
  sawViaInfluencer?: boolean;
  userContext?: {
    budgetText?: string;
    valuesText?: string;
    bodyType?: string;
    occasion?: string;
    confidenceBefore?: number;
    confidenceAfter?: number;
  };
  youtubeVideos?: Array<{
    title: string;
    channelTitle: string;
    url: string;
    description: string;
    publishedAt: string;
    thumbnail?: string;
  }>;
};

export type DeinfluenceVerdict = "Proceed" | "Proceed with caution" | "Wait 24h" | "Wait 72h";
export type SponsoredRisk = "low" | "moderate" | "high";

export type PersuasionFlag =
  | "Affiliate language"
  | "Urgency framing"
  | "Social proof framing"
  | "Prestige bias"
  | "Vague superlatives";

export type GroundingSummary = {
  groundedEvidenceCount: number;
  unverifiedClaims: string[];
};

export type DeinfluenceResponse = {
  trustScore: number;
  sponsoredRisk: SponsoredRisk;
  marketingTactics: string[];
  evidence: DeinfluenceEvidence[];
  counterpoints: string[];
  verdict: DeinfluenceVerdict;
  reflectionPrompts: string[];
  rationale: string;
  groundingSummary?: GroundingSummary;
  persuasionFlags?: PersuasionFlag[];
  confidenceDelta?: number;
  confidenceInterpretation?: string;
  extractedProductName?: string;
  extractedBrand?: string;
  extractedPrice?: string;
};

// --- Reasoning Coach types ---

export type EvidenceClassification =
  | "sponsored"
  | "neutral_review"
  | "critical_review"
  | "affiliate_driven"
  | "promotional";

export type CoachClaim = {
  raw: string;
  subclaims: Array<{ label: string; description: string }>;
};

export type CoachEvidence = {
  id: string;
  title: string;
  channel: string;
  url: string;
  snippet: string;
  classification: EvidenceClassification;
  sponsorshipSignals: string[];
};

export type CoachContradiction = {
  subclaimLabel: string;
  conflict: string;
  evidenceIds: string[];
};

export type CoachBiasMap = {
  socialProof: number;
  scarcity: number;
  authority: number;
  brandPrestige: number;
  explanations: Record<string, string>;
};

export type CoachReflectionPrompt = {
  question: string;
  why: string;
};

export type CoachConfidence = {
  before: number | null;
  after: number | null;
  delta: number | null;
  interpretation: string;
};

export type CoachVerdictLabel = "Buy" | "Caution" | "Skip";

export type CoachVerdict = {
  label: CoachVerdictLabel;
  rationaleBullets: string[];
  whatWouldChangeMyMind: string[];
  /** Structured summary for "What the evidence actually shows" */
  evidenceSummary?: { positive: string; missing: string };
  /** Tactics with plain-language explanations */
  persuasionTacticsDetailed?: Array<{ tactic: string; explanation: string }>;
  /** Tie to user budget/values when provided */
  fitForSituation?: string;
  /** Human-tone paragraph explaining why this verdict */
  finalReasoning?: string;
};

export type DeinfluenceCoachResponse = {
  claim: CoachClaim;
  evidence: CoachEvidence[];
  contradictions: CoachContradiction[];
  biasMap: CoachBiasMap;
  reflectionPrompts: CoachReflectionPrompt[];
  confidence: CoachConfidence;
  verdict: CoachVerdict;
  mode?: "online" | "offline";
  extractedProductName?: string;
  extractedBrand?: string;
  extractedPrice?: string;
};
