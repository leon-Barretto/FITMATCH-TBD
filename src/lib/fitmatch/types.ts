export type FitCriteria =
  | "bodyProportion"
  | "comfort"
  | "budget"
  | "occasionSuitability"
  | "styleAlignment"
  | "versatility"
  | "sustainability";

export type VibeTag = "Safe" | "Balanced" | "Bold";

export type OutfitItem = {
  top?: string;
  bottom?: string;
  shoes?: string;
  outer?: string;
  accessory?: string;
};

export type BaseRatings = Record<FitCriteria, number>;

export type Outfit = {
  id: string;
  name: string;
  shortDescription: string;
  items: OutfitItem;
  vibe: VibeTag;
  baseRatings: BaseRatings;
  imageUrl?: string;
};

export type Weights = Partial<Record<FitCriteria, number>>;

export type FitScoreBreakdown = {
  total: number;
  byCriterion: Record<FitCriteria, number>;
  notes: string[];
};

export type FinalScore = {
  finalScore: number;
  verdict: "PAUSE 72H" | "PROCEED WITH CHANGES" | "PROCEED";
  topReasons: string[];
  nextActions: string[];
};
