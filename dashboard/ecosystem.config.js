module.exports = {
  apps: [{
    name: 'AnimaOS',
    // Utilise next directement — bypass pnpm + verify:node
    script: 'node_modules/.bin/next',
    args: 'start --hostname 0.0.0.0',
    cwd: __dirname,
    env_file: '.env',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,        // Dashboard UI — 18789 est réservé au gateway OpenClaw
    },
    instances: 1,
    exec_mode: 'fork',
    max_memory_restart: '1G',
    watch: false,
  }],
}
