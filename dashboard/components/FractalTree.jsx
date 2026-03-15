import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { getStatusColor, getVitalityColor, COLORS } from '../lib/constants';

export default function FractalTree({ agents = [] }) {
  const canvasRef = useRef(null);
  const [selectedAgent, setSelectedAgent] = useState(null);

  // Build tree structure from flat agent list
  const tree = buildTree(agents);

  return (
    <div className="bg-anima-bg-card rounded-lg border border-anima-border p-6">
      <h3 className="text-lg font-semibold text-anima-text mb-4">Fractal Agent Tree</h3>

      {agents.length === 0 ? (
        <div className="text-center text-anima-text-dim py-12">
          <p>No agents registered yet.</p>
          <p className="text-sm mt-1">Run SOLARIS.md to boot the organism.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            <TreeNode
              node={tree}
              onSelect={setSelectedAgent}
              selected={selectedAgent}
              depth={0}
            />
          </div>
        </div>
      )}

      {/* Selected agent detail */}
      {selectedAgent && (
        <motion.div
          className="mt-4 p-4 bg-anima-bg rounded-lg border border-anima-border"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
        >
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-semibold text-anima-text">{selectedAgent.name}</h4>
              <p className="text-xs text-anima-text-dim mt-1">{selectedAgent.role || 'Agent'}</p>
            </div>
            <button
              onClick={() => setSelectedAgent(null)}
              className="text-anima-text-dim hover:text-anima-text text-sm"
            >
              Close
            </button>
          </div>
          <div className="grid grid-cols-4 gap-4 mt-3 text-xs">
            <div>
              <span className="text-anima-text-dim">Depth</span>
              <p className="font-mono text-anima-text">{selectedAgent.depth ?? 0}</p>
            </div>
            <div>
              <span className="text-anima-text-dim">{String.fromCharCode(966)}-Weight</span>
              <p className="font-mono text-anima-gold">
                {(selectedAgent.phi_weight ?? 0).toFixed(3)}
              </p>
            </div>
            <div>
              <span className="text-anima-text-dim">Vitality</span>
              <p className="font-mono" style={{ color: getVitalityColor(selectedAgent.vitality_score ?? 0) }}>
                {(selectedAgent.vitality_score ?? 0).toFixed(3)}
              </p>
            </div>
            <div>
              <span className="text-anima-text-dim">Status</span>
              <p className="font-mono" style={{ color: getStatusColor(selectedAgent.status || 'DORMANT') }}>
                {selectedAgent.status || 'DORMANT'}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function TreeNode({ node, onSelect, selected, depth }) {
  if (!node) return null;

  const statusColor = getStatusColor(node.status || 'DORMANT');
  const vitalColor = getVitalityColor(node.vitality_score ?? 0);
  const isSelected = selected && selected.name === node.name;
  const indent = depth * 48;

  return (
    <div>
      <motion.div
        className={`flex items-center gap-3 py-2 px-3 rounded cursor-pointer transition-colors ${
          isSelected ? 'bg-anima-bg-light border border-anima-gold' : 'hover:bg-anima-bg-light'
        }`}
        style={{ marginLeft: indent }}
        onClick={() => onSelect(node)}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: depth * 0.1 }}
      >
        {/* Connector line */}
        {depth > 0 && (
          <div className="flex items-center" style={{ width: 20 }}>
            <div className="w-4 h-px" style={{ backgroundColor: COLORS.border }} />
          </div>
        )}

        {/* Status dot */}
        <motion.div
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: statusColor }}
          animate={node.status === 'ALIVE' ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 3.14, repeat: Infinity }}
        />

        {/* Name */}
        <span className="font-mono text-sm text-anima-text flex-1 truncate">
          {node.name || node.branch_id}
        </span>

        {/* Depth badge */}
        <span className="text-xs font-mono text-anima-text-dim">
          d{node.depth ?? node.depth_level ?? 0}
        </span>

        {/* Phi weight */}
        <span className="text-xs font-mono text-anima-gold">
          {String.fromCharCode(966)}{(node.phi_weight ?? 0).toFixed(3)}
        </span>

        {/* Vitality mini bar */}
        <div className="flex gap-px w-12">
          {[...Array(6)].map((_, i) => {
            const v = node.vitality_score ?? 0;
            const filled = i < Math.round(Math.min(v, 1) * 6);
            return (
              <div
                key={i}
                className="h-2 flex-1 rounded-sm"
                style={{ backgroundColor: filled ? vitalColor : COLORS.border }}
              />
            );
          })}
        </div>
      </motion.div>

      {/* Children */}
      {node.children && node.children.map((child, i) => (
        <TreeNode
          key={child.name || child.branch_id || i}
          node={child}
          onSelect={onSelect}
          selected={selected}
          depth={depth + 1}
        />
      ))}
    </div>
  );
}

function buildTree(agents) {
  if (!agents || agents.length === 0) return null;

  const agentMap = {};
  const roots = [];

  // Index by name/branch_id
  for (const agent of agents) {
    const key = agent.name || agent.branch_id;
    agentMap[key] = { ...agent, children: [] };
  }

  // Build parent-child relationships
  for (const agent of agents) {
    const key = agent.name || agent.branch_id;
    const parentKey = agent.parent || agent.parent_branch;

    if (parentKey && agentMap[parentKey]) {
      agentMap[parentKey].children.push(agentMap[key]);
    } else {
      roots.push(agentMap[key]);
    }
  }

  // Return first root (should be ROOT_ORCHESTRATOR)
  return roots[0] || null;
}
