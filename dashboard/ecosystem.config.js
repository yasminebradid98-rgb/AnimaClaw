module.exports = {
  apps: [{
    name: 'AnimaOS',
    // standalone mode: use node server.js directly (next start incompatible with output:standalone)
    script: 'node',
    args: '.next/standalone/server.js',
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
