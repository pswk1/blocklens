import { useState, useMemo } from 'react';
import RaceInputForm from './components/RaceInputForm.jsx';
import ResultsDisplay from './components/ResultsDisplay.jsx';
import { timeToSeconds, calculateProjection } from './utils/calculations.js';

const DEFAULT_INPUTS = {
  goalRace: 'marathon',
  goalTime: '3:30:00',
  recentRace: 'half',
  recentTime: '1:40:00',
  pacingAdjustment: 0,
};

const App = () => {
  const [inputs, setInputs] = useState(DEFAULT_INPUTS);

  const projection = useMemo(() => {
    const goalTimeSeconds = timeToSeconds(inputs.goalTime);
    const recentTimeSeconds = timeToSeconds(inputs.recentTime);

    if (!goalTimeSeconds || !recentTimeSeconds) {
      return null;
    }

    return calculateProjection({
      goalRace: inputs.goalRace,
      goalTimeSeconds,
      recentRace: inputs.recentRace,
      recentTimeSeconds,
      pacingAdjustment: inputs.pacingAdjustment,
    });
  }, [inputs]);

  return (
    <div className="app">
      <h1 className="app-title">Race Day Simulator</h1>
      <div className="panels">
        <RaceInputForm inputs={inputs} onInputChange={setInputs} />
        <ResultsDisplay projection={projection} />
      </div>
    </div>
  );
};

export default App;
