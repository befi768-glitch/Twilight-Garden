#!/bin/sh
set -e

echo "🔄 Pushing database schema..."
cd /app
pnpm --filter @workspace/db run push-force

echo "🌱 Starting Twilight Garden Bot..."
pnpm --filter @workspace/discord-bot run start
