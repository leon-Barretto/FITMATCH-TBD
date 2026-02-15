import { NextResponse } from "next/server";
import { getLLMConfig } from "@/lib/fitmatch/llm-config";
import type {
  RankReviewRequest,
  RankReviewResponse,
  CandidateReview,
  RankReviewRecommendation,
} from "@/lib/types/aiReview";
import { parseRankReviewResponse } from "@/lib/types/aiReview";

const TIMEOUT_MS = 6000;

function buildOfflineReviews(
  candidates: RankReviewRequest["candidates"],
  bias: RankReviewRequest["biasAuditOrHeatmap"]
): CandidateReview[] {
  const { socialProof, scarcity, brandPrestige } = bias;
  const biasHigh = socialProof >= 3 || scarcity >= 3 || brandPrestige >= 3;
  const biasVeryHigh = socialProof >= 4 || scarcity >= 4 || brandPrestige >= 4;

  return candidates.map((c) => {
    const baseScore = Math.round(Math.max(0, Math.min(100, c.baseScore)) * 10) / 10;
    let recommendation: RankReviewRecommendation = "Proceed with caution";
    let caution = "Review your choice against your stated values and budget.";
    const tradeoffs: string[] = [];

    if (c.influenceRiskLevel === "High" || biasVeryHigh) {
      recommendation = "Wait 72h";
      caution = "Strong influence signals detected. Pause before committing.";
      tradeoffs.push("High bias exposure suggests waiting to avoid impulsive choice.");
    } else if (c.influenceRiskLevel === "Moderate" || biasHigh) {
      recommendation = "Wait 24h";
      caution = "Moderate influence signals. Reflect before proceeding.";
      tradeoffs.push("Consider whether social proof or scarcity is driving this choice.");
    } else {
      if (baseScore >= 75) {
        recommendation = "Proceed";
        caution = "Score aligns well with your criteria.";
        tradeoffs.push("Solid fit and values alignment.");
      } else if (baseScore >= 55) {
        recommendation = "Proceed with caution";
        caution = "Check budget and context alignment before committing.";
        tradeoffs.push("Some criteria may need verification.");
      } else {
        recommendation = "Proceed with caution";
        caution = "Lower score suggests reviewing alternatives.";
        tradeoffs.push("Consider fit, budget, and values alignment.");
      }
    }

    if (c.baseReasoning.length > 0) {
      tradeoffs.push(...c.baseReasoning.slice(0, 2));
    }
    tradeoffs.splice(3); // max 3

    return {
      id: c.id,
      delta: 0,
      adjustedScore: baseScore,
      tradeoffs,
      caution,
      recommendation,
    };
  });
}

function buildOfflineResponse(request: RankReviewRequest): RankReviewResponse {
  return {
    ok: true,
    mode: "offline",
    reviews: buildOfflineReviews(request.candidates, request.biasAuditOrHeatmap),
  };
}

const SYSTEM_PROMPT = `You are a reflective decision coach for outfit purchases. Be concise and evidence-based. Use ONLY the given inputs—no new facts or hallucinations.

Output STRICT JSON only. No markdown, no code fences. Schema:
{
  "reviews": [
    {
      "id": "candidate id string",
      "delta": integer between -10 and +10,
      "adjustedScore": baseScore + delta, clamped 0-100,
      "tradeoffs": ["max 3 bullet strings"],
      "caution": "one sentence",
      "recommendation": "Proceed" | "Proceed with caution" | "Wait 24h" | "Wait 72h"
    }
  ]
}

Rules:
- Delta must be small (±10). Do not reorder by hallucinating large deltas.
- Cite evidence only from scenario, userProfile, bias signals, and candidate data.
- Use trade-offs, values alignment, and bias signals (socialProof, scarcity, brandPrestige) to justify delta.
- If socialProof/scarcity/brandPrestige >= 3, prefer Wait 24h or Wait 72h.
- Output valid JSON only.`;

