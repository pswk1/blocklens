import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { formatPace } from '../utils/calculations.js';

const COLORS = {
  main: '#fc4c02',
  aggressive: '#f85149',
  conservative: '#3fb950',
};

const CustomTooltip = ({ active, payload, label, compareMode }) => {
  if (!active || !payload || !payload.length) {
    return null;
  }

  return (
    <div className="chart-tooltip">
      <div className="tooltip-title">Mile {label}</div>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="tooltip-row">
          <span style={{ color: entry.color }}>
            {compareMode ? entry.name : 'Pace'}:
          </span>
          <span>{formatPace(entry.value)}/mi</span>
        </div>
      ))}
    </div>
  );
};

const PaceChart = ({ splits, sustainablePace, comparisons }) => {
  const compareMode = !!comparisons;

  // Build chart data with all scenarios
  const chartData = splits.map((split, i) => {
    const data = {
      mile: split.mile,
      pace: split.pace,
    };

    if (comparisons) {
      data.aggressive = comparisons.aggressive.splits[i]?.pace;
      data.conservative = comparisons.conservative.splits[i]?.pace;
    }

    return data;
  });

  // Calculate Y-axis domain across all scenarios
  const allPaces = [
    ...splits.map((s) => s.pace),
    sustainablePace,
  ];

  if (comparisons) {
    allPaces.push(...comparisons.aggressive.splits.map((s) => s.pace));
    allPaces.push(...comparisons.conservative.splits.map((s) => s.pace));
  }

  const minPace = Math.min(...allPaces);
  const maxPace = Math.max(...allPaces);
  const padding = (maxPace - minPace) * 0.2 || 15;
  const yMin = Math.floor((minPace - padding) / 5) * 5;
  const yMax = Math.ceil((maxPace + padding) / 5) * 5;

  const formatYAxis = (value) => formatPace(value);

  return (
    <div className="pace-chart">
      <h3>Pace Over Distance</h3>
      <ResponsiveContainer width="100%" height={compareMode ? 240 : 200}>
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
          <XAxis
            dataKey="mile"
            tick={{ fill: '#8b949e', fontSize: 12 }}
            axisLine={{ stroke: '#30363d' }}
            tickLine={{ stroke: '#30363d' }}
          />
          <YAxis
            domain={[yMin, yMax]}
            tickFormatter={formatYAxis}
            tick={{ fill: '#8b949e', fontSize: 12 }}
            axisLine={{ stroke: '#30363d' }}
            tickLine={{ stroke: '#30363d' }}
            width={50}
            reversed
          />
          <Tooltip content={<CustomTooltip compareMode={compareMode} />} />
          <ReferenceLine
            y={sustainablePace}
            stroke="#58a6ff"
            strokeDasharray="5 5"
            strokeWidth={1.5}
            label={{
              value: 'Sustainable',
              position: 'right',
              fill: '#58a6ff',
              fontSize: 11,
            }}
          />

          {/* Comparison lines (rendered first so main line is on top) */}
          {compareMode && (
            <>
              <Line
                type="monotone"
                dataKey="aggressive"
                name="Aggressive (−10s)"
                stroke={COLORS.aggressive}
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="conservative"
                name="Conservative (+10s)"
                stroke={COLORS.conservative}
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
              />
            </>
          )}

          {/* Main line */}
          <Line
            type="monotone"
            dataKey="pace"
            name="Current"
            stroke={COLORS.main}
            strokeWidth={3}
            dot={{
              fill: '#1c2128',
              stroke: COLORS.main,
              strokeWidth: 2,
              r: 4,
            }}
            activeDot={{
              fill: COLORS.main,
              stroke: '#fff',
              strokeWidth: 2,
              r: 6,
            }}
          />

          {compareMode && (
            <Legend
              wrapperStyle={{ paddingTop: '10px' }}
              iconType="line"
              formatter={(value) => <span style={{ color: '#8b949e', fontSize: '12px' }}>{value}</span>}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PaceChart;
