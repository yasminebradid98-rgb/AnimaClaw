/**
 * PM2 Ecosystem Configuration
 * ANIMA OS v1.5.0
 * 
 * Usage:
 *   pm2 start ecosystem.config.js
 *   pm2 save
 *   pm2 startup
 */

module.exports = {
  apps: [
    {
      name: 'AnimaPulse',
      script: './setup/pi_pulse_daemon.js',
      args: 'start',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        ANIMA_ENV: 'production',
      },
      log_file: './logs/pulse.log',
      error_file: './logs/pulse-error.log',
      out_file: './logs/pulse-out.log',
      time: true,
      kill_timeout: 5000,
    },
    {
      name: 'AnimaExecutor',
      script: './runtime/executor.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        ANIMA_ENV: 'production',
        ANIMA_EXECUTOR_INTERVAL: '1000',
      },
      log_file: './logs/executor.log',
      error_file: './logs/executor-error.log',
      out_file: './logs/executor-out.log',
      time: true,
      kill_timeout: 30000,
    },
  ],
};
