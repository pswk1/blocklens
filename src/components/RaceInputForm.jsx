import { RACE_DISTANCES, MILES_TO_KM } from '../utils/constants.js';
import { validateTimeString } from '../utils/calculations.js';

const UnitToggle = ({ value, onChange }) => (
  <div className="unit-toggle">
    <button
      type="button"
      className={`unit-btn ${value === 'miles' ? 'active' : ''}`}
      onClick={() => onChange('miles')}
    >
      Miles
    </button>
    <button
      type="button"
      className={`unit-btn ${value === 'km' ? 'active' : ''}`}
      onClick={() => onChange('km')}
    >
      Kilometers
    </button>
  </div>
);

const TimeInput = ({ label, value, onChange, error }) => (
  <div className={`form-group ${error ? 'has-error' : ''}`}>
    <label>{label}</label>
    <input
      type="text"
      placeholder="M:SS or H:MM:SS"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
    {error && <div className="error-message">{error}</div>}
  </div>
);

const RaceSelect = ({ label, value, onChange }) => (
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

const RaceInputForm = ({ inputs, onInputChange }) => {
  const handleChange = (field) => (value) => {
    onInputChange({ ...inputs, [field]: value });
  };

  // Validate time inputs
  const goalTimeValidation = validateTimeString(inputs.goalTime);
  const recentTimeValidation = validateTimeString(inputs.recentTime);

  // Only show errors if user has typed something
  const goalTimeError = inputs.goalTime && !goalTimeValidation.valid
    ? goalTimeValidation.error
    : null;
  const recentTimeError = inputs.recentTime && !recentTimeValidation.valid
    ? recentTimeValidation.error
    : null;

  // Unit label for display
  const unitLabel = inputs.unitPreference === 'km' ? 'km' : 'mi';

  // Convert sec/mile adjustment to sec/km for display when in km mode
  const displayAdjustment = inputs.unitPreference === 'km'
    ? Math.round(Math.abs(inputs.pacingAdjustment) / MILES_TO_KM)
    : Math.abs(inputs.pacingAdjustment);

  return (
    <div className="panel">
      <UnitToggle
        value={inputs.unitPreference}
        onChange={handleChange('unitPreference')}
      />
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
          error={goalTimeError}
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
          error={recentTimeError}
        />
      </div>

      <div className="form-group">
        <label>
          Pacing Adjustment (sec/{unitLabel} from sustainable)
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
            ? `${displayAdjustment} sec/${unitLabel} faster`
            : `${displayAdjustment} sec/${unitLabel} slower`}
        </div>
      </div>

      <label className="compare-toggle">
        <input
          type="checkbox"
          checked={inputs.compareMode}
          onChange={(e) => handleChange('compareMode')(e.target.checked)}
        />
        <span>Compare ±{inputs.unitPreference === 'km' ? '6' : '10'} sec/{unitLabel} scenarios</span>
      </label>
    </div>
  );
};

export default RaceInputForm;
