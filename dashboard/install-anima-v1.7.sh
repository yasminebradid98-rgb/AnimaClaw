#!/bin/bash
set -e

echo "Deploying AnimaClaw Mission Control v1.7"

cd "$(dirname "$0")"

# Install dependencies
if command -v pnpm &> /dev/null; then
  pnpm install
else
  echo "pnpm not found, installing via corepack..."
  corepack enable
  corepack prepare pnpm@latest --activate
  pnpm install
fi

# Setup env if missing
if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example - edit with your credentials"
fi

# Inject AnimaClaw environment if not already present
if ! grep -q "ANIMA_CLAW_MODE" .env; then
  cat >> .env << 'EOF'

# AnimaClaw v1.7
ANIMA_CLAW_MODE=true
CLIENT_WORKSPACES_ENABLED=true
TIERED_USAGE_ENABLED=true
EOF
  echo "Injected AnimaClaw environment variables"
fi

# Build for production
pnpm build

echo ""
echo "AnimaClaw Mission Control v1.7 built successfully."
echo ""
echo "To start:"
echo "  pnpm start                              # standalone"
echo "  pm2 start ecosystem.config.js           # PM2 cluster mode"
echo ""
echo "Dashboard: http://localhost:3000"
echo "Visit /setup to create your admin account on first run."
