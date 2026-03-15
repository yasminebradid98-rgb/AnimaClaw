import { motion } from 'framer-motion';
import { COLORS } from '../lib/constants';

const COLUMNS = [
  { key: 'todo', label: 'To Do', color: COLORS.blue },
  { key: 'doing', label: 'In Progress', color: COLORS.gold },
  { key: 'done', label: 'Done', color: COLORS.green },
];

export default function TaskKanban({ tasks = [] }) {
  const grouped = {
    todo: tasks.filter(t => t.status === 'todo'),
    doing: tasks.filter(t => t.status === 'doing'),
    done: tasks.filter(t => t.status === 'done'),
  };

  return (
    <div className="bg-anima-bg-card rounded-lg border border-anima-border p-4">
      <h3 className="text-lg font-semibold text-anima-text mb-4">Task Board</h3>

      <div className="grid grid-cols-3 gap-4">
        {COLUMNS.map(col => (
          <div key={col.key}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: col.color }} />
              <span className="text-sm font-semibold text-anima-text">{col.label}</span>
              <span className="text-xs font-mono text-anima-text-dim ml-auto">
                {grouped[col.key].length}
              </span>
            </div>

            <div className="space-y-2 min-h-[100px]">
              {grouped[col.key].length === 0 ? (
                <div className="text-xs text-anima-text-dim text-center py-4 border border-dashed border-anima-border rounded">
                  No tasks
                </div>
              ) : (
                grouped[col.key].map((task, i) => (
                  <motion.div
                    key={task.id || i}
                    className="bg-anima-bg rounded p-3 border border-anima-border hover:border-anima-gold transition-colors"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <p className="text-sm text-anima-text">{task.description || task.title}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs font-mono text-anima-text-dim">
                        {task.agent_name || 'Unassigned'}
                      </span>
                      {task.mission_alignment !== undefined && (
                        <span className="text-xs font-mono text-anima-gold">
                          {(task.mission_alignment * 100).toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
