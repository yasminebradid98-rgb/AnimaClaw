module.exports = {
  apps: [{
    name: 'anima-mission-control-v1.7',
    script: 'pnpm',
    args: 'start',
    cwd: __dirname,
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
    instances: 'max',
    exec_mode: 'cluster',
    max_memory_restart: '1G',
  }],
}
