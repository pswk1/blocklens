import { secondsToTime, formatPace } from '../utils/calculations.js';
import PaceChart from './PaceChart.jsx';

const Summary = ({ projection }) => {
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
        <div className="value">{formatPace(projection.startPace)}/mi</div>
        <div className="delta">
          Sustainable: {formatPace(projection.sustainablePace)}/mi
        </div>
      </div>
    </div>
  );
};

const FadeRiskIndicator = ({ fadeRisk }) => (
  <div className={`risk-indicator ${fadeRisk.level}`}>
    <div className="level">Fade Risk: {fadeRisk.level.replace('-', ' ')}</div>
    <div className="message">{fadeRisk.message}</div>
  </div>
);

const ComparisonSummary = ({ main, comparisons }) => (
  <div className="comparison-summary">
    <div className="comparison-row aggressive">
      <span className="scenario-label">Aggressive (−10s/mi)</span>
      <span className="scenario-time">{secondsToTime(comparisons.aggressive.projectedFinishTime)}</span>
      <span className="scenario-risk">{comparisons.aggressive.fadeRisk.level.replace('-', ' ')}</span>
    </div>
    <div className="comparison-row current">
      <span className="scenario-label">Current</span>
      <span className="scenario-time">{secondsToTime(main.projectedFinishTime)}</span>
      <span className="scenario-risk">{main.fadeRisk.level.replace('-', ' ')}</span>
    </div>
    <div className="comparison-row conservative">
      <span className="scenario-label">Conservative (+10s/mi)</span>
      <span className="scenario-time">{secondsToTime(comparisons.conservative.projectedFinishTime)}</span>
      <span className="scenario-risk">{comparisons.conservative.fadeRisk.level.replace('-', ' ')}</span>
    </div>
  </div>
);

const SplitTable = ({ splits }) => (
  <table className="split-table">
    <thead>
      <tr>
        <th>Mile</th>
        <th>Pace</th>
        <th>Split</th>
        <th>Cumulative</th>
        <th>Fade</th>
      </tr>
    </thead>
    <tbody>
      {splits.map((split) => (
        <tr key={split.mile}>
          <td>
            {split.distance < 1
              ? `${split.mile - 1}–${(split.mile - 1 + split.distance).toFixed(1)}`
              : split.mile}
          </td>
          <td>{formatPace(split.pace)}</td>
          <td>{secondsToTime(split.splitTime)}</td>
          <td>{secondsToTime(split.cumulativeTime)}</td>
          <td className={split.fadeAdjustment > 0 ? 'fade-cell' : ''}>
            {split.fadeAdjustment > 0 ? `+${split.fadeAdjustment.toFixed(0)}s` : '—'}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

const ResultsDisplay = ({ projection, comparisons }) => {
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
      <Summary projection={projection} />
      <FadeRiskIndicator fadeRisk={projection.fadeRisk} />
      <PaceChart
        splits={projection.splits}
        sustainablePace={projection.sustainablePace}
        comparisons={comparisons}
      />
      {comparisons && (
        <ComparisonSummary main={projection} comparisons={comparisons} />
      )}
      <SplitTable splits={projection.splits} />
    </div>
  );
};

export default ResultsDisplay;
