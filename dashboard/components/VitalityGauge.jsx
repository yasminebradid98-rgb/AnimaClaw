import { motion } from 'framer-motion';
import { getVitalityColor, COLORS } from '../lib/constants';

export default function VitalityGauge({ score = 0, state = 'DORMANT' }) {
  const normalizedScore = Math.min(Math.max(score, 0), 1.5);
  const percentage = Math.min(normalizedScore, 1) * 100;
  const circumference = 2 * Math.PI * 70;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  const color = getVitalityColor(score);

  return (
    <div className="bg-anima-bg-card rounded-lg border border-anima-border p-6 flex flex-col items-center">
      <h3 className="text-sm font-semibold text-anima-text-dim mb-4">System Vitality</h3>

      <div className="relative" style={{ width: 160, height: 160 }}>
        <svg width="160" height="160" className="transform -rotate-90">
          {/* Background ring */}
          <circle
            cx="80"
            cy="80"
            r="70"
            fill="none"
            stroke={COLORS.border}
            strokeWidth="8"
          />
          {/* Vitality ring */}
          <motion.circle
            cx="80"
            cy="80"
            r="70"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.618, ease: 'easeOut' }}
          />
          {/* 0.618 threshold marker */}
          <circle
            cx="80"
            cy="80"
            r="70"
            fill="none"
            stroke={COLORS.goldDim}
            strokeWidth="1"
            strokeDasharray={`2 ${circumference - 2}`}
            strokeDashoffset={circumference - (0.618 * circumference)}
            opacity={0.5}
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-3xl font-mono font-bold"
            style={{ color }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.618 }}
          >
            {score.toFixed(3)}
          </motion.span>
          <span
            className="text-xs font-mono mt-1"
            style={{ color: getStatusColorForState(state) }}
          >
            {state}
          </span>
        </div>
      </div>

      {/* Threshold legend */}
      <div className="flex gap-4 mt-4 text-xs font-mono">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.green }} />
          &gt;0.618
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.gold }} />
          0.382
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.red }} />
          &lt;0.382
        </span>
      </div>
    </div>
  );
}

function getStatusColorForState(state) {
  switch (state) {
    case 'ALIVE': return COLORS.green;
    case 'HEALING': return COLORS.gold;
    case 'EVOLVING': return COLORS.blue;
    default: return COLORS.textDim;
  }
}
