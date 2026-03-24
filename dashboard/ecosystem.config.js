module.exports = {
  apps: [{
    name: 'AnimaOS',
    script: 'pnpm',
    args: 'start',
    cwd: __dirname,
    env_file: '.env',          // charge automatiquement dashboard/.env
    env: {
      NODE_ENV: 'production',
      PORT: 18789,             // port AnimaOS VPS
    },
    instances: 1,              // 1 seule instance — évite EADDRINUSE en cluster
    exec_mode: 'fork',
    max_memory_restart: '1G',
    watch: false,
  }],
}
