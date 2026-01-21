import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { formatPace } from '../utils/calculations.js';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const data = payload[0].payload;

  return (
    <div className="chart-tooltip">
      <div className="tooltip-title">Mile {label}</div>
      <div className="tooltip-row">
        <span>Pace:</span>
        <span>{formatPace(data.pace)}/mi</span>
      </div>
      {data.fadeAdjustment > 0 && (
        <div className="tooltip-row fade">
          <span>Fade:</span>
          <span>+{data.fadeAdjustment.toFixed(0)}s</span>
        </div>
      )}
    </div>
  );
};

const PaceChart = ({ splits, sustainablePace }) => {
  const chartData = splits.map((split) => ({
    mile: split.mile,
    pace: split.pace,
    paceFormatted: formatPace(split.pace),
    fadeAdjustment: split.fadeAdjustment,
  }));

  // Calculate Y-axis domain with padding
  const paces = splits.map((s) => s.pace);
  const minPace = Math.min(...paces, sustainablePace);
  const maxPace = Math.max(...paces, sustainablePace);
  const padding = (maxPace - minPace) * 0.2 || 15;
  const yMin = Math.floor((minPace - padding) / 5) * 5;
  const yMax = Math.ceil((maxPace + padding) / 5) * 5;

  const formatYAxis = (value) => formatPace(value);

  return (
    <div className="pace-chart">
      <h3>Pace Over Distance</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="paceGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#3fb950" />
              <stop offset="50%" stopColor="#f9a826" />
              <stop offset="100%" stopColor="#fc4c02" />
            </linearGradient>
          </defs>
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
          <Tooltip content={<CustomTooltip />} />
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
          <Line
            type="monotone"
            dataKey="pace"
            stroke="url(#paceGradient)"
            strokeWidth={3}
            dot={{
              fill: '#1c2128',
              stroke: '#fc4c02',
              strokeWidth: 2,
              r: 4,
            }}
            activeDot={{
              fill: '#fc4c02',
              stroke: '#fff',
              strokeWidth: 2,
              r: 6,
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PaceChart;
