import { NextResponse } from "next/server";
import { mistralJSON } from "@/lib/clients/mistral";
import { checkRateLimit } from "@/lib/rate-limit";
import { extractProductMetadata } from "@/lib/url/extractProductMetadata";
import { searchVideos } from "@/lib/clients/youtube";
import type {
  DeinfluenceRequest,
  DeinfluenceCoachResponse,
  CoachClaim,
  CoachEvidence,
  CoachContradiction,
  CoachBiasMap,
  CoachReflectionPrompt,
  CoachConfidence,
  CoachVerdict,
  EvidenceClassification,
} from "@/lib/types/deinfluence";

const SUBCLAIM_LABELS = ["Quality", "Value", "Comfort", "Durability", "Fit"];

function classifyEvidenceHeuristic(
  title: string,
  desc: string,
  channel: string
): EvidenceClassification {
  const text = (title + " " + desc + " " + channel).toLowerCase();
  if (/sponsored|#ad|partner|gifted|affiliate|link in bio|discount code/i.test(text)) {
    return "sponsored";
  }
  if (/affiliate|commission|use my code/i.test(text)) {
    return "affiliate_driven";
  }
  if (/honest review|unbiased|not sponsored|bought with my own|worth it|would recommend/i.test(text)) {
    return "neutral_review";
  }
  if (/pilling|thin|cheap|quality issues|returned|disappointed|overpriced|not worth/i.test(text)) {
    return "critical_review";
  }
  if (/best ever|must have|obsessed|love it|amazing|incredible/i.test(text)) {
    return "promotional";
  }
  return "neutral_review";
}

