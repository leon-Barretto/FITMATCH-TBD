import type { Outfit } from "./types";

export const MOCK_OUTFITS: Outfit[] = [
  {
    id: "o1",
    name: "Classic Interview",
    shortDescription: "Navy blazer, white shirt, dark chinos, oxfords",
    items: { top: "White cotton shirt", bottom: "Dark navy chinos", shoes: "Brown oxfords", outer: "Navy blazer", accessory: "Subtle leather belt" },
    vibe: "Safe",
    baseRatings: { bodyProportion: 8, comfort: 7, budget: 6, occasionSuitability: 9, styleAlignment: 8, versatility: 9, sustainability: 6 },
  },
  {
    id: "o2",
    name: "Smart Casual Mix",
    shortDescription: "Polo, tailored joggers, minimal sneakers",
    items: { top: "Gray polo", bottom: "Black tailored joggers", shoes: "White minimal sneakers", accessory: "Simple watch" },
    vibe: "Balanced",
    baseRatings: { bodyProportion: 7, comfort: 9, budget: 8, occasionSuitability: 6, styleAlignment: 7, versatility: 8, sustainability: 5 },
  },
  {
    id: "o3",
    name: "Bold Statement",
    shortDescription: "Oversized shirt, wide leg trousers, chunkier shoes",
    items: { top: "Oversized linen shirt", bottom: "Wide leg trousers", shoes: "Chunky loafers" },
    vibe: "Bold",
    baseRatings: { bodyProportion: 6, comfort: 7, budget: 5, occasionSuitability: 5, styleAlignment: 9, versatility: 6, sustainability: 7 },
  },
  {
    id: "o4",
    name: "Minimal Neutral",
    shortDescription: "Beige top, straight-leg pants, clean sneakers",
    items: { top: "Beige crewneck", bottom: "Straight-leg pants", shoes: "Clean white sneakers", accessory: "Minimalist watch" },
    vibe: "Balanced",
    baseRatings: { bodyProportion: 8, comfort: 8, budget: 7, occasionSuitability: 7, styleAlignment: 8, versatility: 9, sustainability: 6 },
  },
  {
    id: "o5",
    name: "Casual Weekend",
    shortDescription: "Hoodie, dark jeans, sneakers",
    items: { top: "Gray hoodie", bottom: "Dark wash jeans", shoes: "Sneakers", accessory: "Cap" },
    vibe: "Safe",
    baseRatings: { bodyProportion: 7, comfort: 9, budget: 9, occasionSuitability: 4, styleAlignment: 6, versatility: 8, sustainability: 5 },
  },
  {
    id: "o6",
    name: "Elevated Basics",
    shortDescription: "Tailored tee, chinos, loafers",
    items: { top: "Tailored tee", bottom: "Olive chinos", shoes: "Loafers", accessory: "Leather belt" },
    vibe: "Balanced",
    baseRatings: { bodyProportion: 8, comfort: 8, budget: 7, occasionSuitability: 7, styleAlignment: 7, versatility: 8, sustainability: 6 },
  },
];
