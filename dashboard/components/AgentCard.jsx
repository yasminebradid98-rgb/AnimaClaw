import { motion } from 'framer-motion';
import { getStatusColor, getVitalityColor, COLORS } from '../lib/constants';

export default function AgentCard({ agent }) {
  const name = agent.name || agent.agent_name || agent.branch_id || 'Unknown';
  const depth = agent.depth ?? agent.depth_level ?? agent.fractal_depth ?? 0;
  const phiWeight = agent.phi_weight ?? agent.phiWeight ?? 0;
  const vitality = agent.vitality_score ?? agent.vitality ?? 0;
  const status = agent.status || 'DORMANT';
  const alignment = agent.mission_alignment ?? 0;
  const role = agent.role || '';
  const lastActive = agent.last_heartbeat || agent.pi_pulse_timestamp;

  const statusColor = getStatusColor(status);
  const vitalColor = getVitalityColor(vitality);

  const barLength = 8;
  const filled = Math.round(Math.min(vitality, 1) * barLength);

  return (
    <div className="bg-anima-bg-card rounded-lg border border-anima-border p-4 hover:border-anima-gold transition-colors duration-300">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-anima-text truncate">{name}</h4>
          {role && <p className="text-xs text-anima-text-dim">{role}</p>}
        </div>
        <div className="flex items-center gap-1.5 ml-2">
          <motion.div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: statusColor }}
            animate={status === 'ALIVE' ? { opacity: [1, 0.5, 1] } : {}}
            transition={status === 'ALIVE' ? { duration: 3.14, repeat: Infinity } : {}}
          />
          <span className="text-xs font-mono" style={{ color: statusColor }}>
            {status}
          </span>
        </div>
      </div>

      {/* Vitality bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-anima-text-dim">Vitality</span>
          <span className="font-mono" style={{ color: vitalColor }}>
            {vitality.toFixed(3)}
          </span>
        </div>
        <div className="flex gap-px">
          {[...Array(barLength)].map((_, i) => (
            <motion.div
              key={i}
              className="h-1.5 rounded-sm flex-1"
              style={{
                backgroundColor: i < filled ? vitalColor : COLORS.border,
              }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
            />
          ))}
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-anima-text-dim">Depth</span>
          <p className="font-mono text-anima-text">{depth}</p>
        </div>
        <div>
          <span className="text-anima-text-dim">{String.fromCharCode(966)}-Weight</span>
          <p className="font-mono text-anima-gold">{phiWeight.toFixed(3)}</p>
        </div>
        <div>
          <span className="text-anima-text-dim">Alignment</span>
          <p className="font-mono text-anima-text">{(alignment * 100).toFixed(1)}%</p>
        </div>
        <div>
          <span className="text-anima-text-dim">Active</span>
          <p className="font-mono text-anima-text-dim text-xs">
            {lastActive ? timeAgo(lastActive) : '—'}
          </p>
        </div>
      </div>
    </div>
  );
}

function timeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
