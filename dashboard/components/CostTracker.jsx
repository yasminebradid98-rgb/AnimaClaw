import { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { COLORS } from '../lib/constants';

const CHART_COLORS = [
  COLORS.gold, COLORS.blue, COLORS.green,
  '#c97bc9', '#7bc9c9', COLORS.red
];

export default function CostTracker({ costs = [], period = 'daily' }) {
  const [view, setView] = useState(period);

  const byAgent = useMemo(() => {
    const map = {};
    costs.forEach(c => {
      const name = c.agent_name || 'Unknown';
      if (!map[name]) map[name] = { agent: name, cost: 0, tokens: 0, tasks: 0 };
      map[name].cost += parseFloat(c.cost_usd || 0);
      map[name].tokens += (c.tokens_input || 0) + (c.tokens_output || 0);
      map[name].tasks += 1;
    });
    return Object.values(map).sort((a, b) => b.cost - a.cost);
  }, [costs]);

  const byModel = useMemo(() => {
    const map = {};
    costs.forEach(c => {
      const model = c.model || 'unknown';
      if (!map[model]) map[model] = { model, cost: 0, count: 0 };
      map[model].cost += parseFloat(c.cost_usd || 0);
      map[model].count += 1;
    });
    return Object.values(map).sort((a, b) => b.cost - a.cost);
  }, [costs]);

  const byDate = useMemo(() => {
    const map = {};
    costs.forEach(c => {
      const date = c.date || 'unknown';
      if (!map[date]) map[date] = { date, cost: 0 };
      map[date].cost += parseFloat(c.cost_usd || 0);
    });
    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  }, [costs]);

  const totalCost = costs.reduce((s, c) => s + parseFloat(c.cost_usd || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-anima-text">Cost Analytics</h2>
          <p className="text-sm text-anima-text-dim">
            Total: <span className="font-mono text-anima-gold">${totalCost.toFixed(4)}</span>
          </p>
        </div>
        <div className="flex gap-1 bg-anima-bg-card rounded-lg p-1 border border-anima-border">
          {['daily', 'weekly', 'monthly'].map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1 text-xs font-mono rounded transition-colors ${
                view === v
                  ? 'bg-anima-gold text-anima-bg'
                  : 'text-anima-text-dim hover:text-anima-text'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-6" style={{ flexDirection: 'row' }}>
        {/* Bar chart: cost per agent */}
        <div className="bg-anima-bg-card rounded-lg border border-anima-border p-4" style={{ width: '61.8%' }}>
          <h3 className="text-sm font-semibold text-anima-text-dim mb-3">Cost by Agent</h3>
          {byAgent.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={byAgent}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
                <XAxis dataKey="agent" tick={{ fontSize: 10, fill: COLORS.textDim }} angle={-20} />
                <YAxis tick={{ fontSize: 10, fill: COLORS.textDim }} tickFormatter={v => `$${v.toFixed(3)}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 8 }}
                  labelStyle={{ color: COLORS.text }}
                  itemStyle={{ color: COLORS.gold }}
                  formatter={v => `$${v.toFixed(4)}`}
                />
                <Bar dataKey="cost" radius={[4, 4, 0, 0]}>
                  {byAgent.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-anima-text-dim text-sm">
              No cost data yet
            </div>
          )}
        </div>

        {/* Pie chart: cost by model */}
        <div className="bg-anima-bg-card rounded-lg border border-anima-border p-4" style={{ width: '38.2%' }}>
          <h3 className="text-sm font-semibold text-anima-text-dim mb-3">Cost by Model</h3>
          {byModel.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={byModel}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  dataKey="cost"
                  nameKey="model"
                  label={({ model, percent }) => `${model} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {byModel.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 8 }}
                  formatter={v => `$${v.toFixed(4)}`}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-anima-text-dim text-sm">
              No model data
            </div>
          )}
        </div>
      </div>

      {/* Line chart: cost over time */}
      <div className="bg-anima-bg-card rounded-lg border border-anima-border p-4">
        <h3 className="text-sm font-semibold text-anima-text-dim mb-3">Cost Over Time</h3>
        {byDate.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={byDate}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: COLORS.textDim }} />
              <YAxis tick={{ fontSize: 10, fill: COLORS.textDim }} tickFormatter={v => `$${v.toFixed(2)}`} />
              <Tooltip
                contentStyle={{ backgroundColor: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 8 }}
                formatter={v => `$${v.toFixed(4)}`}
              />
              <Line
                type="monotone"
                dataKey="cost"
                stroke={COLORS.gold}
                strokeWidth={2}
                dot={{ fill: COLORS.gold, r: 3 }}
                activeDot={{ r: 5, fill: COLORS.gold }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-anima-text-dim text-sm">
            No timeline data
          </div>
        )}
      </div>
    </div>
  );
}
