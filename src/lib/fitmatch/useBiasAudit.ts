"use client";

import { useEffect, useRef, useState } from "react";
import { computeBiasHeatmap } from "@/lib/decisionos";

export type BiasEntry = {
  score: number;
  evidence: string[];
  explanation: string;
  counterQuestion: string;
};

export type BiasAudit = {
  socialProof: BiasEntry;
  scarcity: BiasEntry;
  brandPrestige: BiasEntry;
  haloEffect: BiasEntry;
};

export type UseBiasAuditPayload = {
  contextText: string;
  budgetText: string;
  influenceText: string;
  fitComfortText: string;
  valuesText: string;
};

export type UseBiasAuditResult = {
  loading: boolean;
  mode: "online" | "offline";
  audit: BiasAudit | null;
};

const TIMEOUT_MS = 6000;

const EXPLANATIONS: Record<keyof BiasAudit, string> = {
  socialProof: "Others' choices may influence your decision.",
  scarcity: "Urgency language can trigger impulsive decisions.",
  brandPrestige: "Brand or status may be driving the want.",
  haloEffect: "Strong positive association can overshadow critical thinking.",
};

const COUNTERS: Record<keyof BiasAudit, string> = {
  socialProof: "Would you choose this if nobody else had it?",
  scarcity: "Is this deal truly limited?",
  brandPrestige: "What would you pick without the label?",
  haloEffect: "What specifically fits your needs?",
};

function buildHeuristicAudit(payload: UseBiasAuditPayload): BiasAudit {
  const combined = [
    payload.contextText,
    payload.budgetText,
    payload.influenceText,
    payload.fitComfortText,
    payload.valuesText,
  ].join(" ");
  const hm = computeBiasHeatmap(combined);
  return {
    socialProof: { score: hm.socialProof, evidence: [], explanation: EXPLANATIONS.socialProof, counterQuestion: COUNTERS.socialProof },
    scarcity: { score: hm.scarcity, evidence: [], explanation: EXPLANATIONS.scarcity, counterQuestion: COUNTERS.scarcity },
    brandPrestige: { score: hm.brandPrestige, evidence: [], explanation: EXPLANATIONS.brandPrestige, counterQuestion: COUNTERS.brandPrestige },
    haloEffect: { score: hm.haloEffect, evidence: [], explanation: EXPLANATIONS.haloEffect, counterQuestion: COUNTERS.haloEffect },
  };
}

export function useBiasAudit(payload: UseBiasAuditPayload | null): UseBiasAuditResult {
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"online" | "offline">("offline");
  const [audit, setAudit] = useState<BiasAudit | null>(null);
  const payloadRef = useRef<string>("");

  useEffect(() => {
    if (!payload) {
      setAudit(null);
      setMode("offline");
      setLoading(false);
      return;
    }

    const key = JSON.stringify(payload);
    if (payloadRef.current === key) return;
    payloadRef.current = key;

    setMode("offline");
    setLoading(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    fetch("/api/fitmatch/bias-audit", {
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
      .then((data: { ok?: boolean; mode?: "online" | "offline"; audit?: BiasAudit } | null) => {
        if (data?.ok && data.audit && typeof data.audit === "object") {
          setMode(data.mode ?? "offline");
          setAudit(data.audit);
        } else {
          setAudit(buildHeuristicAudit(payload));
        }
      })
      .catch(() => {
        setAudit(buildHeuristicAudit(payload));
        setMode("offline");
      })
      .finally(() => {
        setLoading(false);
        clearTimeout(timeoutId);
      });
  }, [payload ? JSON.stringify(payload) : null]);

  return { loading, mode, audit };
}
