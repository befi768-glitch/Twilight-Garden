#!/bin/sh
set -e

echo "🔄 Running database migrations..."
cd /app
pnpm --filter @workspace/db run migrate

echo "🌱 Starting Twilight Garden Bot..."
pnpm --filter @workspace/discord-bot run start
