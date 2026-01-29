import { RACE_DISTANCES, MILES_TO_KM } from '../utils/constants';
import { validateTimeString, fahrenheitToCelsius, celsiusToFahrenheit } from '../utils/calculations';
import type { AppInputs, UnitPreference, RaceKey, HumidityLevel } from '../types';

interface HumidityToggleProps {
  value: HumidityLevel;
  onChange: (humidity: HumidityLevel) => void;
}

const HumidityToggle = ({ value, onChange }: HumidityToggleProps) => (
  <div className="humidity-toggle">
    <button
      type="button"
      className={`humidity-btn ${value === 'low' ? 'active' : ''}`}
      onClick={() => onChange('low')}
    >
      Low
    </button>
    <button
      type="button"
      className={`humidity-btn ${value === 'moderate' ? 'active' : ''}`}
      onClick={() => onChange('moderate')}
    >
      Moderate
    </button>
    <button
      type="button"
      className={`humidity-btn ${value === 'high' ? 'active' : ''}`}
      onClick={() => onChange('high')}
    >
      High
    </button>
  </div>
);

interface UnitToggleProps {
  value: UnitPreference;
  onChange: (unit: UnitPreference) => void;
}

const UnitToggle = ({ value, onChange }: UnitToggleProps) => (
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

interface TimeInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error: string | null;
}

const TimeInput = ({ id, label, value, onChange, error }: TimeInputProps) => {
  const errorId = `${id}-error`;
  return (
    <div className={`form-group ${error ? 'has-error' : ''}`}>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="text"
        placeholder="M:SS or H:MM:SS"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
      />
      {error && <div id={errorId} className="error-message" role="alert">{error}</div>}
    </div>
  );
};

interface RaceSelectProps {
  id: string;
  label: string;
  value: RaceKey;
  onChange: (race: RaceKey) => void;
}

const RaceSelect = ({ id, label, value, onChange }: RaceSelectProps) => (
  <div className="form-group">
    <label htmlFor={id}>{label}</label>
    <select id={id} value={value} onChange={(e) => onChange(e.target.value as RaceKey)}>
      {(Object.entries(RACE_DISTANCES) as [RaceKey, { label: string; miles: number; km: number }][]).map(([key, race]) => (
        <option key={key} value={key}>
          {race.label}
        </option>
      ))}
    </select>
  </div>
);

interface RaceInputFormProps {
  inputs: AppInputs;
  onInputChange: (inputs: AppInputs) => void;
}

const RaceInputForm = ({ inputs, onInputChange }: RaceInputFormProps) => {
  const handleChange = <K extends keyof AppInputs>(field: K) => (value: AppInputs[K]) => {
    onInputChange({ ...inputs, [field]: value });
  };

  // Validate time inputs
  const goalTimeValidation = validateTimeString(inputs.goalTime);
  const recentTimeValidation = validateTimeString(inputs.recentTime);

  // Only show errors if user has typed something
  const goalTimeError = inputs.goalTime && !goalTimeValidation.valid
    ? goalTimeValidation.error ?? null
    : null;
  const recentTimeError = inputs.recentTime && !recentTimeValidation.valid
    ? recentTimeValidation.error ?? null
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
          id="goal-race"
          label="Goal Race"
          value={inputs.goalRace}
          onChange={handleChange('goalRace')}
        />
        <TimeInput
          id="goal-time"
          label="Goal Time"
          value={inputs.goalTime}
          onChange={handleChange('goalTime')}
          error={goalTimeError}
        />
      </div>

      <div className="form-row">
        <RaceSelect
          id="recent-race"
          label="Recent Race"
          value={inputs.recentRace}
          onChange={handleChange('recentRace')}
        />
        <TimeInput
          id="recent-time"
          label="Recent Time"
          value={inputs.recentTime}
          onChange={handleChange('recentTime')}
          error={recentTimeError}
        />
      </div>

      <div className="form-group">
        <label htmlFor="pacing-adjustment">
          Pacing Adjustment (sec/{unitLabel} from sustainable)
        </label>
        <input
          id="pacing-adjustment"
          type="range"
          min="-30"
          max="30"
          value={inputs.pacingAdjustment}
          onChange={(e) => handleChange('pacingAdjustment')(Number(e.target.value))}
          aria-label={`Pacing adjustment: ${inputs.pacingAdjustment} seconds per mile from sustainable pace`}
          aria-valuetext={
            inputs.pacingAdjustment === 0
              ? 'Even, sustainable pace'
              : inputs.pacingAdjustment < 0
              ? `${displayAdjustment} seconds per ${unitLabel} faster than sustainable`
              : `${displayAdjustment} seconds per ${unitLabel} slower than sustainable`
          }
        />
        <div className="slider-value" aria-hidden="true">
          {inputs.pacingAdjustment === 0
            ? 'Even (sustainable pace)'
            : inputs.pacingAdjustment < 0
            ? `${displayAdjustment} sec/${unitLabel} faster`
            : `${displayAdjustment} sec/${unitLabel} slower`}
        </div>
      </div>

      <div className="compare-toggle">
        <input
          id="compare-mode"
          type="checkbox"
          checked={inputs.compareMode}
          onChange={(e) => handleChange('compareMode')(e.target.checked)}
        />
        <label htmlFor="compare-mode">
          Compare ±{inputs.unitPreference === 'km' ? '6' : '10'} sec/{unitLabel} scenarios
        </label>
      </div>

      <div className="weather-section">
        <div className="weather-toggle">
          <input
            id="weather-enabled"
            type="checkbox"
            checked={inputs.weatherEnabled}
            onChange={(e) => handleChange('weatherEnabled')(e.target.checked)}
          />
          <label htmlFor="weather-enabled">Adjust for weather conditions</label>
        </div>

        {inputs.weatherEnabled && (
          <div className="weather-inputs">
            <div className="form-group">
              <label htmlFor="temperature">
                Temperature ({inputs.unitPreference === 'km' ? '°C' : '°F'})
              </label>
              <input
                id="temperature"
                type="range"
                min={inputs.unitPreference === 'km' ? 5 : 40}
                max={inputs.unitPreference === 'km' ? 35 : 95}
                value={inputs.unitPreference === 'km' ? fahrenheitToCelsius(inputs.temperature) : inputs.temperature}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  const tempF = inputs.unitPreference === 'km' ? celsiusToFahrenheit(value) : value;
                  handleChange('temperature')(tempF);
                }}
                aria-label={`Temperature: ${inputs.unitPreference === 'km' ? fahrenheitToCelsius(inputs.temperature) : inputs.temperature}°${inputs.unitPreference === 'km' ? 'C' : 'F'}`}
              />
              <div className="slider-value" aria-hidden="true">
                {inputs.unitPreference === 'km'
                  ? `${fahrenheitToCelsius(inputs.temperature)}°C`
                  : `${inputs.temperature}°F`}
              </div>
            </div>

            <div className="form-group">
              <label>Humidity</label>
              <HumidityToggle
                value={inputs.humidity}
                onChange={handleChange('humidity')}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RaceInputForm;
