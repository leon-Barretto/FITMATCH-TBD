import { NextResponse } from "next/server";
import { getLLMConfig } from "@/lib/fitmatch/llm-config";
import type { FitCriteria } from "@/lib/fitmatch/types";

const CRITERIA_LABELS: Record<FitCriteria, string> = {
  bodyProportion: "Body proportion",
  comfort: "Comfort",
  budget: "Budget",
  occasionSuitability: "Occasion fit",
  styleAlignment: "Style alignment",
  versatility: "Versatility",
  sustainability: "Sustainability",
};

export type CoachRequestBody = {
  scenario?: { occasion?: string; weather?: string; budget?: string; bodyType?: string };
  selectedOutfit?: { name: string; items?: Record<string, string> };
  fitBreakdown?: { byCriterion?: Record<string, number>; notes?: string[] };
  reflectionSignals?: {
    biasHeatmap?: { socialProof?: number; scarcity?: number; brandPrestige?: number; haloEffect?: number };
    regretRiskLabel?: string;
  };
  userInputs?: { influence?: string; context?: string; values?: string };
};

export type CoachResponse = {
  ok: boolean;
  mode: "online" | "offline";
  coach: {
    prompts: string[];
    adjustments: string[];
    reframe: string;
  };
};

function buildOfflineCoach(body: CoachRequestBody): CoachResponse["coach"] {
  const byCrit = body.fitBreakdown?.byCriterion ?? {};
  const entries = (Object.entries(byCrit) as [FitCriteria, string | number][]).sort(
    (a, b) => (a[1] as number) - (b[1] as number)
  );
  const weakest = entries.slice(0, 2).map(([c]) => CRITERIA_LABELS[c] ?? c);

  const adjustments: string[] = [];
  for (const w of weakest) {
    if (w.toLowerCase().includes("budget")) adjustments.push("Consider secondhand or sales to stretch your budget.");
    else if (w.toLowerCase().includes("body") || w.toLowerCase().includes("proportion")) adjustments.push("Try tailoring or different cuts for your frame.");
    else if (w.toLowerCase().includes("sustainability")) adjustments.push("Look for secondhand or capsule pieces.");
  }
  if (adjustments.length < 2) adjustments.push("Compare with one alternative before committing.");
  if (adjustments.length < 2) adjustments.push("Test the outfit in different lighting and contexts.");

  const biasTotal = (body.reflectionSignals?.biasHeatmap?.socialProof ?? 0) +
    (body.reflectionSignals?.biasHeatmap?.scarcity ?? 0) +
    (body.reflectionSignals?.biasHeatmap?.brandPrestige ?? 0) +
    (body.reflectionSignals?.biasHeatmap?.haloEffect ?? 0);
  const reframe = biasTotal >= 3
    ? "Strong influence signals can cloud judgment — step back and ask if this choice is truly yours."
    : "Pause once more: would you make this choice if nobody else would see it?";

  return {
    prompts: [
      "What would make me regret this in 2 weeks?",
      "If nobody saw this, would I still choose it?",
      "What's a cheaper/simpler alternative that meets the same goal?",
    ],
    adjustments: adjustments.slice(0, 2),
    reframe,
  };
}

const SYSTEM_PROMPT = `You are a reflection coach that improves critical thinking. Be concise, practical, non-judgmental. No hallucinated facts. Work only with provided inputs. Return STRICT JSON ONLY (no markdown) with keys: "prompts" (array of 3 strings), "adjustments" (array of 2 strings), "reframe" (one sentence string).`;

export async function POST(request: Request) {
  const fallback: CoachResponse = {
    ok: true,
    mode: "offline",
    coach: buildOfflineCoach({}),
  };

  let body: CoachRequestBody = {};
  try {
    body = (await request.json()) as CoachRequestBody;
  } catch {
    return NextResponse.json(fallback);
  }

  fallback.coach = buildOfflineCoach(body);

  const config = getLLMConfig();
  if (config.provider === "none" || !config.apiKey) {
    return NextResponse.json(fallback);
  }

  const scenario = body.scenario ?? {};
  const outfit = body.selectedOutfit ?? { name: "" };
  const items = outfit.items && typeof outfit.items === "object"
    ? Object.entries(outfit.items).map(([k, v]) => `${k}: ${v}`).join("; ")
    : "";
  const byCrit = body.fitBreakdown?.byCriterion ?? {};
  const entries = Object.entries(byCrit).sort((a, b) => (a[1] as number) - (b[1] as number));
  const weakest = entries.slice(0, 2).map(([c]) => `${CRITERIA_LABELS[c as FitCriteria] ?? c}: ${(byCrit[c] ?? 0).toFixed(1)}`);
  const bias = body.reflectionSignals?.biasHeatmap ?? {};
  const biasStr = `socialProof:${bias.socialProof ?? 0}, scarcity:${bias.scarcity ?? 0}, brandPrestige:${bias.brandPrestige ?? 0}, haloEffect:${bias.haloEffect ?? 0}`;

  const userContent = `Occasion: ${scenario.occasion ?? "—"}. Weather: ${scenario.weather ?? "—"}. Budget: ${scenario.budget ?? "—"}. Body type: ${scenario.bodyType ?? "—"}.
Selected outfit: ${outfit.name ?? "—"}. Items: ${items || "—"}.
FitScore weakest 2: ${weakest.join("; ")}.
Bias heatmap: ${biasStr}.
Regret risk: ${body.reflectionSignals?.regretRiskLabel ?? "—"}.
User influence: ${body.userInputs?.influence ?? "(none)"}.
User context: ${body.userInputs?.context ?? "(none)"}.
User values: ${body.userInputs?.values ?? "(none)"}.
Return JSON: { "prompts": [3 reflection questions], "adjustments": [2 outfit tweaks], "reframe": "one sentence" }.`;

  const url = config.baseUrl.replace(/\/$/, "") + "/chat/completions";

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: "system", content: SYSTEM_PROMPT }, { role: "user", content: userContent }],
        response_format: { type: "json_object" },
        temperature: 0.5,
      }),
    });

    if (!res.ok) {
      return NextResponse.json(fallback);
    }

    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const raw = data.choices?.[0]?.message?.content;
    if (!raw || typeof raw !== "string") {
      return NextResponse.json(fallback);
    }

    const parsed = JSON.parse(raw) as { prompts?: string[]; adjustments?: string[]; reframe?: string };
    const prompts = Array.isArray(parsed.prompts) ? parsed.prompts.slice(0, 3) : fallback.coach.prompts;
    const adjustments = Array.isArray(parsed.adjustments) ? parsed.adjustments.slice(0, 2) : fallback.coach.adjustments;
    const reframe = typeof parsed.reframe === "string" && parsed.reframe.trim() ? parsed.reframe.trim() : fallback.coach.reframe;

    return NextResponse.json({
      ok: true,
      mode: "online",
      coach: { prompts, adjustments, reframe },
    });
  } catch {
    return NextResponse.json(fallback);
  }
}
