#!/usr/bin/env bash
set -euo pipefail

export PATH="/home/ubuntu/.nvm/versions/node/v22.22.2/bin:${PATH}"
cd /workspace

echo "==> Stopping anything already on port 3002..."
if command -v fuser >/dev/null 2>&1; then
  fuser -k 3002/tcp 2>/dev/null || true
fi
# Kill only next-server / next CLI processes (avoid broad pkill patterns)
pkill -f "node_modules/.bin/next" 2>/dev/null || true
pkill -f "next-server" 2>/dev/null || true
sleep 1

echo "==> Ensuring PostgreSQL is running..."
sudo pg_ctlcluster 16 main start 2>/dev/null || true
if ! pg_isready >/dev/null 2>&1; then
  echo "Postgres is not ready. Start it first, then re-run this script."
  exit 1
fi

if [ ! -f .env ]; then
  echo 'DATABASE_URL="postgresql://bluconn:bluconn@localhost:5432/bluconn?schema=public"' > .env
  echo "==> Created .env"
fi

if [ ! -d node_modules ]; then
  echo "==> Installing dependencies..."
  npm install
  npm run db:setup
fi

echo "==> Starting Bluconn on http://localhost:3002"
echo "    Keep this terminal open. Press Ctrl+C to stop."
exec npx next dev --turbopack -H 0.0.0.0 -p 3002
