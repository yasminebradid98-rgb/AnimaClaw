module.exports = {
  apps: [{
    name: 'AnimaOS',
    // Standalone server — bypass pnpm/verify:node, port configurable via env
    script: '.next/standalone/server.js',
    cwd: __dirname,
    env_file: '.env',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,        // Dashboard UI — 18789 est réservé au gateway OpenClaw
      HOSTNAME: '0.0.0.0',
    },
    instances: 1,
    exec_mode: 'fork',
    max_memory_restart: '1G',
    watch: false,
  }],
}
