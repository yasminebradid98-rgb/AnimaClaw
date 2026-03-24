module.exports = {
  apps: [{
    name: 'AnimaOS',
    script: 'node_modules/.bin/next',
    args: 'start --hostname 0.0.0.0',
    cwd: __dirname,
    env_file: '.env',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
    instances: 1,
    exec_mode: 'fork',
    max_memory_restart: '1G',
    watch: false,
  }],
}
