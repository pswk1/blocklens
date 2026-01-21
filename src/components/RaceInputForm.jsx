import { RACE_DISTANCES } from '../utils/constants.js';

function TimeInput({ label, value, onChange }) {
  return (
    <div className="form-group">
      <label>{label}</label>
      <input
        type="text"
        placeholder="H:MM:SS or MM:SS"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function RaceSelect({ label, value, onChange }) {
  return (
    <div className="form-group">
      <label>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {Object.entries(RACE_DISTANCES).map(([key, race]) => (
          <option key={key} value={key}>
            {race.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function RaceInputForm({ inputs, onInputChange }) {
  const handleChange = (field) => (value) => {
    onInputChange({ ...inputs, [field]: value });
  };

  return (
    <div className="panel">
      <h2>Race Setup</h2>

      <div className="form-row">
        <RaceSelect
          label="Goal Race"
          value={inputs.goalRace}
          onChange={handleChange('goalRace')}
        />
        <TimeInput
          label="Goal Time"
          value={inputs.goalTime}
          onChange={handleChange('goalTime')}
        />
      </div>

      <div className="form-row">
        <RaceSelect
          label="Recent Race"
          value={inputs.recentRace}
          onChange={handleChange('recentRace')}
        />
        <TimeInput
          label="Recent Time"
          value={inputs.recentTime}
          onChange={handleChange('recentTime')}
        />
      </div>

      <div className="form-group">
        <label>
          Pacing Adjustment (sec/mile from sustainable)
        </label>
        <input
          type="range"
          min="-30"
          max="30"
          value={inputs.pacingAdjustment}
          onChange={(e) => handleChange('pacingAdjustment')(Number(e.target.value))}
        />
        <div className="slider-value">
          {inputs.pacingAdjustment === 0
            ? 'Even (sustainable pace)'
            : inputs.pacingAdjustment < 0
            ? `${Math.abs(inputs.pacingAdjustment)} sec/mile faster`
            : `${inputs.pacingAdjustment} sec/mile slower`}
        </div>
      </div>
    </div>
  );
}
