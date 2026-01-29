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
import { formatPaceWithUnit, paceToKm, milesToKm } from '../utils/calculations';
import type { Split, ComparableProjections, UnitPreference } from '../types';

const COLORS = {
  main: '#fc4c02',
  aggressive: '#f85149',
  conservative: '#3fb950',
} as const;

interface TooltipPayloadItem {
  dataKey: string;
  value: number;
  name: string;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: number;
  compareMode: boolean;
  unit: UnitPreference;
}

const CustomTooltip = ({ active, payload, label, compareMode, unit }: CustomTooltipProps) => {
  if (!active || !payload || !payload.length || label === undefined) {
    return null;
  }

  const distanceLabel = unit === 'km'
    ? `${milesToKm(label).toFixed(1)} km`
    : `Mile ${label}`;

  return (
    <div className="chart-tooltip">
      <div className="tooltip-title">{distanceLabel}</div>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="tooltip-row">
          <span style={{ color: entry.color }}>
            {compareMode ? entry.name : 'Pace'}:
          </span>
          <span>{formatPaceWithUnit(entry.value, unit)}</span>
        </div>
      ))}
    </div>
  );
};

interface ChartDataPoint {
  mile: number;
  pace: number;
  aggressive?: number;
  conservative?: number;
}

interface PaceChartProps {
  splits: Split[];
  sustainablePace: number;
  comparisons: ComparableProjections | null;
  unit?: UnitPreference;
}

const PaceChart = ({ splits, sustainablePace, comparisons, unit = 'miles' }: PaceChartProps) => {
  const compareMode = !!comparisons;
  const unitLabel = unit === 'km' ? 'km' : 'mi';
  const offsetLabel = unit === 'km' ? '6s' : '10s';

  // Build chart data with all scenarios
  const chartData: ChartDataPoint[] = splits.map((split, i) => {
    const data: ChartDataPoint = {
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
  const allPaces: number[] = [
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

  // Format Y-axis based on unit
  const formatYAxis = (value: number): string => {
    const pace = unit === 'km' ? paceToKm(value) : value;
    const minutes = Math.floor(pace / 60);
    const seconds = Math.round(pace % 60);
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  };

  // Format X-axis based on unit
  const formatXAxis = (mile: number): string => {
    if (unit === 'km') {
      return milesToKm(mile).toFixed(1);
    }
    return String(mile);
  };

  // Generate accessible chart description
  const firstPace = splits[0]?.pace;
  const lastPace = splits[splits.length - 1]?.pace;
  const chartDescription = firstPace && lastPace
    ? `Pace projection chart showing pace changing from ${formatPaceWithUnit(firstPace, unit)} at the start to ${formatPaceWithUnit(lastPace, unit)} at the finish. Sustainable pace is ${formatPaceWithUnit(sustainablePace, unit)}.`
    : 'Pace projection chart showing pace over distance.';

  return (
    <figure className="pace-chart" role="figure" aria-label="Pace projection chart">
      <h3>Pace Over Distance</h3>
      <figcaption className="visually-hidden">{chartDescription}</figcaption>
      <ResponsiveContainer width="100%" height={compareMode ? 240 : 200}>
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
          <XAxis
            dataKey="mile"
            tickFormatter={formatXAxis}
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
          <Tooltip content={<CustomTooltip compareMode={compareMode} unit={unit} />} />
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
                name={`Aggressive (−${offsetLabel}/${unitLabel})`}
                stroke={COLORS.aggressive}
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="conservative"
                name={`Conservative (+${offsetLabel}/${unitLabel})`}
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
              formatter={(value: string) => <span style={{ color: '#8b949e', fontSize: '12px' }}>{value}</span>}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </figure>
  );
};

export default PaceChart;
