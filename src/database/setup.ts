import 'dotenv/config';
import { Pool } from 'pg';
import { logger } from '../utils/logger';

const SQL = `
CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY,
  discord_id TEXT NOT NULL,
  guild_id TEXT NOT NULL,
  username TEXT NOT NULL,
  coins INTEGER NOT NULL DEFAULT 100,
  gems INTEGER NOT NULL DEFAULT 0,
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  current_area TEXT NOT NULL DEFAULT 'village',
  reputation INTEGER NOT NULL DEFAULT 0,
  energy_max INTEGER NOT NULL DEFAULT 100,
  energy_current INTEGER NOT NULL DEFAULT 100,
  energy_regen_at TIMESTAMP,
  stats JSONB NOT NULL DEFAULT '{}',
  last_seen TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS plants (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  slot_index INTEGER NOT NULL,
  plant_type TEXT NOT NULL,
  stage TEXT NOT NULL DEFAULT 'seed',
  growth_percent REAL NOT NULL DEFAULT 0,
  water_level REAL NOT NULL DEFAULT 50,
  fertilizer_level REAL NOT NULL DEFAULT 0,
  health REAL NOT NULL DEFAULT 100,
  is_mutant BOOLEAN NOT NULL DEFAULT FALSE,
  mutation_type TEXT,
  planted_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_watered TIMESTAMP,
  ready_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inventory (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  acquired_at TIMESTAMP NOT NULL DEFAULT NOW(),
  metadata JSONB
);

CREATE TABLE IF NOT EXISTS pets (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  pet_type TEXT NOT NULL,
  name TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 1,
  xp INTEGER NOT NULL DEFAULT 0,
  hunger REAL NOT NULL DEFAULT 100,
  happiness REAL NOT NULL DEFAULT 100,
  bond REAL NOT NULL DEFAULT 0,
  health REAL NOT NULL DEFAULT 100,
  status TEXT NOT NULL DEFAULT 'healthy',
  skills JSONB NOT NULL DEFAULT '[]',
  last_fed TIMESTAMP,
  last_played TIMESTAMP,
  adopted_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS player_quests (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  quest_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  objectives JSONB NOT NULL DEFAULT '[]',
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP,
  expires_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS npc_relations (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  npc_id TEXT NOT NULL,
  relation_score INTEGER NOT NULL DEFAULT 0,
  relation TEXT NOT NULL DEFAULT 'stranger',
  last_talked TIMESTAMP,
  gifts_given INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS wildlife_discoveries (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  wildlife_id TEXT NOT NULL,
  first_seen_at TIMESTAMP NOT NULL DEFAULT NOW(),
  times_seen INTEGER NOT NULL DEFAULT 1,
  tamed BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS world_state (
  id TEXT PRIMARY KEY,
  guild_id TEXT NOT NULL UNIQUE,
  current_season TEXT NOT NULL DEFAULT 'spring',
  current_weather TEXT NOT NULL DEFAULT 'sunny',
  time_of_day TEXT NOT NULL DEFAULT 'morning',
  day_number INTEGER NOT NULL DEFAULT 1,
  active_events JSONB NOT NULL DEFAULT '[]',
  world_tick INTEGER NOT NULL DEFAULT 0,
  last_tick_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS active_world_events (
  id TEXT PRIMARY KEY,
  guild_id TEXT NOT NULL,
  event_id TEXT NOT NULL,
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMP NOT NULL,
  participants JSONB NOT NULL DEFAULT '[]',
  completed BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS player_achievements (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,
  unlocked_at TIMESTAMP NOT NULL DEFAULT NOW(),
  notified BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS homes (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE UNIQUE,
  level INTEGER NOT NULL DEFAULT 1,
  name TEXT NOT NULL DEFAULT 'My Home',
  description TEXT NOT NULL DEFAULT 'A cozy little home in the twilight garden.',
  decorations JSONB NOT NULL DEFAULT '[]',
  storage_slots INTEGER NOT NULL DEFAULT 30,
  garden_slots INTEGER NOT NULL DEFAULT 6,
  defense_rating INTEGER NOT NULL DEFAULT 0,
  last_upgraded_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS journal_entries (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  discovered_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS news (
  id TEXT PRIMARY KEY,
  guild_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL,
  importance INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS exploration_logs (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  area TEXT NOT NULL,
  event TEXT NOT NULL,
  result TEXT NOT NULL,
  reward JSONB,
  explored_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auctions (
  id TEXT PRIMARY KEY,
  seller_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  start_price INTEGER NOT NULL,
  current_bid INTEGER NOT NULL,
  highest_bidder_id TEXT,
  ends_at TIMESTAMP NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  from_player_id TEXT,
  to_player_id TEXT,
  type TEXT NOT NULL,
  amount INTEGER NOT NULL,
  item_id TEXT,
  item_quantity INTEGER,
  description TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS guild_config (
  id TEXT PRIMARY KEY,
  guild_id TEXT NOT NULL UNIQUE,
  notification_channel_id TEXT,
  news_channel_id TEXT,
  admin_role_id TEXT,
  language TEXT NOT NULL DEFAULT 'en',
  timezone TEXT NOT NULL DEFAULT 'UTC',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
`;

export async function setupDatabase(): Promise<void> {
  const rawUrl2 = process.env.DATABASE_URL ?? '';
  const isInternal2 = rawUrl2.includes('localhost') || rawUrl2.includes('127.0.0.1') || rawUrl2.includes('.railway.internal');
  const connStr2 = isInternal2 ? (process.env.DATABASE_PUBLIC_URL ?? rawUrl2) : rawUrl2;
  const useSSL2 = !connStr2.includes('localhost') && !connStr2.includes('127.0.0.1');
  const pool = new Pool({ connectionString: connStr2, ssl: useSSL2 ? { rejectUnauthorized: false } : false });
  try {
    await pool.query(SQL);
    logger.info('Database tables created/verified');
  } finally {
    await pool.end();
  }
}
