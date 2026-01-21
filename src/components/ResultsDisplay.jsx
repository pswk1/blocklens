import { secondsToTime, formatPace } from '../utils/calculations.js';

function Summary({ projection, goalTimeSeconds }) {
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
}

function FadeRiskIndicator({ fadeRisk }) {
  return (
    <div className={`risk-indicator ${fadeRisk.level}`}>
      <div className="level">Fade Risk: {fadeRisk.level.replace('-', ' ')}</div>
      <div className="message">{fadeRisk.message}</div>
    </div>
  );
}

function SplitTable({ splits }) {
  return (
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
}

export default function ResultsDisplay({ projection, goalTimeSeconds }) {
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
      <Summary projection={projection} goalTimeSeconds={goalTimeSeconds} />
      <FadeRiskIndicator fadeRisk={projection.fadeRisk} />
      <SplitTable splits={projection.splits} />
    </div>
  );
}