function extractSponsorshipSignals(text: string): string[] {
  const signals: string[] = [];
  if (/sponsored/i.test(text)) signals.push("Sponsored content");
  if (/affiliate|commission/i.test(text)) signals.push("Affiliate link");
  if (/discount code|use my code|link in bio/i.test(text)) signals.push("Incentive to purchase");
  if (/#ad|#partner/i.test(text)) signals.push("Paid partnership");
  if (/gifted/i.test(text)) signals.push("Gifted product");
  return signals;
}

function buildBiasScores(text: string): CoachBiasMap {
  const t = text.toLowerCase();
  let socialProof = 0;
  let scarcity = 0;
  let authority = 0;
  let brandPrestige = 0;
  const explanations: Record<string, string> = {};

  if (/everyone|viral|trending|best-selling|popular|must have|everyone has|hype|obsessed|love it|must.?have/i.test(t)) {
    socialProof = 4;
    explanations.socialProof = "Social proof language (e.g. 'everyone has it', 'viral', 'hype') can trigger FOMO without evidence.";
  } else if (/popular|recommended|best|trending/i.test(t)) {
    socialProof = 2;
    explanations.socialProof = "Mild social proof language present.";
  }

  if (/limited|last chance|sold out|exclusive|drop|hurry|ends soon|while supplies last|shop now/i.test(t)) {
    scarcity = 4;
    explanations.scarcity = "Scarcity/urgency language pressures quick decisions without time to research.";
  } else if (/limited|exclusive|hurry/i.test(t)) {
    scarcity = 2;
    explanations.scarcity = "Some scarcity framing detected.";
  }

  if (/expert|doctor|specialist|certified|award-winning|rated/i.test(t)) {
    authority = 3;
    explanations.authority = "Authority cues may sway without clear expertise relevance.";
  }

  if (/designer|luxury|premium|prestige|status|high-end|elite/i.test(t)) {
    brandPrestige = 4;
    explanations.brandPrestige = "Brand prestige cues can override objective quality assessment.";
  } else if (/quality|premium|brand/i.test(t)) {
    brandPrestige = 2;
    explanations.brandPrestige = "Premium/quality framing may appeal to status.";
  }

  return {
    socialProof: Math.min(5, socialProof),
    scarcity: Math.min(5, scarcity),
    authority: Math.min(5, authority),
    brandPrestige: Math.min(5, brandPrestige),
    explanations,
  };
}

function findContradictionsHeuristic(
  claim: string,
  evidence: CoachEvidence[]
): CoachContradiction[] {
  const contradictions: CoachContradiction[] = [];
  const claimLower = claim.toLowerCase();
  const subclaimToClaimWords: Record<string, string[]> = {
    Durability: ["durable", "lasts", "holds up", "quality"],
    Quality: ["quality", "worth it", "great"],
    Comfort: ["comfortable", "soft", "cozy"],
  };
  const conflictKeywords: Record<string, string[]> = {
    Durability: ["pilling", "thin fabric", "wears out", "falling apart", "stitching"],
    Quality: ["cheap", "poor quality", "disappointing", "not worth", "overpriced"],
    Comfort: ["uncomfortable", "scratchy", "tight", "rough"],
  };

  for (const [subclaim, claimWords] of Object.entries(subclaimToClaimWords)) {
    const keywords = conflictKeywords[subclaim];
    const claimHasPositive = claimWords.some((w) => claimLower.includes(w));
    const matchingEvidence = evidence.filter((e) =>
      keywords.some((k) => e.snippet.toLowerCase().includes(k))
    );
    if (claimHasPositive && matchingEvidence.length > 0) {
      contradictions.push({
        subclaimLabel: subclaim,
        conflict: `Claim suggests positive ${subclaim.toLowerCase()}, but evidence mentions: ${keywords.filter((k) => matchingEvidence.some((ev) => ev.snippet.toLowerCase().includes(k))).join(", ")}`,
        evidenceIds: matchingEvidence.map((e) => e.id),
      });
    }
  }
  return contradictions.slice(0, 5);
}

function buildOfflineCoachResponse(
  productName: string,
  claimRaw: string,
  youtubeVideos: Array<{ title: string; channelTitle: string; url: string; description: string }>,
  pageDescription?: string
): DeinfluenceCoachResponse {
  const claim: CoachClaim = {
    raw: claimRaw || `${productName} is worth considering — quality and value.`,
    subclaims: SUBCLAIM_LABELS.slice(0, 3).map((label) => ({
      label,
      description: `Testable claim about ${label.toLowerCase()} based on evidence.`,
    })),
  };

  const allText = [claimRaw, pageDescription ?? "", ...youtubeVideos.map((v) => v.description + " " + v.title)].join(" ");
  const biasMap = buildBiasScores(allText);
  const sponsorCount = (allText.match(/sponsored|affiliate|#ad|discount code|link in bio|partner|gifted/gi) ?? []).length;

  const evidence: CoachEvidence[] = youtubeVideos.map((v, i) => {
    const desc = v.description ?? "";
    const snippet = desc.slice(0, 150).trim() || v.title;
    const classification = classifyEvidenceHeuristic(v.title, desc, v.channelTitle ?? "");
    return {
      id: `ev-${i}`,
      title: v.title,
      channel: v.channelTitle ?? "",
      url: v.url,
      snippet: snippet.slice(0, 200) + (snippet.length > 200 ? "…" : ""),
      classification,
      sponsorshipSignals: extractSponsorshipSignals(desc + " " + v.title),
    };
  });

  const contradictions = findContradictionsHeuristic(claimRaw, evidence);

  const reflectionPrompts: CoachReflectionPrompt[] = [
    { question: "What would you need to verify before buying this?", why: "Identifies gaps in evidence." },
    { question: "How might this claim change if the creator wasn't sponsored?", why: "Surfaces sponsorship bias." },
    { question: "What alternative sources could confirm or contradict this?", why: "Encourages triangulation." },
  ];

  const confidenceBefore = null;
  const confidenceAfter = null;
  const delta = null;
  const interpretation = "Set your confidence before and after reviewing the evidence above to see your calibration.";

  let verdictLabel: CoachVerdict["label"] = "Caution";
  const rationaleBullets: string[] = [];
  const whatWouldChange: string[] = [];

  if (sponsorCount >= 2 || biasMap.scarcity >= 4) {
    verdictLabel = "Skip";
    rationaleBullets.push("High sponsorship or scarcity pressure detected.");
    whatWouldChange.push("Independent critical reviews with no affiliate links.");
  } else if (sponsorCount >= 1 || biasMap.socialProof >= 3) {
    verdictLabel = "Caution";
    rationaleBullets.push("Some sponsorship or social proof influence present.");
    whatWouldChange.push("More neutral or critical reviews to balance the claim.");
  } else if (youtubeVideos.length >= 3 && contradictions.length === 0) {
    verdictLabel = "Buy";
    rationaleBullets.push("Multiple independent sources with no major contradictions.");
    whatWouldChange.push("Negative reviews or durability concerns would shift this.");
  }

  const sponsoredEvidence = evidence.filter((e) => e.classification === "sponsored" || e.classification === "affiliate_driven").length;
  const neutralCount = evidence.filter((e) => e.classification === "neutral_review" || e.classification === "critical_review").length;
  const positiveSummary =
    neutralCount > 0
      ? `${neutralCount} of ${evidence.length} sources were independent reviews (neutral or critical).`
      : evidence.length > 0
        ? `${evidence.length} sources were analyzed; most showed sponsored or promotional content.`
        : "No video evidence was found to analyze.";
  const missingSummary =
    evidence.length < 3
      ? "Limited evidence — fewer than 3 sources. More independent reviews would strengthen the picture."
      : contradictions.length > 0
        ? "Some claims were contradicted by evidence. Long-term durability and real-world testing were not clearly demonstrated."
        : "Gaps include long-term wear data and price comparisons across retailers.";

  const tacticsFromBias: Array<{ tactic: string; explanation: string }> = [];
  const biasLabels: Record<string, string> = {
    socialProof: "Social proof",
    scarcity: "Scarcity / urgency",
    authority: "Authority cues",
    brandPrestige: "Brand prestige",
  };
  for (const [key, score] of Object.entries(biasMap)) {
    if (key === "explanations") continue;
    const num = Number(score);
    if (num > 0 && biasMap.explanations[key as keyof typeof biasMap.explanations]) {
      tacticsFromBias.push({
        tactic: biasLabels[key] ?? key,
        explanation: biasMap.explanations[key as keyof typeof biasMap.explanations] || "",
      });
    }
  }
  if (sponsoredEvidence > 0 || /sponsored|#ad|partner|#partner|affiliate|link in bio|gifted|garagepartner/i.test(allText)) {
    tacticsFromBias.push({
      tactic: "Partnership / sponsored content",
      explanation: "Some sources disclose brand partnerships or affiliate links. This can influence how positively the product is presented.",
    });
  }

  const finalReasoning =
    verdictLabel === "Skip"
      ? `With ${sponsoredEvidence} sponsored or affiliate-driven source${sponsoredEvidence === 1 ? "" : "s"} out of ${evidence.length} analyzed, and ${contradictions.length} contradiction${contradictions.length === 1 ? "" : "s"} between the claim and evidence, the most cautious path is to skip or wait.`
      : verdictLabel === "Buy"
        ? `With ${neutralCount} independent source${neutralCount === 1 ? "" : "s"} and no major contradictions, the evidence leans positive.`
        : `With ${sponsoredEvidence} sponsored source${sponsoredEvidence === 1 ? "" : "s"} and ${contradictions.length} noted contradiction${contradictions.length === 1 ? "" : "s"}, proceeding with caution makes sense.`;

  const verdict: CoachVerdict = {
    label: verdictLabel,
    rationaleBullets: rationaleBullets.length > 0 ? rationaleBullets : ["Based on the evidence you reviewed, proceed with caution."],
    whatWouldChangeMyMind: whatWouldChange.length > 0 ? whatWouldChange : ["More independent reviews.", "Long-term wear tests.", "Price comparisons."],
    evidenceSummary: { positive: positiveSummary, missing: missingSummary },
    persuasionTacticsDetailed: tacticsFromBias.length > 0 ? tacticsFromBias : undefined,
    finalReasoning,
  };

  return {
    claim,
    evidence,
    contradictions,
    biasMap,
    reflectionPrompts,
    confidence: { before: confidenceBefore, after: confidenceAfter, delta, interpretation },
    verdict,
    mode: "offline",
  };
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(n)));
}

function safeCoachLabel(v: unknown): CoachVerdict["label"] {
  if (v === "Buy" || v === "Caution" || v === "Skip") return v;
  return "Caution";
}

const COACH_SYSTEM_PROMPT = `You are a critical thinking coach. You help users reason through product claims using evidence. You do NOT decide for them. Output STRICT JSON only. No markdown.

Output schema:
{
  "claim": {"raw":"string","subclaims":[{"label":"string","description":"string"}]},
  "evidence": [{"id":"ev-0","title":"","channel":"","url":"","snippet":"exact quote from description","classification":"sponsored|neutral_review|critical_review|affiliate_driven|promotional","sponsorshipSignals":["string"]}],
  "contradictions": [{"subclaimLabel":"string","conflict":"string","evidenceIds":["ev-0"]}],
  "biasMap": {"socialProof":0-5,"scarcity":0-5,"authority":0-5,"brandPrestige":0-5,"explanations":{"socialProof":"","scarcity":"","authority":"","brandPrestige":""}},
  "reflectionPrompts": [{"question":"string","why":"string"}],
  "verdict": {
    "label":"Buy|Caution|Skip",
    "rationaleBullets":["string"],
    "whatWouldChangeMyMind":["string"],
    "evidenceSummary":{"positive":"1-2 sentences on what evidence supports","missing":"1-2 sentences on gaps"},
    "persuasionTacticsDetailed":[{"tactic":"string","explanation":"plain language why it matters"}],
    "fitForSituation":"Only if user provided budget/values: 1-2 sentences tying analysis to their situation",
    "finalReasoning":"Human-tone paragraph explaining why this verdict. Cite evidence count, sponsorship count, contradictions. No robotic phrasing."
  }
}

RULES:
- evidence[].snippet MUST be an EXACT substring of a youtubeVideos[].description.
- verdict MUST cite: number of evidence sources, sponsorship count, contradictions count. Be specific, not vague ("3 sources" not "multiple reviewers").
- Tone: clear, non-judgmental, evidence-based. No robotic or vague statements.
- contradictions: only include when claim conflicts with evidence (e.g. claim "durable" but evidence says "pilling").`;

export async function POST(request: Request) {
  const rate = checkRateLimit(request);
  if (!rate.ok) {
    return NextResponse.json({ error: "Rate limit exceeded. Try again in a minute." }, { status: 429 });
  }

  let body: DeinfluenceRequest;
  try {
    body = (await request.json()) as DeinfluenceRequest;
  } catch {
    return NextResponse.json(
      buildOfflineCoachResponse("Product", "No claim provided.", []),
      { status: 200 }
    );
  }

  let productName = String(body.productName ?? "").trim();
  let influencerClaim = String(body.influencerClaim ?? "").trim();
  let youtubeVideos = Array.isArray(body.youtubeVideos) ? body.youtubeVideos : [];

  let extractedProductName: string | undefined;
  let extractedBrand: string | undefined;
  let extractedPrice: string | undefined;

  let pageDescription: string | undefined;
  if (youtubeVideos.length === 0) {
    if (body.productUrl && String(body.productUrl).trim().startsWith("http")) {
      const productUrl = String(body.productUrl).trim();
      const metadata = await extractProductMetadata(productUrl);
      extractedProductName = metadata.productName;
      extractedBrand = metadata.brand;
      extractedPrice = metadata.price;
      pageDescription = metadata.pageDescription;
      productName = productName || metadata.productName || "Product";
      influencerClaim =
        influencerClaim ||
        (body.sawViaInfluencer ? "Influencer recommended this — is it worth it?" : `${metadata.productName || "This product"} is worth the hype.`);
      const primaryQuery =
        [metadata.brand, metadata.productName, "review"].filter((x): x is string => Boolean(x)).join(" ") ||
        "product review";
      let videos = await searchVideos(primaryQuery, 5);
      if (videos.length < 3 && metadata.brand && metadata.productName) {
        const shorterName = metadata.productName.split(/\s+/).slice(0, 2).join(" ");
        const fallbackQuery = [metadata.brand, shorterName, "review"].filter((x): x is string => Boolean(x)).join(" ") || primaryQuery;
        if (fallbackQuery !== primaryQuery) {
          const fallbackVideos = await searchVideos(fallbackQuery, 5);
          if (fallbackVideos.length > videos.length) videos = fallbackVideos;
        }
        if (videos.length < 3 && metadata.brand) {
          const brandOnly = `${metadata.brand} review`;
          const brandVideos = await searchVideos(brandOnly, 5);
          if (brandVideos.length > videos.length) videos = brandVideos;
        }
      }
      youtubeVideos = videos.map((v) => ({
        title: v.title,
        channelTitle: v.channelTitle,
        url: v.url,
        description: v.description,
        publishedAt: v.publishedAt,
        thumbnail: v.thumbnail,
      }));
    } else if (productName) {
      const youtubeQuery = [productName, "review"].filter((x): x is string => Boolean(x)).join(" ") || "product review";
      const videos = await searchVideos(youtubeQuery, 5);
      youtubeVideos = videos.map((v) => ({
        title: v.title,
        channelTitle: v.channelTitle,
        url: v.url,
        description: v.description,
        publishedAt: v.publishedAt,
        thumbnail: v.thumbnail,
      }));
    }
  }

  const offlineResult = buildOfflineCoachResponse(
    productName || "Product",
    influencerClaim || "This product is worth considering.",
    youtubeVideos,
    pageDescription
  );

  const hasMistral = Boolean(process.env.MISTRAL_API_KEY?.trim());
  if (!hasMistral) {
    return NextResponse.json({
      ...offlineResult,
      extractedProductName,
      extractedBrand,
      extractedPrice,
    });
  }

  const confidenceBefore = body.userContext?.confidenceBefore;
  const confidenceAfter = body.userContext?.confidenceAfter;
  let coachConfidence: CoachConfidence = offlineResult.confidence;
  if (
    typeof confidenceBefore === "number" &&
    typeof confidenceAfter === "number" &&
    !Number.isNaN(confidenceBefore) &&
    !Number.isNaN(confidenceAfter)
  ) {
    const delta = confidenceAfter - confidenceBefore;
    let interpretation = "Confidence held steady after reflection.";
    if (delta < -10) interpretation = "Based on the evidence you reviewed, your confidence decreased — suggests the evidence challenged initial assumptions.";
    else if (delta > 10) interpretation = "Reflection increased confidence — you may feel more certain after reviewing the evidence.";
    coachConfidence = { before: confidenceBefore, after: confidenceAfter, delta, interpretation };
  }

  const videoContext = youtubeVideos
    .map(
      (v, i) =>
        `[Video ${i} id=ev-${i}] title="${v.title}" channel="${v.channelTitle}" url="${v.url}" description="${(v.description || "").slice(0, 500)}"`
    )
    .join("\n\n");

  const userContext = body.userContext ?? {};
  const budgetText = String(userContext.budgetText ?? "").trim();
  const valuesText = String(userContext.valuesText ?? "").trim();
  const contextNote =
    budgetText || valuesText ? `User context - use for fitForSituation: budget=${budgetText || "not provided"}, values=${valuesText || "not provided"}` : "";

  const userContent = `Product: ${productName}
Claim: ${influencerClaim}
${contextNote}
${pageDescription ? `Product page copy: ${pageDescription}` : ""}

YouTube evidence (quote MUST be exact substring of description):
${videoContext || "(no videos)"}

Return the coach JSON.`;

  try {
    const parsed = (await mistralJSON<Record<string, unknown>>({
      system: COACH_SYSTEM_PROMPT,
      user: userContent,
      timeoutMs: 12000,
    })) as Record<string, unknown>;

    const claimRaw = parsed.claim as Record<string, unknown>;
    const claim: CoachClaim = {
      raw: String(claimRaw?.raw ?? influencerClaim),
      subclaims: Array.isArray(claimRaw?.subclaims)
        ? (claimRaw.subclaims as Array<{ label?: string; description?: string }>)
            .slice(0, 5)
            .map((s) => ({ label: String(s?.label ?? ""), description: String(s?.description ?? "") }))
        : offlineResult.claim.subclaims,
    };

    const rawEvidence = Array.isArray(parsed.evidence) ? parsed.evidence : [];
    const llmEvidenceByUrl = new Map<string, Record<string, unknown>>();
    const normalizedUrl = (u: string) => {
      try {
        const url = new URL(u.trim());
        const v = url.searchParams.get("v");
        return v ? `https://www.youtube.com/watch?v=${v}` : u.trim();
      } catch {
        return u.trim();
      }
    };
    for (const item of rawEvidence) {
      const o = item as Record<string, unknown>;
      const url = String(o?.url ?? o?.sourceUrl ?? "").trim();
      if (url) llmEvidenceByUrl.set(normalizedUrl(url), o);
    }

    const evidence: CoachEvidence[] = youtubeVideos.map((video, i) => {
      const canonicalUrl = video.url;
      const llmMatch = llmEvidenceByUrl.get(canonicalUrl) ?? llmEvidenceByUrl.get(normalizedUrl(canonicalUrl));
      let snippet = String(video.description ?? "").slice(0, 200).trim() || video.title;
      let classification = classifyEvidenceHeuristic(video.title, video.description ?? "", video.channelTitle ?? "");
      let sponsorshipSignals = extractSponsorshipSignals((video.description ?? "") + " " + video.title);

      if (llmMatch) {
        const llmSnippet = String(llmMatch?.snippet ?? "").slice(0, 200);
        const desc = video.description ?? "";
        if (llmSnippet && desc.includes(llmSnippet.slice(0, 30))) {
          snippet = llmSnippet;
        }
        const itemClass = String(llmMatch?.classification ?? "");
        if (["sponsored", "neutral_review", "critical_review", "affiliate_driven", "promotional"].includes(itemClass)) {
          classification = llmMatch.classification as EvidenceClassification;
        }
        if (Array.isArray(llmMatch?.sponsorshipSignals)) {
          sponsorshipSignals = (llmMatch.sponsorshipSignals as string[]).slice(0, 5);
        }
      }

      return {
        id: `ev-${i}`,
        title: video.title,
        channel: video.channelTitle ?? "",
        url: canonicalUrl,
        snippet: snippet || video.title,
        classification,
        sponsorshipSignals,
      };
    });

    const rawContradictions = Array.isArray(parsed.contradictions) ? parsed.contradictions : [];
    const contradictions: CoachContradiction[] = rawContradictions
      .slice(0, 5)
      .map((c: unknown) => {
        const o = c as Record<string, unknown>;
        return {
          subclaimLabel: String(o?.subclaimLabel ?? ""),
          conflict: String(o?.conflict ?? ""),
          evidenceIds: Array.isArray(o?.evidenceIds) ? (o.evidenceIds as string[]).filter((id) => typeof id === "string") : [],
        };
      })
      .filter((c) => c.conflict && c.subclaimLabel);

    const rawBias = parsed.biasMap as Record<string, unknown>;
    const biasMap: CoachBiasMap = {
      socialProof: clamp(Number(rawBias?.socialProof ?? 0), 0, 5),
      scarcity: clamp(Number(rawBias?.scarcity ?? 0), 0, 5),
      authority: clamp(Number(rawBias?.authority ?? 0), 0, 5),
      brandPrestige: clamp(Number(rawBias?.brandPrestige ?? 0), 0, 5),
      explanations: (typeof rawBias?.explanations === "object" && rawBias.explanations !== null
        ? rawBias.explanations as Record<string, string>
        : {}) as Record<string, string>,
    };

    const rawPrompts = Array.isArray(parsed.reflectionPrompts) ? parsed.reflectionPrompts : [];
    const reflectionPrompts: CoachReflectionPrompt[] = rawPrompts
      .slice(0, 3)
      .map((p: unknown) => {
        const o = p as Record<string, unknown>;
        return { question: String(o?.question ?? ""), why: String(o?.why ?? "") };
      })
      .filter((p) => p.question);
    if (reflectionPrompts.length < 3) {
      reflectionPrompts.push(...offlineResult.reflectionPrompts.slice(reflectionPrompts.length, 3));
    }

    const rawVerdict = parsed.verdict as Record<string, unknown>;
    const rawEvidenceSummary = rawVerdict?.evidenceSummary as Record<string, string> | undefined;
    const evidenceSummary =
      rawEvidenceSummary?.positive && rawEvidenceSummary?.missing
        ? { positive: String(rawEvidenceSummary.positive), missing: String(rawEvidenceSummary.missing) }
        : offlineResult.verdict.evidenceSummary;

    const rawTactics = Array.isArray(rawVerdict?.persuasionTacticsDetailed) ? rawVerdict.persuasionTacticsDetailed : [];
    let persuasionTacticsDetailed =
      rawTactics.length > 0
        ? rawTactics
            .slice(0, 5)
            .map((t: unknown) => {
              const o = t as Record<string, unknown>;
              return { tactic: String(o?.tactic ?? ""), explanation: String(o?.explanation ?? "") };
            })
            .filter((t) => t.tactic && t.explanation)
        : offlineResult.verdict.persuasionTacticsDetailed ?? [];
    const sponsoredCountOnline = evidence.filter((e) => e.classification === "sponsored" || e.classification === "affiliate_driven").length;
    const hasPartnerInEvidence = evidence.some((e) => /partner|sponsored|#ad|affiliate|garagepartner/i.test(e.snippet + " " + e.title));
    if ((sponsoredCountOnline > 0 || hasPartnerInEvidence) && !persuasionTacticsDetailed.some((t) => /partner|sponsor|affiliate/i.test(t.tactic))) {
      persuasionTacticsDetailed = [
        ...persuasionTacticsDetailed,
        {
          tactic: "Partnership / sponsored content",
          explanation: "Some sources disclose brand partnerships or affiliate links. This can influence how positively the product is presented.",
        },
      ];
    }

    const fitForSituation =
      budgetText || valuesText
        ? String(rawVerdict?.fitForSituation ?? "").trim() || undefined
        : undefined;

    const finalReasoning =
      typeof rawVerdict?.finalReasoning === "string" && rawVerdict.finalReasoning.length > 0
        ? String(rawVerdict.finalReasoning).slice(0, 500)
        : offlineResult.verdict.finalReasoning;

    const verdict: CoachVerdict = {
      label: safeCoachLabel(rawVerdict?.label),
      rationaleBullets: Array.isArray(rawVerdict?.rationaleBullets)
        ? (rawVerdict.rationaleBullets as string[]).slice(0, 5).filter((x): x is string => typeof x === "string")
        : offlineResult.verdict.rationaleBullets,
      whatWouldChangeMyMind: Array.isArray(rawVerdict?.whatWouldChangeMyMind)
        ? (rawVerdict.whatWouldChangeMyMind as string[]).slice(0, 4).filter((x): x is string => typeof x === "string")
        : offlineResult.verdict.whatWouldChangeMyMind,
      evidenceSummary,
      persuasionTacticsDetailed,
      fitForSituation,
      finalReasoning,
    };

    const response: DeinfluenceCoachResponse = {
      claim,
      evidence,
      contradictions: contradictions.length > 0 ? contradictions : offlineResult.contradictions,
      biasMap,
      reflectionPrompts,
      confidence: coachConfidence,
      verdict,
      mode: "online",
      extractedProductName,
      extractedBrand,
      extractedPrice,
    };

    return NextResponse.json(response);
  } catch {
    return NextResponse.json({
      ...offlineResult,
      extractedProductName,
      extractedBrand,
      extractedPrice,
    });
  }
}
