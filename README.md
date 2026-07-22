# 🌙 Twilight Garden — Discord Bot

A rich Discord RPG bot where players tend a magical garden, explore a twilight world, adopt pets, complete quests, meet NPCs, and discover rare wildlife.

## Features

| System | Commands | Description |
|--------|----------|-------------|
| 🌿 Garden | `/garden` | Plant, water, fertilize, harvest crops. Mutations possible! |
| 💰 Economy | `/economy` | Shop, sell, auction house, player trading |
| 🎒 Inventory | `/inventory` | Manage items, use consumables |
| 🗺️ Exploration | `/explore` | Travel to 8 unique areas, random events |
| 🐾 Pets | `/pet` | Adopt, feed, play, heal, rename companions |
| 📜 Quests | `/quest` | Daily, side, and main quests with rewards |
| 👤 NPC | `/npc` | Talk, gift, and build relationships with NPCs |
| 🐺 Wildlife | `/wildlife` | Encounter, discover, and tame wild creatures |
| 🏆 Achievements | `/achievements` | Unlock achievements (including secret ones!) |
| 🏡 Home | `/home` | Upgrade and customize your home |
| 📓 Journal | `/journal` | Log all your discoveries |
| 📰 News | `/news` | World news and offline summaries |
| 🌍 World Events | `/event` | Random server-wide events with shared rewards |
| 🤝 Social | `/social` | Gift items/coins, visit homes |
| 🏅 Leaderboard | `/leaderboard` | Richest, highest level, best reputation |
| 🌙 World | `/world` | Current weather, season, time of day |
| ⚙️ Admin | `/admin` | Server setup and management |

## Setup

### Requirements
- Node.js 18+
- PostgreSQL database
- Discord bot application

### Install

```bash
npm install
```

### Configure

Copy `.env.example` to `.env` and fill in:

```env
DISCORD_TOKEN=your_bot_token
DISCORD_CLIENT_ID=your_client_id
DATABASE_URL=postgresql://user:password@localhost:5432/twilight_garden
GUILD_ID=your_guild_id  # optional: for dev (instant command registration)
```

### Run migrations

```bash
npm run migrate
```

Or use Drizzle Kit:

```bash
npx drizzle-kit push:pg
```

### Start

```bash
npm run dev    # development with hot reload
npm start      # production
```

## Game Mechanics

### Plants
8 plant types from common Sunpetals to legendary Shadowblooms. Plants have growth stages, water/fertilizer mechanics, and can mutate into Golden, Giant, Twin, or Glowing variants worth far more.

### Seasons & Weather
4 seasons (spring, summer, autumn, winter) cycle every 30 days. 7 weather types affect plant growth, wildlife spawns, and exploration events. Special **Magical** weather boosts all rewards by 50%.

### Energy System
Players have energy (max 100) that regenerates over time. Exploration costs energy.

### NPC Relationships
Build relationships with 4 unique NPCs from Stranger → Acquaintance → Friend → Close Friend → Beloved. Higher relationship unlocks special dialogues and trades.

### Wildlife
8 creatures with different habitats, active times, seasons, and weather preferences. Tame them with the right items!

### World Events
Random server-wide events (Harvest Festival, Moonstone Shower, Great Storm, etc.) where all participants share rewards.

## Architecture

```
src/
├── client.ts          # Discord client setup
├── index.ts           # Entry point + event handlers
├── commands/          # Slash command handlers (1 per feature)
├── services/          # Business logic layer
├── systems/           # Game loop systems (tick, weather, seasons)
├── database/          # Drizzle ORM + PostgreSQL
├── models/            # TypeScript types
└── utils/             # Helpers, embed builders, logger
```
