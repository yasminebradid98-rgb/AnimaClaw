module.exports = {
  apps: [{
    name: 'AnimaOS',
    script: 'node',
    args: '.next/standalone/dashboard/server.js',
    cwd: __dirname,
    env_file: '.env',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      HOSTNAME: '0.0.0.0',
    },
    instances: 1,
    exec_mode: 'fork',
    max_memory_restart: '1G',
    watch: false,
  }],
}
