import { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from 'recharts';
import { COLORS, PHI_PRIMARY, VITALITY_CRITICAL } from '../lib/constants';

export default function AlignmentHistory({ logs = [] }) {
  const chartData = useMemo(() => {
    const byCycle = {};
    logs.forEach(log => {
      const cycle = log.cycle_number || 0;
      if (!byCycle[cycle]) {
        byCycle[cycle] = { cycle, alignments: [], count: 0 };
      }
      if (log.mission_alignment !== null && log.mission_alignment !== undefined) {
        byCycle[cycle].alignments.push(parseFloat(log.mission_alignment));
        byCycle[cycle].count++;
      }
    });

    return Object.values(byCycle)
      .map(entry => ({
        cycle: entry.cycle,
        alignment: entry.alignments.length > 0
          ? entry.alignments.reduce((a, b) => a + b, 0) / entry.alignments.length
          : 0,
        count: entry.count,
      }))
      .sort((a, b) => a.cycle - b.cycle);
  }, [logs]);

  const currentAlignment = chartData.length > 0
    ? chartData[chartData.length - 1].alignment
    : 0;

  return (
    <div className="bg-anima-bg-card rounded-lg border border-anima-border p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-semibold text-anima-text-dim">Mission Alignment Over Time</h3>
        <span className="font-mono text-sm" style={{
          color: currentAlignment >= PHI_PRIMARY ? COLORS.green
            : currentAlignment >= VITALITY_CRITICAL ? COLORS.gold
            : COLORS.red
        }}>
          {(currentAlignment * 100).toFixed(1)}%
        </span>
      </div>

      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
            <XAxis
              dataKey="cycle"
              tick={{ fontSize: 10, fill: COLORS.textDim }}
              label={{ value: 'Cycle', position: 'insideBottom', offset: -5, fill: COLORS.textDim, fontSize: 10 }}
            />
            <YAxis
              domain={[0, 1]}
              tick={{ fontSize: 10, fill: COLORS.textDim }}
              tickFormatter={v => `${(v * 100).toFixed(0)}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: COLORS.bgCard,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 8,
              }}
              labelStyle={{ color: COLORS.text }}
              formatter={(v) => [`${(v * 100).toFixed(1)}%`, 'Alignment']}
              labelFormatter={(v) => `Cycle #${v}`}
            />
            {/* φ threshold line */}
            <ReferenceLine
              y={PHI_PRIMARY}
              stroke={COLORS.goldDim}
              strokeDasharray="4 4"
              label={{ value: `${String.fromCharCode(966)} ${(PHI_PRIMARY * 100).toFixed(1)}%`, fill: COLORS.goldDim, fontSize: 10, position: 'right' }}
            />
            {/* Critical threshold */}
            <ReferenceLine
              y={VITALITY_CRITICAL}
              stroke={COLORS.red}
              strokeDasharray="4 4"
              opacity={0.4}
            />
            <Line
              type="monotone"
              dataKey="alignment"
              stroke={COLORS.blue}
              strokeWidth={2}
              dot={{ fill: COLORS.blue, r: 2 }}
              activeDot={{ r: 4, fill: COLORS.blue }}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[200px] flex items-center justify-center text-anima-text-dim text-sm">
          No alignment data yet
        </div>
      )}
    </div>
  );
}
