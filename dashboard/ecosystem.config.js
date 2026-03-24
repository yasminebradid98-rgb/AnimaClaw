const path = require('path')
const fs = require('fs')

function parseEnvFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    const env = {}
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const idx = trimmed.indexOf('=')
      if (idx < 0) continue
      const key = trimmed.slice(0, idx).trim()
      let val = trimmed.slice(idx + 1).trim()
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1)
      }
      env[key] = val
    }
    return env
  } catch (e) {
    return {}
  }
}

const extraEnv = parseEnvFile(path.join(__dirname, '.env'))

module.exports = {
  apps: [{
    name: 'AnimaOS',
    script: 'node',
    args: '.next/standalone/dashboard/server.js',
    cwd: __dirname,
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      HOSTNAME: '0.0.0.0',
      ...extraEnv,
    },
    instances: 1,
    exec_mode: 'fork',
    max_memory_restart: '1G',
    watch: false,
  }],
}
