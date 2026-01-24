# BlockLens

A React app that helps runners explore pacing strategies and visualize projected fade/finish times.

## Tech Stack

- React 19 with Vite
- Recharts for visualization
- Vitest for testing

## Commands

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm test` — run unit tests

## Project Structure

```
src/
├── components/       # React UI components
│   ├── RaceInputForm.jsx
│   ├── ResultsDisplay.jsx
│   └── PaceChart.jsx
├── utils/            # Calculation logic (separate from UI)
│   ├── constants.js
│   ├── calculations.js
│   └── calculations.test.js
├── App.jsx
├── main.jsx
└── index.css
```

## Conventions

- Follow [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- Use `const` for all variables and function expressions (arrow functions)
- Functional components only (as arrow functions)
- Keep calculation logic separate from UI components

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
- localStorage persistence for inputs
- Mobile-responsive layout
