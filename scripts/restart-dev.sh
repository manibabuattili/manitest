#!/usr/bin/env bash
set -euo pipefail

export PATH="${PATH:-}"
cd "$(dirname "$0")/.."

echo "==> Stopping anything already on port 3002..."
if command -v fuser >/dev/null 2>&1; then
  fuser -k 3002/tcp 2>/dev/null || true
fi
pkill -f "node_modules/.bin/next" 2>/dev/null || true
pkill -f "next-server" 2>/dev/null || true
sleep 1

if [ ! -f .env ]; then
  cp .env.example .env
  echo "==> Created .env from .env.example"
fi

if [ ! -d node_modules ]; then
  echo "==> Installing dependencies..."
  npm install
fi

if [ ! -f prisma/dev.db ]; then
  echo "==> Setting up SQLite database..."
  npm run db:setup
fi

echo "==> Starting Bluconn on http://localhost:3002"
echo "    Keep this terminal open. Press Ctrl+C to stop."
exec npx next dev --turbopack -H 0.0.0.0 -p 3002
