#!/bin/sh
set -e

echo "🔄 Running database migrations..."
cd /app/lib/db
pnpm exec drizzle-kit migrate --config ./drizzle.config.ts

echo "🌱 Starting Twilight Garden Bot..."
cd /app
pnpm --filter @workspace/discord-bot run start
