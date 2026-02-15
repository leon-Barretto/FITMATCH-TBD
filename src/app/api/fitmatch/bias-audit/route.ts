import { NextResponse } from "next/server";
import { getLLMConfig } from "@/lib/fitmatch/llm-config";
import { computeBiasHeatmap } from "@/lib/decisionos";

const BIAS_KEYS = ["socialProof", "scarcity", "brandPrestige", "haloEffect"] as const;

const GENERIC_EXPLANATIONS: Record<(typeof BIAS_KEYS)[number], string> = {
  socialProof: "Others' choices may influence your decision.",
  scarcity: "Urgency or scarcity language can trigger impulsive decisions.",
  brandPrestige: "Brand or status may be driving the want.",
  haloEffect: "Strong positive association can overshadow critical thinking.",
};

const GENERIC_COUNTERS: Record<(typeof BIAS_KEYS)[number], string> = {
  socialProof: "Would you choose this if nobody else had it?",
  scarcity: "Is this deal truly limited, or marketing?",
  brandPrestige: "What would you pick without the label?",
  haloEffect: "What specifically fits your needs, beyond the feeling?",
};

export type BiasEntry = {
  score: number;
  evidence: string[];
  explanation: string;
  counterQuestion: string;
};

export type BiasAuditResult = {
  socialProof: BiasEntry;
  scarcity: BiasEntry;
  brandPrestige: BiasEntry;
  haloEffect: BiasEntry;
};

export type BiasAuditResponse = {
  ok: boolean;
  mode: "online" | "offline";
  audit: BiasAuditResult;
};

function buildOfflineAudit(
  contextText: string,
  budgetText: string,
  influenceText: string,
  fitComfortText: string,
  valuesText: string
): BiasAuditResult {
  const combined = [contextText, budgetText, influenceText, fitComfortText, valuesText].join(" ");
  const heatmap = computeBiasHeatmap(combined);

  const audit: BiasAuditResult = {} as BiasAuditResult;
  for (const key of BIAS_KEYS) {
    const score = Math.max(0, Math.min(5, heatmap[key]));
    audit[key] = {
      score,
      evidence: [],
      explanation: GENERIC_EXPLANATIONS[key],
      counterQuestion: GENERIC_COUNTERS[key],
    };
  }
  return audit;
}

const SYSTEM_PROMPT = `You are an expert media literacy & decision science coach. Detect cognitive biases in purchase decisions. Be concise and evidence-based. Use only the provided text. If no evidence, score low (0-1). Output STRICT JSON only, no markdown.

Output schema:
{
  "socialProof": { "score": 0-5, "evidence": ["quote1","quote2"], "explanation": "one line", "counterQuestion": "one question" },
  "scarcity": { ... },
  "brandPrestige": { ... },
  "haloEffect": { ... }
}
Evidence must be short direct quotes/snippets from the input (no hallucinations). Max 2 evidence items per bias.`;

const TIMEOUT_MS = 6000;

export async function POST(request: Request) {
  const fallback: BiasAuditResponse = {
    ok: true,
    mode: "offline",
    audit: buildOfflineAudit("", "", "", "", ""),
  };

  let body: {
    contextText?: string;
    budgetText?: string;
    influenceText?: string;
    fitComfortText?: string;
    valuesText?: string;
  } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json(fallback);
  }

  const contextText = String(body.contextText ?? "").trim();
  const budgetText = String(body.budgetText ?? "").trim();
  const influenceText = String(body.influenceText ?? "").trim();
  const fitComfortText = String(body.fitComfortText ?? "").trim();
  const valuesText = String(body.valuesText ?? "").trim();

  fallback.audit = buildOfflineAudit(contextText, budgetText, influenceText, fitComfortText, valuesText);

  const config = getLLMConfig();
  if (config.provider !== "mistral" || !config.apiKey) {
    return NextResponse.json(fallback);
  }

  const userContent = `Context: ${contextText || "(none)"}
Budget: ${budgetText || "(none)"}
Influence: ${influenceText || "(none)"}
Fit/Comfort: ${fitComfortText || "(none)"}
Values: ${valuesText || "(none)"}

Output STRICT JSON with keys socialProof, scarcity, brandPrestige, haloEffect. Each has: score (0-5), evidence (array of 0-2 short quotes from input), explanation (one line), counterQuestion (one question).`;

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
        messages: [{ role: "system", content: SYSTEM_PROMPT }, { role: "user", content: userContent }],
        response_format: { type: "json_object" },
        temperature: 0.3,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      return NextResponse.json(fallback);
    }

    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const raw = data.choices?.[0]?.message?.content;
    if (!raw || typeof raw !== "string") {
      return NextResponse.json(fallback);
    }

    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const audit: BiasAuditResult = {} as BiasAuditResult;

    for (const key of BIAS_KEYS) {
      const entry = parsed[key] as Record<string, unknown> | undefined;
      if (entry && typeof entry === "object" && "score" in entry) {
        const score = Math.max(0, Math.min(5, Number(entry.score) || 0));
        const evidenceRaw = entry.evidence;
        const evidence = Array.isArray(evidenceRaw)
          ? (evidenceRaw as unknown[]).filter((e): e is string => typeof e === "string").slice(0, 2)
          : [];
        const explanation =
          typeof entry.explanation === "string" ? entry.explanation : GENERIC_EXPLANATIONS[key];
        const counterQuestion =
          typeof entry.counterQuestion === "string" ? entry.counterQuestion : GENERIC_COUNTERS[key];
        audit[key] = { score, evidence, explanation, counterQuestion };
      } else {
        audit[key] = fallback.audit[key];
      }
    }

    return NextResponse.json({
      ok: true,
      mode: "online",
      audit,
    });
  } catch {
    return NextResponse.json(fallback);
  } finally {
    clearTimeout(timeoutId);
  }
}
