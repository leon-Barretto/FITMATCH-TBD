# FITMATCH-TBD

FitMatch is an interactive, AI-powered decision-support platform that guides users beyond passive fashion recommendations toward critical thinking, reflection, and intentional consumer choices. The app deconstructs influencer trends, highlights psychological biases (social proof, FOMO, brand prestige), and empowers users to align purchases with their values.

## Design

This workspace contains a **Figma-quality SaaS design** built with Next.js + Tailwind CSS. Premium aesthetics include:

- **Design Tokens & Spacing Scale** — Professional color system, typography hierarchy, rounded corners, shadows
- **Clean Component Library** — Header, Layout, DecisionFlow form, AgentOutput cards
- **Smooth Interactions** — Fade-in, slide-up, and scale animations; hover effects; focus states
- **Responsive Grid Layout** — Mobile-first design system with proper breathing room
- **Premium SaaS Feel** — Think Stripe, Linear, Vercel: minimal, polished, intentional

## Quick Start

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## File Structure

```
/pages
  _app.js              # Global app wrapper
  index.js             # Landing page with hero, features, DecisionFlow

/components
  Header.js            # Sticky navigation bar
  Layout.js            # Main layout with footer
  DecisionFlow.js      # Form for structured decision input
  AgentOutput.js       # Display analysis results & reflection prompts

/styles
  globals.css          # Design tokens, typography, animations

/root
  tailwind.config.js   # Tailwind configuration with custom theme
  postcss.config.js    # PostCSS plugins
  next.config.js       # Next.js configuration
  package.json         # Dependencies & scripts
```

## Next Steps

- Hook up real IBM Watson API for image + text processing (watsonx.ai or Watson Vision + NLU)
- Add server-side agent endpoint to synthesize structured recommendations
- Implement user authentication and decision history
- Build design system tokens in Figma, then export to Tailwind

---

Built with **Next.js 13** + **Tailwind CSS 3** + **React 18**

