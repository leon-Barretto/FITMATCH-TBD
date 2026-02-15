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

Open [http://localhost:3000](http://localhost:3000).

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## AI (for Hacatron)

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
