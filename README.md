# BlockLens

A race day pacing simulator that helps runners explore pacing strategies and visualize projected fade/finish times.

## What It Does

BlockLens takes your recent race performance and uses the [Riegel formula](https://en.wikipedia.org/wiki/Peter_Riegel) to estimate what pace you can sustain for a goal race. It then applies a fade model to show what happens when you start faster or slower than that sustainable pace.

**Key insight:** Going out too fast doesn't just cost you the time you "banked" — the fade compounds. BlockLens visualizes this tradeoff so you can make informed pacing decisions.

## Features

- **Pace projection** — Enter a recent race result and see your sustainable pace for 5K, 10K, half marathon, or marathon
- **Fade modeling** — Adjust your starting pace and see how fade accumulates in the back half
- **Comparison mode** — Overlay aggressive and conservative scenarios (±10 sec/mile) to compare outcomes
- **Visual chart** — See your projected pace curve with the sustainable pace reference line
- **Risk indicator** — Get a quick read on fade risk from conservative to blow-up territory
- **Unit toggle** — Switch between miles and kilometers

## Getting Started

```
npm install      # Install dependencies
npm run dev      # Start development server
npm test         # Run unit tests
npm run test:e2e # Run E2E tests
npm run build    # Build for production
```

## How It Works

### Riegel Formula

Predicts race time across distances based on a known performance:

```
T2 = T1 × (D2/D1)^1.06
```

A 20:00 5K predicts roughly a 41:30 10K and a 1:32 half marathon.

### Fade Model

When you start faster than sustainable pace:
- First half: No fade (you're "banking" time)
- Second half: Fade accelerates exponentially
- The cost multiplies — going 10 sec/mile too fast might cost you 15+ sec/mile by the finish

The model is intentionally soft. Aggressive pacing *can* work — but the risk increases. BlockLens shows the tradeoff without prescribing a single "right" answer.

## Tech Stack

- React 19 + Vite + TypeScript
- Recharts for visualization
- Vitest for unit testing
- Playwright for E2E testing
- GitHub Actions for CI/CD

## License

MIT
