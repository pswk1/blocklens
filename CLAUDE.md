# Race Day Simulator

A React app that helps runners explore pacing strategies and visualize projected fade/finish times.

## Tech Stack

- React with Vite
- No TypeScript (plain JavaScript)
- Recharts for graphs

## Conventions

- Functional components only
- Keep calculation logic separate from UI components

## Key Domain Concepts

### Sustainable Pace (Riegel Formula)
Derives a runner's sustainable pace from a recent race result using the Riegel formula for predicting race times across distances.

### Fade Model
Models the cost of going out too fast—time "banked" early is lost at a greater rate later. The relationship is non-linear: aggressive early pacing costs more than the time saved.

### Design Philosophy
The goal is to visualize tradeoffs between pacing strategies, not prescribe a single "right" answer. Let runners explore and understand the consequences of different approaches.

## Current Status

MVP in progress. Building core calculation logic and basic inputs.
