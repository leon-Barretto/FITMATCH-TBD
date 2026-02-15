# FitMatch – Reasoning Coach

**Paste link → Think critically → Decide**

FitMatch is a media literacy tool that walks users through evidence, contradictions, bias, and reflection — so they decide, not an algorithm.

## Quick Demo (for judges)

1. `npm run dev` → open [http://localhost:3000](http://localhost:3000)
2. Click **Try with sample** (pre-loaded Garage sweatsuit) — no setup required
3. Or paste any product URL (e.g. from Aritzia, Garage, etc.)

## Getting Started

```bash
cp .env.example .env.local
# Add YOUTUBE_API_KEY and MISTRAL_API_KEY for full AI (optional — works offline with heuristics)
npm run dev
```

🧠 What FitMatch Does
- FitMatch walks users through a structured reasoning flow:
- Extracts product claims
- Identifies missing evidence
- Highlights contradictions
- Flags potential bias or marketing tactics
- Prompts reflection on values, budget, and social influence

The goal: help users think critically instead of blindly following trends.

🛠 Tech Stack
Next.js (App Router)
TypeScript
Tailwind CSS
Vercel deployment

🎯 Project Goal

FitMatch redefines recommendation systems by shifting from algorithmic persuasion to user reasoning.
Instead of:
“Here’s what you should wear”
It asks:
“Why do you want this, and does it actually make sense?”

## Deployed on Vercel


