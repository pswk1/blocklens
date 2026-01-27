import { useState, useMemo, useEffect } from 'react';
import RaceInputForm from './components/RaceInputForm';
import ResultsDisplay from './components/ResultsDisplay';
import { timeToSeconds, calculateProjection } from './utils/calculations';
import type { AppInputs, ProjectionResult, ComparableProjections } from './types';

const STORAGE_KEY = 'blocklens-inputs';

const DEFAULT_INPUTS: AppInputs = {
  goalRace: 'marathon',
  goalTime: '3:30:00',
  recentRace: 'half',
  recentTime: '1:40:00',
  pacingAdjustment: 0,
  compareMode: false,
  unitPreference: 'miles',
};

const COMPARE_OFFSET = 10; // seconds per mile

const loadSavedInputs = (): AppInputs => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed: Partial<AppInputs> = JSON.parse(saved);
      // Merge with defaults to handle any new fields
      return { ...DEFAULT_INPUTS, ...parsed };
    }
  } catch {
    // Ignore localStorage errors
  }
  return DEFAULT_INPUTS;
};

interface AppProjections {
  main: ProjectionResult;
  comparisons: ComparableProjections | null;
}

const App = () => {
  const [inputs, setInputs] = useState<AppInputs>(loadSavedInputs);

  // Save to localStorage whenever inputs change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(inputs));
    } catch {
      // Ignore localStorage errors
    }
  }, [inputs]);

  const projections = useMemo<AppProjections | null>(() => {
    const goalTimeSeconds = timeToSeconds(inputs.goalTime);
    const recentTimeSeconds = timeToSeconds(inputs.recentTime);

    if (!goalTimeSeconds || !recentTimeSeconds) {
      return null;
    }

    const baseParams = {
      goalRace: inputs.goalRace,
      goalTimeSeconds,
      recentRace: inputs.recentRace,
      recentTimeSeconds,
    };

    const main = calculateProjection({
      ...baseParams,
      pacingAdjustment: inputs.pacingAdjustment,
    });

    if (!inputs.compareMode) {
      return { main, comparisons: null };
    }

    // Generate comparison scenarios: more aggressive and more conservative
    const aggressive = calculateProjection({
      ...baseParams,
      pacingAdjustment: inputs.pacingAdjustment - COMPARE_OFFSET,
    });

    const conservative = calculateProjection({
      ...baseParams,
      pacingAdjustment: inputs.pacingAdjustment + COMPARE_OFFSET,
    });

    return {
      main,
      comparisons: { aggressive, conservative },
    };
  }, [inputs]);

  return (
    <div className="app">
      <h1 className="app-title">BlockLens</h1>
      <div className="panels">
        <RaceInputForm inputs={inputs} onInputChange={setInputs} />
        <ResultsDisplay
          projection={projections?.main ?? null}
          comparisons={projections?.comparisons ?? null}
          compareMode={inputs.compareMode}
          unit={inputs.unitPreference}
        />
      </div>
    </div>
  );
};

export default App;
