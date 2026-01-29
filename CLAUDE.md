# BlockLens

A React app that helps runners explore pacing strategies and visualize projected fade/finish times.

## Tech Stack

- React 19 with Vite
- TypeScript (strict mode)
- Recharts for visualization
- Vitest for unit testing
- Playwright for E2E testing
- GitHub Actions for CI/CD

## Commands

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm test` — run unit tests
- `npm run test:e2e` — run E2E tests
- `npm run test:e2e:ui` — run E2E tests with visual UI

## Project Structure

```
src/
├── components/       # React UI components
│   ├── RaceInputForm.tsx
│   ├── ResultsDisplay.tsx
│   └── PaceChart.tsx
├── utils/            # Calculation logic (separate from UI)
│   ├── constants.ts
│   ├── calculations.ts
│   └── calculations.test.ts
├── types.ts          # Shared TypeScript types
├── App.tsx
├── main.tsx
└── index.css
e2e/
└── app.spec.ts       # Playwright E2E tests
```

## Conventions

- Follow [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- Use `const` for all variables and function expressions (arrow functions)
- Functional components only (as arrow functions)
- Keep calculation logic separate from UI components
- Use TypeScript strict mode with explicit return types

## Key Domain Concepts

### Sustainable Pace (Riegel Formula)
Derives a runner's sustainable pace from a recent race result using the Riegel formula for predicting race times across distances.

### Fade Model
Models the cost of going out too fast—time "banked" early is lost at a greater rate later. The relationship is non-linear: aggressive early pacing costs more than the time saved.

### Design Philosophy
The goal is to visualize tradeoffs between pacing strategies, not prescribe a single "right" answer. Let runners explore and understand the consequences of different approaches.

## Features

- Goal race and recent race inputs with time validation
- Pacing adjustment slider (±30 sec/mile from sustainable)
- Projected split table with fade indicators
- Pace chart showing fade over distance
- Comparison mode (±10 sec/mile scenarios overlaid)
- Fade risk indicator (conservative → very high)
- Unit toggle (miles/kilometers)
- localStorage persistence for inputs
- Mobile-responsive layout
