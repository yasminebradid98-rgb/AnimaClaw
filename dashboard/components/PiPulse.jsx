import { motion } from 'framer-motion';
import { COLORS } from '../lib/constants';

export default function PiPulse({ state = 'DORMANT' }) {
  const isAlive = state === 'ALIVE' || state === 'HEALING' || state === 'EVOLVING';
  const color = state === 'ALIVE' ? COLORS.green
    : state === 'HEALING' ? COLORS.gold
    : state === 'EVOLVING' ? COLORS.blue
    : COLORS.textDim;

  return (
    <div className="flex items-center gap-3 bg-anima-bg-card rounded-lg border border-anima-border px-4 py-2">
      {/* Animated pulse dot */}
      <div className="relative">
        <motion.div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: color }}
          animate={isAlive ? {
            scale: [1, 1.4, 1],
            opacity: [1, 0.6, 1],
          } : {}}
          transition={isAlive ? {
            duration: 3.1415926535,
            repeat: Infinity,
            ease: 'easeInOut',
          } : {}}
        />
        {isAlive && (
          <motion.div
            className="absolute inset-0 w-3 h-3 rounded-full"
            style={{ backgroundColor: color }}
            animate={{
              scale: [1, 2.5],
              opacity: [0.5, 0],
            }}
            transition={{
              duration: 3.1415926535,
              repeat: Infinity,
              ease: 'easeOut',
            }}
          />
        )}
      </div>

      {/* Wave animation */}
      <div className="flex items-end gap-px h-4">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="w-0.5 rounded-full"
            style={{ backgroundColor: color }}
            animate={isAlive ? {
              height: [2, 8 + Math.sin(i * 0.5) * 8, 2],
            } : { height: 2 }}
            transition={isAlive ? {
              duration: 3.1415926535,
              repeat: Infinity,
              delay: i * 0.15,
              ease: 'easeInOut',
            } : {}}
          />
        ))}
      </div>

      {/* Label */}
      <span className="text-xs font-mono" style={{ color }}>
        {isAlive ? `${String.fromCharCode(960)} ${(3.14).toFixed(2)}s` : 'OFFLINE'}
      </span>
    </div>
  );
}
