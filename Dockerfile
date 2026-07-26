FROM node:22-alpine

# Install pnpm
RUN npm install -g pnpm@10

WORKDIR /app

# Copy workspace config first
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# Copy all package.json files for workspace packages
COPY lib/db/package.json ./lib/db/
COPY lib/api-client-react/package.json ./lib/api-client-react/
COPY lib/api-zod/package.json ./lib/api-zod/
COPY lib/api-spec/package.json ./lib/api-spec/
COPY scripts/package.json ./scripts/
COPY artifacts/discord-bot/package.json ./artifacts/discord-bot/

# Install only discord-bot and its dependencies
RUN pnpm install --frozen-lockfile --filter @workspace/discord-bot...

# Copy all source files
COPY . .

# Build lib declarations (needed for @workspace/db types)
RUN pnpm run typecheck:libs

# Run the bot
CMD ["pnpm", "--filter", "@workspace/discord-bot", "run", "start"]
