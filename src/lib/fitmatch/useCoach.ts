"use client";

import { useEffect, useRef, useState } from "react";

export type CoachPayload = {
  scenario?: { occasion?: string; weather?: string; budget?: string; bodyType?: string };
  selectedOutfit?: { name: string; items?: Record<string, string> };
  fitBreakdown?: { byCriterion?: Record<string, number>; notes?: string[] };
  reflectionSignals?: {
    biasHeatmap?: { socialProof?: number; scarcity?: number; brandPrestige?: number; haloEffect?: number };
    regretRiskLabel?: string;
  };
  userInputs?: { influence?: string; context?: string; values?: string };
};

export type CoachData = {
  prompts: string[];
  adjustments: string[];
  reframe: string;
};

export type UseCoachResult = {
  loading: boolean;
  mode: "online" | "offline";
  coach: CoachData | null;
};

const TIMEOUT_MS = 6000;

const FALLBACK_COACH: CoachData = {
  prompts: [
    "What would make me regret this in 2 weeks?",
    "If nobody saw this, would I still choose it?",
    "What's a cheaper/simpler alternative that meets the same goal?",
  ],
  adjustments: ["Consider secondhand or sales.", "Compare with one alternative before committing."],
  reframe: "Pause once more: would you make this choice if nobody else would see it?",
};

export function useCoach(payload: CoachPayload | null): UseCoachResult {
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"online" | "offline">("offline");
  const [coach, setCoach] = useState<CoachData | null>(null);
  const payloadRef = useRef<string>("");

  useEffect(() => {
    if (!payload) {
      setCoach(null);
      setMode("offline");
      setLoading(false);
      return;
    }

    const key = JSON.stringify(payload);
    if (payloadRef.current === key) return;
    payloadRef.current = key;

    setCoach(FALLBACK_COACH);
    setMode("offline");
    setLoading(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    fetch("/api/fitmatch/coach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: key,
      signal: controller.signal,
    })
      .then((res) => {
        clearTimeout(timeoutId);
        if (!res.ok) return null;
        return res.json();
      })
      .then((data: { ok?: boolean; mode?: "online" | "offline"; coach?: CoachData } | null) => {
        if (data?.ok && data.coach) {
          setMode(data.mode ?? "offline");
          setCoach({
            prompts: Array.isArray(data.coach.prompts) ? data.coach.prompts.slice(0, 3) : FALLBACK_COACH.prompts,
            adjustments: Array.isArray(data.coach.adjustments) ? data.coach.adjustments.slice(0, 2) : FALLBACK_COACH.adjustments,
            reframe: typeof data.coach.reframe === "string" ? data.coach.reframe : FALLBACK_COACH.reframe,
          });
        }
      })
      .catch(() => {
        setCoach(FALLBACK_COACH);
        setMode("offline");
      })
      .finally(() => setLoading(false));
  }, [payload ? JSON.stringify(payload) : null]);

  return { loading, mode, coach };
}
