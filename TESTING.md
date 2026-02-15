# FitMatch – Reasoning Coach Testing Instructions

## Quick Start

```bash
cp .env.example .env.local
# Edit .env.local with your keys (see below)
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (redirects to `/deinfluence`).

---

## Reasoning Coach Flow

The app walks users through critical thinking: Claim → Evidence → Contradictions → Bias Map → Reflection → Confidence → Verdict.

### Steps

1. **Input:** Paste product URL → **Fetch metadata** (pre-fills product name, brand) → Optional claim → **Analyze with Reasoning Coach**
2. **A – Claims:** Raw claim + testable sub-claims (e.g. Quality, Value, Durability)
3. **B – Evidence:** YouTube results table with classification (sponsored, neutral_review, critical_review, affiliate_driven, promotional)
4. **C – Contradictions:** Conflicts between claim and evidence; click citations to scroll to evidence
5. **D – Bias Map:** Social proof, scarcity, authority, brand prestige (0–5) with explanations
6. **E – Reflection:** Three tailored questions; user can edit answers
7. **F – Confidence:** Before/after sliders → delta and interpretation
8. **Verdict:** Buy | Caution | Skip — rationale, what would change your mind

---

## API Endpoints

| Endpoint | Method | Body | Response |
|----------|--------|------|----------|
| `/api/product/parse` | POST | `{ url: string }` | `{ brand, productName, title, ogTitle, ogSiteName }` |
| `/api/evidence/youtube` | POST | `{ query: string }` | `{ videos: [...] }` |
| `/api/deinfluence/analyze` | POST | DeinfluenceRequest | DeinfluenceCoachResponse |

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `YOUTUBE_API_KEY` | For evidence | YouTube Data API v3 key |
| `MISTRAL_API_KEY` | For AI | Mistral AI API key (omit for offline heuristics) |

---

## Test Case 1: Low Bias / No Sponsorship

**Goal:** Verify a product with honest reviews and no sponsorship triggers gets a favorable coach flow.

**Setup:** Add `YOUTUBE_API_KEY` and `MISTRAL_API_KEY`.

**Steps:**
1. Go to [http://localhost:3000/deinfluence](http://localhost:3000/deinfluence).
2. Paste a product URL for a well-reviewed item (e.g. generic “Essentials Hoodie” or any product with neutral reviews).
3. Use a claim like: `Comfortable and durable, good value for money`
4. Click **Analyze with Reasoning Coach**.
5. **Expected:**
   - Evidence table shows mostly `neutral_review` or `critical_review` classifications.
   - Bias map: low scores for social proof, scarcity, authority, brand prestige.
   - Few or no contradictions.
   - Verdict likely **Buy** or **Caution**.
   - Language: “Based on the evidence you reviewed…” (no “AI decides for you”).

---

## Test Case 2: Heavy Sponsorship + Scarcity

**Goal:** Verify sponsored/affiliate content and scarcity language trigger caution.

**Setup:** Same as above.

**Steps:**
1. Go to [http://localhost:3000/deinfluence](http://localhost:3000/deinfluence).
2. Paste product URL or enter product name: `Limited edition sneakers`
3. Claim: `Best affiliate link in bio, sponsored by brand — limited drop, last chance, everyone has these`
4. Click **Analyze with Reasoning Coach**.
5. **Expected:**
   - Evidence table shows `sponsored` and/or `affiliate_driven` classifications.
   - Bias map: high scarcity (4–5), high social proof (4–5).
   - Verdict **Skip** or **Caution**.
   - Rationale cites sponsorship and scarcity.
   - “What would increase confidence”: e.g. “Independent critical reviews with no affiliate links”.

---

## Offline Mode

**Setup:** Remove `MISTRAL_API_KEY` from `.env.local`.

- Product parse and YouTube evidence still work if keys are set.
- Coach uses heuristics: keyword-based evidence classification, bias scores, simple contradiction matching.
- Verdict label uses rule-based logic.
- Verify “AI: Offline” chip on verdict.

---

## Rate Limit

`/api/deinfluence/analyze`: 10 requests/min per IP. Returns 429 when exceeded.