function buildUserPrompt(req: RankReviewRequest): string {
  const { scenario, userProfile, biasAuditOrHeatmap, candidates } = req;
  const biasSummary = `Bias signals: socialProof=${biasAuditOrHeatmap.socialProof}, scarcity=${biasAuditOrHeatmap.scarcity}, brandPrestige=${biasAuditOrHeatmap.brandPrestige}, haloEffect=${biasAuditOrHeatmap.haloEffect}`;
  const scenarioText = `Scenario: ${scenario.occasion}, ${scenario.weather}, budget ${scenario.budgetRange}, ${scenario.bodyType}`;
  const profileText = `User: context="${userProfile.contextText}", fit="${userProfile.fitComfortText}", budget="${userProfile.budgetText}", influence="${userProfile.influenceText}", values="${userProfile.valuesText}", confidence ${userProfile.confidenceBefore}→${userProfile.confidenceAfter}`;
  const candidatesText = candidates
    .map(
      (c) =>
        `- ${c.id} "${c.name}": ${c.description}, baseScore=${c.baseScore}, fitScore=${c.fitScore}, influenceRisk=${c.influenceRiskLevel}, reasoning=[${(c.baseReasoning || []).join("; ")}]`
    )
    .join("\n");

  return `${scenarioText}\n${profileText}\n${biasSummary}\n\nCandidates:\n${candidatesText}\n\nOutput JSON with "reviews" array. One entry per candidate. Delta ±10 max.`;
}

export async function POST(request: Request) {
  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, mode: "offline", reviews: [] });
  }

  const req = body as RankReviewRequest;
  if (!req || !Array.isArray(req.candidates) || req.candidates.length === 0) {
    return NextResponse.json({ ok: false, mode: "offline", reviews: [] });
  }

  const scenario = req.scenario ?? { occasion: "", weather: "", budgetRange: "", bodyType: "" };
  const userProfile = req.userProfile ?? {
    contextText: "",
    fitComfortText: "",
    budgetText: "",
    influenceText: "",
    valuesText: "",
    confidenceBefore: 50,
    confidenceAfter: 50,
  };
  const biasAuditOrHeatmap = req.biasAuditOrHeatmap ?? {
    socialProof: 0,
    scarcity: 0,
    brandPrestige: 0,
    haloEffect: 0,
  };

  const normalizedRequest: RankReviewRequest = {
    scenario,
    userProfile,
    biasAuditOrHeatmap,
    candidates: req.candidates,
  };

  const offlineFallback = buildOfflineResponse(normalizedRequest);

  const config = getLLMConfig();
  if (config.provider !== "mistral" || !config.apiKey) {
    return NextResponse.json(offlineFallback);
  }

  const url = config.baseUrl.replace(/\/$/, "") + "/chat/completions";
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserPrompt(normalizedRequest) },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      return NextResponse.json(offlineFallback);
    }

    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const raw = data.choices?.[0]?.message?.content;
    if (!raw || typeof raw !== "string") {
      return NextResponse.json(offlineFallback);
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json(offlineFallback);
    }

    const validated = parseRankReviewResponse(parsed);
    if (!validated || !Array.isArray(validated.reviews) || validated.reviews.length === 0) {
      return NextResponse.json(offlineFallback);
    }

    const offlineMap = new Map(offlineFallback.reviews.map((r) => [r.id, r]));
    const reviews: CandidateReview[] = [];
    for (const c of normalizedRequest.candidates) {
      const match = validated.reviews.find((r) => r.id === c.id);
      const fallback = offlineMap.get(c.id);
      if (match) {
        const baseScore = c.baseScore;
        const delta = Math.max(-10, Math.min(10, Math.round(match.delta)));
        const adjustedScore = Math.round(Math.max(0, Math.min(100, baseScore + delta)) * 10) / 10;
        reviews.push({
          id: c.id,
          delta,
          adjustedScore,
          tradeoffs: match.tradeoffs.slice(0, 3),
          caution: match.caution || fallback?.caution || "Review your choice.",
          recommendation: match.recommendation,
        });
      } else if (fallback) {
        reviews.push(fallback);
      }
    }

    if (reviews.length !== normalizedRequest.candidates.length) {
      return NextResponse.json(offlineFallback);
    }

    return NextResponse.json({
      ok: true,
      mode: "online",
      reviews,
    });
  } catch {
    return NextResponse.json(offlineFallback);
  } finally {
    clearTimeout(timeoutId);
  }
}
