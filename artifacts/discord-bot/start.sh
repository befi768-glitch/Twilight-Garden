#!/bin/sh
set -e

echo "🔄 Pushing database schema..."
cd /app
yes | pnpm --filter @workspace/db run push || true

echo "🌱 Starting Twilight Garden Bot..."
pnpm --filter @workspace/discord-bot run start
