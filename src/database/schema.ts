import { pgTable, text, integer, boolean, timestamp, jsonb, real, serial } from 'drizzle-orm/pg-core';

// ─── Players ──────────────────────────────────────────────────────────────────

export const players = pgTable('players', {
  id: text('id').primaryKey(),
  discordId: text('discord_id').notNull(),
  guildId: text('guild_id').notNull(),
  username: text('username').notNull(),
  coins: integer('coins').notNull().default(100),
  gems: integer('gems').notNull().default(0),
  xp: integer('xp').notNull().default(0),
  level: integer('level').notNull().default(1),
  currentArea: text('current_area').notNull().default('village'),
  reputation: integer('reputation').notNull().default(0),
  energyMax: integer('energy_max').notNull().default(100),
  energyCurrent: integer('energy_current').notNull().default(100),
  energyRegenAt: timestamp('energy_regen_at'),
  stats: jsonb('stats').notNull().default({}),
  lastSeen: timestamp('last_seen').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ─── Garden / Plants ──────────────────────────────────────────────────────────

export const plants = pgTable('plants', {
  id: text('id').primaryKey(),
  playerId: text('player_id').notNull().references(() => players.id, { onDelete: 'cascade' }),
  slotIndex: integer('slot_index').notNull(),
  plantType: text('plant_type').notNull(),
  stage: text('stage').notNull().default('seed'),
  growthPercent: real('growth_percent').notNull().default(0),
  waterLevel: real('water_level').notNull().default(50),
  fertilizerLevel: real('fertilizer_level').notNull().default(0),
  health: real('health').notNull().default(100),
  isMutant: boolean('is_mutant').notNull().default(false),
  mutationType: text('mutation_type'),
  plantedAt: timestamp('planted_at').notNull().defaultNow(),
  lastWatered: timestamp('last_watered'),
  readyAt: timestamp('ready_at'),
});

// ─── Inventory ────────────────────────────────────────────────────────────────

export const inventory = pgTable('inventory', {
  id: text('id').primaryKey(),
  playerId: text('player_id').notNull().references(() => players.id, { onDelete: 'cascade' }),
  itemId: text('item_id').notNull(),
  quantity: integer('quantity').notNull().default(1),
  acquiredAt: timestamp('acquired_at').notNull().defaultNow(),
  metadata: jsonb('metadata'),
});

// ─── Pets ─────────────────────────────────────────────────────────────────────

export const pets = pgTable('pets', {
  id: text('id').primaryKey(),
  playerId: text('player_id').notNull().references(() => players.id, { onDelete: 'cascade' }),
  petType: text('pet_type').notNull(),
  name: text('name').notNull(),
  level: integer('level').notNull().default(1),
  xp: integer('xp').notNull().default(0),
  hunger: real('hunger').notNull().default(100),
  happiness: real('happiness').notNull().default(100),
  bond: real('bond').notNull().default(0),
  health: real('health').notNull().default(100),
  status: text('status').notNull().default('healthy'),
  skills: jsonb('skills').notNull().default([]),
  lastFed: timestamp('last_fed'),
  lastPlayed: timestamp('last_played'),
  adoptedAt: timestamp('adopted_at').notNull().defaultNow(),
});

// ─── Player Quests ────────────────────────────────────────────────────────────

export const playerQuests = pgTable('player_quests', {
  id: text('id').primaryKey(),
  playerId: text('player_id').notNull().references(() => players.id, { onDelete: 'cascade' }),
  questId: text('quest_id').notNull(),
  status: text('status').notNull().default('active'),
  objectives: jsonb('objectives').notNull().default([]),
  startedAt: timestamp('started_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'),
  expiresAt: timestamp('expires_at'),
});

// ─── NPC Relations ────────────────────────────────────────────────────────────

export const npcRelations = pgTable('npc_relations', {
  id: text('id').primaryKey(),
  playerId: text('player_id').notNull().references(() => players.id, { onDelete: 'cascade' }),
  npcId: text('npc_id').notNull(),
  relationScore: integer('relation_score').notNull().default(0),
  relation: text('relation').notNull().default('stranger'),
  lastTalked: timestamp('last_talked'),
  giftsGiven: integer('gifts_given').notNull().default(0),
});

// ─── Wildlife Discoveries ─────────────────────────────────────────────────────

export const wildlifeDiscoveries = pgTable('wildlife_discoveries', {
  id: text('id').primaryKey(),
  playerId: text('player_id').notNull().references(() => players.id, { onDelete: 'cascade' }),
  wildlifeId: text('wildlife_id').notNull(),
  firstSeenAt: timestamp('first_seen_at').notNull().defaultNow(),
  timesSeen: integer('times_seen').notNull().default(1),
  tamed: boolean('tamed').notNull().default(false),
});

// ─── World State ──────────────────────────────────────────────────────────────

export const worldState = pgTable('world_state', {
  id: text('id').primaryKey(),
  guildId: text('guild_id').notNull().unique(),
  currentSeason: text('current_season').notNull().default('spring'),
  currentWeather: text('current_weather').notNull().default('sunny'),
  timeOfDay: text('time_of_day').notNull().default('morning'),
  dayNumber: integer('day_number').notNull().default(1),
  activeEvents: jsonb('active_events').notNull().default([]),
  worldTick: integer('world_tick').notNull().default(0),
  lastTickAt: timestamp('last_tick_at').notNull().defaultNow(),
});

// ─── Active World Events ──────────────────────────────────────────────────────

export const activeWorldEvents = pgTable('active_world_events', {
  id: text('id').primaryKey(),
  guildId: text('guild_id').notNull(),
  eventId: text('event_id').notNull(),
  startedAt: timestamp('started_at').notNull().defaultNow(),
  endsAt: timestamp('ends_at').notNull(),
  participants: jsonb('participants').notNull().default([]),
  completed: boolean('completed').notNull().default(false),
});

// ─── Achievements ─────────────────────────────────────────────────────────────

export const playerAchievements = pgTable('player_achievements', {
  id: text('id').primaryKey(),
  playerId: text('player_id').notNull().references(() => players.id, { onDelete: 'cascade' }),
  achievementId: text('achievement_id').notNull(),
  unlockedAt: timestamp('unlocked_at').notNull().defaultNow(),
  notified: boolean('notified').notNull().default(false),
});

// ─── Home ─────────────────────────────────────────────────────────────────────

export const homes = pgTable('homes', {
  id: text('id').primaryKey(),
  playerId: text('player_id').notNull().references(() => players.id, { onDelete: 'cascade' }).unique(),
  level: integer('level').notNull().default(1),
  name: text('name').notNull().default('My Home'),
  description: text('description').notNull().default('A cozy little home in the twilight garden.'),
  decorations: jsonb('decorations').notNull().default([]),
  storageSlots: integer('storage_slots').notNull().default(30),
  gardenSlots: integer('garden_slots').notNull().default(6),
  defenseRating: integer('defense_rating').notNull().default(0),
  lastUpgradedAt: timestamp('last_upgraded_at'),
});

// ─── Journal ──────────────────────────────────────────────────────────────────

export const journalEntries = pgTable('journal_entries', {
  id: text('id').primaryKey(),
  playerId: text('player_id').notNull().references(() => players.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  targetId: text('target_id').notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  discoveredAt: timestamp('discovered_at').notNull().defaultNow(),
});

// ─── News ─────────────────────────────────────────────────────────────────────

export const news = pgTable('news', {
  id: text('id').primaryKey(),
  guildId: text('guild_id').notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  type: text('type').notNull(),
  importance: integer('importance').notNull().default(1),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  expiresAt: timestamp('expires_at').notNull(),
});

// ─── Exploration Logs ─────────────────────────────────────────────────────────

export const explorationLogs = pgTable('exploration_logs', {
  id: text('id').primaryKey(),
  playerId: text('player_id').notNull().references(() => players.id, { onDelete: 'cascade' }),
  area: text('area').notNull(),
  event: text('event').notNull(),
  result: text('result').notNull(),
  reward: jsonb('reward'),
  exploredAt: timestamp('explored_at').notNull().defaultNow(),
});

// ─── Auction House ────────────────────────────────────────────────────────────

export const auctions = pgTable('auctions', {
  id: text('id').primaryKey(),
  sellerId: text('seller_id').notNull().references(() => players.id, { onDelete: 'cascade' }),
  itemId: text('item_id').notNull(),
  quantity: integer('quantity').notNull().default(1),
  startPrice: integer('start_price').notNull(),
  currentBid: integer('current_bid').notNull(),
  highestBidderId: text('highest_bidder_id'),
  endsAt: timestamp('ends_at').notNull(),
  status: text('status').notNull().default('active'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ─── Transactions ─────────────────────────────────────────────────────────────

export const transactions = pgTable('transactions', {
  id: text('id').primaryKey(),
  fromPlayerId: text('from_player_id'),
  toPlayerId: text('to_player_id'),
  type: text('type').notNull(),
  amount: integer('amount').notNull(),
  itemId: text('item_id'),
  itemQuantity: integer('item_quantity'),
  description: text('description').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ─── Guild Config ─────────────────────────────────────────────────────────────

export const guildConfig = pgTable('guild_config', {
  id: text('id').primaryKey(),
  guildId: text('guild_id').notNull().unique(),
  notificationChannelId: text('notification_channel_id'),
  newsChannelId: text('news_channel_id'),
  adminRoleId: text('admin_role_id'),
  language: text('language').notNull().default('en'),
  timezone: text('timezone').notNull().default('UTC'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
