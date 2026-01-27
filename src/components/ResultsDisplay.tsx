import { secondsToTime, formatPaceWithUnit, milesToKm } from '../utils/calculations';
import PaceChart from './PaceChart';
import type { ProjectionResult, ComparableProjections, UnitPreference, Split, FadeRiskAssessment } from '../types';

interface SummaryProps {
  projection: ProjectionResult;
  unit: UnitPreference;
}

const Summary = ({ projection, unit }: SummaryProps) => {
  const delta = projection.timeDelta;
  const deltaClass = delta > 0 ? 'positive' : delta < 0 ? 'negative' : '';

  return (
    <div className="summary">
      <div className="summary-item">
        <div className="label">Projected Finish</div>
        <div className="value">{secondsToTime(projection.projectedFinishTime)}</div>
        {delta !== 0 && (
          <div className={`delta ${deltaClass}`}>
            {delta > 0 ? '+' : ''}{secondsToTime(Math.abs(delta))} vs goal
          </div>
        )}
      </div>
      <div className="summary-item">
        <div className="label">Start Pace</div>
        <div className="value">{formatPaceWithUnit(projection.startPace, unit)}</div>
        <div className="delta">
          Sustainable: {formatPaceWithUnit(projection.sustainablePace, unit)}
        </div>
      </div>
    </div>
  );
};

interface FadeRiskIndicatorProps {
  fadeRisk: FadeRiskAssessment;
}

const FadeRiskIndicator = ({ fadeRisk }: FadeRiskIndicatorProps) => (
  <div className={`risk-indicator ${fadeRisk.level}`}>
    <div className="level">Fade Risk: {fadeRisk.level.replace('-', ' ')}</div>
    <div className="message">{fadeRisk.message}</div>
  </div>
);

interface ComparisonSummaryProps {
  main: ProjectionResult;
  comparisons: ComparableProjections;
  unit: UnitPreference;
}

const ComparisonSummary = ({ main, comparisons, unit }: ComparisonSummaryProps) => {
  const unitLabel = unit === 'km' ? 'km' : 'mi';
  const offsetLabel = unit === 'km' ? '6s' : '10s';

  return (
    <div className="comparison-summary">
      <div className="comparison-row aggressive">
        <span className="scenario-label">Aggressive (−{offsetLabel}/{unitLabel})</span>
        <span className="scenario-time">{secondsToTime(comparisons.aggressive.projectedFinishTime)}</span>
        <span className="scenario-risk">{comparisons.aggressive.fadeRisk.level.replace('-', ' ')}</span>
      </div>
      <div className="comparison-row current">
        <span className="scenario-label">Current</span>
        <span className="scenario-time">{secondsToTime(main.projectedFinishTime)}</span>
        <span className="scenario-risk">{main.fadeRisk.level.replace('-', ' ')}</span>
      </div>
      <div className="comparison-row conservative">
        <span className="scenario-label">Conservative (+{offsetLabel}/{unitLabel})</span>
        <span className="scenario-time">{secondsToTime(comparisons.conservative.projectedFinishTime)}</span>
        <span className="scenario-risk">{comparisons.conservative.fadeRisk.level.replace('-', ' ')}</span>
      </div>
    </div>
  );
};

interface SplitTableProps {
  splits: Split[];
  unit: UnitPreference;
}

const SplitTable = ({ splits, unit }: SplitTableProps) => {
  const distanceHeader = unit === 'km' ? 'km' : 'Mile';

  // Format distance display based on unit
  const formatSplitDistance = (split: Split): string | number => {
    if (unit === 'km') {
      const startKm = milesToKm(split.mile - 1);
      const endKm = milesToKm(split.mile - 1 + split.distance);
      if (split.distance < 1) {
        return `${startKm.toFixed(1)}–${endKm.toFixed(1)}`;
      }
      return `${startKm.toFixed(1)}–${endKm.toFixed(1)}`;
    }
    // Miles mode
    if (split.distance < 1) {
      return `${split.mile - 1}–${(split.mile - 1 + split.distance).toFixed(1)}`;
    }
    return split.mile;
  };

  return (
    <div className="split-table-wrapper">
      <table className="split-table">
      <thead>
        <tr>
          <th>{distanceHeader}</th>
          <th>Pace</th>
          <th>Split</th>
          <th>Cumulative</th>
          <th>Fade</th>
        </tr>
      </thead>
      <tbody>
        {splits.map((split) => (
          <tr key={split.mile}>
            <td>{formatSplitDistance(split)}</td>
            <td>{formatPaceWithUnit(split.pace, unit)}</td>
            <td>{secondsToTime(split.splitTime)}</td>
            <td>{secondsToTime(split.cumulativeTime)}</td>
            <td className={split.fadeAdjustment > 0 ? 'fade-cell' : ''}>
              {split.fadeAdjustment > 0 ? `+${split.fadeAdjustment.toFixed(0)}s` : '—'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    </div>
  );
};

interface ResultsDisplayProps {
  projection: ProjectionResult | null;
  comparisons: ComparableProjections | null;
  compareMode: boolean;
  unit?: UnitPreference;
}

const ResultsDisplay = ({ projection, comparisons, unit = 'miles' }: ResultsDisplayProps) => {
  if (!projection) {
    return (
      <div className="panel">
        <h2>Projected Splits</h2>
        <p>Enter valid race times to see projections.</p>
      </div>
    );
  }

  return (
    <div className="panel">
      <h2>Projected Splits</h2>
      <Summary projection={projection} unit={unit} />
      <FadeRiskIndicator fadeRisk={projection.fadeRisk} />
      <PaceChart
        splits={projection.splits}
        sustainablePace={projection.sustainablePace}
        comparisons={comparisons}
        unit={unit}
      />
      {comparisons && (
        <ComparisonSummary main={projection} comparisons={comparisons} unit={unit} />
      )}
      <SplitTable splits={projection.splits} unit={unit} />
    </div>
  );
};

export default ResultsDisplay;
