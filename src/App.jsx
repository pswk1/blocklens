import { useState, useMemo, useEffect } from 'react';
import RaceInputForm from './components/RaceInputForm.jsx';
import ResultsDisplay from './components/ResultsDisplay.jsx';
import { timeToSeconds, calculateProjection } from './utils/calculations.js';

const STORAGE_KEY = 'blocklens-inputs';

const DEFAULT_INPUTS = {
  goalRace: 'marathon',
  goalTime: '3:30:00',
  recentRace: 'half',
  recentTime: '1:40:00',
  pacingAdjustment: 0,
  compareMode: false,
};

const COMPARE_OFFSET = 10; // seconds per mile

const loadSavedInputs = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Merge with defaults to handle any new fields
      return { ...DEFAULT_INPUTS, ...parsed };
    }
  } catch (e) {
    // Ignore localStorage errors
  }
  return DEFAULT_INPUTS;
};

const App = () => {
  const [inputs, setInputs] = useState(loadSavedInputs);

  // Save to localStorage whenever inputs change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(inputs));
    } catch (e) {
      // Ignore localStorage errors
    }
  }, [inputs]);

  const projections = useMemo(() => {
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
          projection={projections?.main}
          comparisons={projections?.comparisons}
          compareMode={inputs.compareMode}
        />
      </div>
    </div>
  );
};

export default App;
