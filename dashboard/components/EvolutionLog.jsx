import { motion } from 'framer-motion';
import { COLORS } from '../lib/constants';

export default function EvolutionLog({ events = [] }) {
  return (
    <div className="bg-anima-bg-card rounded-lg border border-anima-border p-4">
      <h3 className="text-lg font-semibold text-anima-text mb-4">Evolution Timeline</h3>

      {events.length === 0 ? (
        <div className="text-center text-anima-text-dim py-8">
          <p>No evolution events yet.</p>
          <p className="text-sm mt-1">
            Evolution runs every {String.fromCharCode(960)}{String.fromCharCode(178)} cycles (~10 cycles).
          </p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div
            className="absolute left-4 top-0 bottom-0 w-px"
            style={{ backgroundColor: COLORS.border }}
          />

          <div className="space-y-4">
            {events.map((event, i) => {
              const triggered = event.evolution_triggered;
              const dotColor = triggered ? COLORS.gold : COLORS.blue;

              return (
                <motion.div
                  key={event.id || i}
                  className="relative pl-10"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  {/* Timeline dot */}
                  <div
                    className="absolute left-2.5 top-2 w-3 h-3 rounded-full border-2"
                    style={{
                      backgroundColor: triggered ? dotColor : 'transparent',
                      borderColor: dotColor,
                    }}
                  />

                  {/* Event card */}
                  <div className="bg-anima-bg rounded-lg border border-anima-border p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-mono text-anima-text">
                        Cycle #{event.cycle_number}
                      </span>
                      <span className="text-xs text-anima-text-dim">
                        {event.timestamp ? formatTimestamp(event.timestamp) : '—'}
                      </span>
                    </div>

                    {/* Metrics row */}
                    <div className="grid grid-cols-4 gap-3 text-xs mb-2">
                      <div>
                        <span className="text-anima-text-dim">Alignment</span>
                        <p className="font-mono text-anima-blue">
                          {((event.global_alignment || 0) * 100).toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <span className="text-anima-text-dim">Best</span>
                        <p className="font-mono text-anima-gold">
                          {(event.personal_best || 0).toFixed(3)}
                        </p>
                      </div>
                      <div>
                        <span className="text-anima-text-dim">Pruned</span>
                        <p className="font-mono" style={{
                          color: event.branches_pruned > 0 ? COLORS.red : COLORS.textDim
                        }}>
                          {event.branches_pruned || 0}
                        </p>
                      </div>
                      <div>
                        <span className="text-anima-text-dim">Spawned</span>
                        <p className="font-mono" style={{
                          color: event.branches_spawned > 0 ? COLORS.green : COLORS.textDim
                        }}>
                          {event.branches_spawned || 0}
                        </p>
                      </div>
                    </div>

                    {/* Mutation description */}
                    {event.mutation_description && (
                      <div className="mt-2 pt-2 border-t border-anima-border">
                        <p className="text-xs text-anima-text-dim">
                          {triggered ? 'Mutation: ' : 'Status: '}
                          <span className="text-anima-text">
                            {event.mutation_description}
                          </span>
                        </p>
                      </div>
                    )}

                    {/* Triggered badge */}
                    {triggered && (
                      <div className="mt-2">
                        <span className="inline-block px-2 py-0.5 text-xs font-mono rounded"
                          style={{ backgroundColor: COLORS.gold + '20', color: COLORS.gold }}>
                          EVOLUTION TRIGGERED
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function formatTimestamp(ts) {
  try {
    const d = new Date(ts);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return ts;
  }
}
