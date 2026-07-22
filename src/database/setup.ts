import 'dotenv/config';
import { Pool } from 'pg';
import { logger } from '../utils/logger';

// Each CREATE TABLE is its own statement so a failure in one doesn't silently
// skip the rest (pool.query with a multi-statement string stops on first error).
const CREATE_TABLES: string[] = [
  `CREATE TABLE IF NOT EXISTS players (
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
  )`,

  `CREATE TABLE IF NOT EXISTS plants (
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
  )`,

  `CREATE TABLE IF NOT EXISTS inventory (
    id TEXT PRIMARY KEY,
    player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    item_id TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    acquired_at TIMESTAMP NOT NULL DEFAULT NOW(),
    metadata JSONB
  )`,

  `CREATE TABLE IF NOT EXISTS pets (
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
  )`,

  `CREATE TABLE IF NOT EXISTS player_quests (
    id TEXT PRIMARY KEY,
    player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    quest_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    objectives JSONB NOT NULL DEFAULT '[]',
    started_at TIMESTAMP NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP,
    expires_at TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS npc_relations (
    id TEXT PRIMARY KEY,
    player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    npc_id TEXT NOT NULL,
    relation_score INTEGER NOT NULL DEFAULT 0,
    relation TEXT NOT NULL DEFAULT 'stranger',
    last_talked TIMESTAMP,
    gifts_given INTEGER NOT NULL DEFAULT 0
  )`,

  `CREATE TABLE IF NOT EXISTS wildlife_discoveries (
    id TEXT PRIMARY KEY,
    player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    wildlife_id TEXT NOT NULL,
    first_seen_at TIMESTAMP NOT NULL DEFAULT NOW(),
    times_seen INTEGER NOT NULL DEFAULT 1,
    tamed BOOLEAN NOT NULL DEFAULT FALSE
  )`,

  `CREATE TABLE IF NOT EXISTS world_state (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL UNIQUE,
    current_season TEXT NOT NULL DEFAULT 'spring',
    current_weather TEXT NOT NULL DEFAULT 'sunny',
    time_of_day TEXT NOT NULL DEFAULT 'morning',
    day_number INTEGER NOT NULL DEFAULT 1,
    active_events JSONB NOT NULL DEFAULT '[]',
    world_tick INTEGER NOT NULL DEFAULT 0,
    last_tick_at TIMESTAMP NOT NULL DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS active_world_events (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    event_id TEXT NOT NULL,
    started_at TIMESTAMP NOT NULL DEFAULT NOW(),
    ends_at TIMESTAMP NOT NULL,
    participants JSONB NOT NULL DEFAULT '[]',
    completed BOOLEAN NOT NULL DEFAULT FALSE
  )`,

  `CREATE TABLE IF NOT EXISTS player_achievements (
    id TEXT PRIMARY KEY,
    player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    achievement_id TEXT NOT NULL,
    unlocked_at TIMESTAMP NOT NULL DEFAULT NOW(),
    notified BOOLEAN NOT NULL DEFAULT FALSE
  )`,

  `CREATE TABLE IF NOT EXISTS homes (
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
  )`,

  `CREATE TABLE IF NOT EXISTS journal_entries (
    id TEXT PRIMARY KEY,
    player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    discovered_at TIMESTAMP NOT NULL DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS news (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL,
    importance INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL DEFAULT NOW() + INTERVAL '7 days'
  )`,

  `CREATE TABLE IF NOT EXISTS exploration_logs (
    id TEXT PRIMARY KEY,
    player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    area TEXT NOT NULL,
    event TEXT NOT NULL,
    result TEXT NOT NULL,
    reward JSONB,
    explored_at TIMESTAMP NOT NULL DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS auctions (
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
  )`,

  `CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    from_player_id TEXT,
    to_player_id TEXT,
    type TEXT NOT NULL,
    amount INTEGER NOT NULL,
    item_id TEXT,
    item_quantity INTEGER,
    description TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS guild_config (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL UNIQUE,
    notification_channel_id TEXT,
    news_channel_id TEXT,
    admin_role_id TEXT,
    language TEXT NOT NULL DEFAULT 'en',
    timezone TEXT NOT NULL DEFAULT 'UTC',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  )`,
];

// ADD COLUMN IF NOT EXISTS is safe to run repeatedly — each step is idempotent.
// These handle databases that existed before a column was added to the schema.
const MIGRATION_STEPS: string[] = [
  // ── STEP 0: Auto-drop NOT NULL on ALL unknown legacy columns ──────────────────
  // The production DB may have extra NOT NULL columns from old schema versions
  // (user_id, guild_id, item_type, discord_id, etc.) that the new code doesn't set.
  // This DO block scans information_schema for each table and drops NOT NULL on
  // every column that isn't in the "required NOT NULL" whitelist for that table.
  // Each column is handled in its own EXCEPTION block so one failure won't stop the rest.
  // This replaces the old per-column ALTER TABLE approach and handles any future
  // unknown legacy columns automatically.
  `DO $$
DECLARE
  col_rec RECORD;
  tbl TEXT;
  required TEXT[];
  tables_config JSONB := '[
    {"table": "inventory",            "required": ["id","player_id","item_id","quantity","acquired_at"]},
    {"table": "plants",               "required": ["id","player_id","slot_index","plant_type","stage","growth_percent","water_level","fertilizer_level","health","is_mutant","planted_at"]},
    {"table": "pets",                 "required": ["id","player_id","pet_type","name","level","xp","hunger","happiness","bond","health","status","skills","adopted_at"]},
    {"table": "player_quests",        "required": ["id","player_id","quest_id","status","objectives","started_at"]},
    {"table": "npc_relations",        "required": ["id","player_id","npc_id","relation_score","relation","gifts_given"]},
    {"table": "wildlife_discoveries", "required": ["id","player_id","wildlife_id","first_seen_at","times_seen","tamed"]},
    {"table": "player_achievements",  "required": ["id","player_id","achievement_id","unlocked_at","notified"]},
    {"table": "homes",                "required": ["id","player_id","level","name","description","decorations","storage_slots","garden_slots","defense_rating"]},
    {"table": "journal_entries",      "required": ["id","player_id","type","target_id","title","content","discovered_at"]},
    {"table": "exploration_logs",     "required": ["id","player_id","area","event","result","explored_at"]}
  ]'::JSONB;
  config_item JSONB;
BEGIN
  FOR config_item IN SELECT jsonb_array_elements(tables_config)
  LOOP
    tbl := config_item->>'table';
    SELECT ARRAY(SELECT jsonb_array_elements_text(config_item->'required')) INTO required;

    FOR col_rec IN
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = tbl
        AND is_nullable = 'NO'
        AND column_name != ALL(required)
    LOOP
      BEGIN
        EXECUTE format('ALTER TABLE %I ALTER COLUMN %I DROP NOT NULL', tbl, col_rec.column_name);
      EXCEPTION WHEN OTHERS THEN
        -- Ignore errors (column may not support DROP NOT NULL or may have been dropped)
        NULL;
      END;
    END LOOP;
  END LOOP;
END $$`,

  // ── STEP 1: Backfill player_id from user_id where missing ──────────────────
  // Old schema stored identity in user_id; new schema uses player_id.
  // After dropping NOT NULL above, backfill player_id from user_id for old rows.
  `UPDATE inventory SET player_id = user_id WHERE player_id IS NULL AND user_id IS NOT NULL AND user_id != '' AND user_id IN (SELECT id FROM players)`,
  `UPDATE plants SET player_id = user_id WHERE player_id IS NULL AND user_id IS NOT NULL AND user_id != '' AND user_id IN (SELECT id FROM players)`,
  `UPDATE pets SET player_id = user_id WHERE player_id IS NULL AND user_id IS NOT NULL AND user_id != '' AND user_id IN (SELECT id FROM players)`,
  `UPDATE player_quests SET player_id = user_id WHERE player_id IS NULL AND user_id IS NOT NULL AND user_id != '' AND user_id IN (SELECT id FROM players)`,
  `UPDATE npc_relations SET player_id = user_id WHERE player_id IS NULL AND user_id IS NOT NULL AND user_id != '' AND user_id IN (SELECT id FROM players)`,
  `UPDATE wildlife_discoveries SET player_id = user_id WHERE player_id IS NULL AND user_id IS NOT NULL AND user_id != '' AND user_id IN (SELECT id FROM players)`,
  `UPDATE player_achievements SET player_id = user_id WHERE player_id IS NULL AND user_id IS NOT NULL AND user_id != '' AND user_id IN (SELECT id FROM players)`,
  `UPDATE homes SET player_id = user_id WHERE player_id IS NULL AND user_id IS NOT NULL AND user_id != '' AND user_id IN (SELECT id FROM players)`,
  `UPDATE journal_entries SET player_id = user_id WHERE player_id IS NULL AND user_id IS NOT NULL AND user_id != '' AND user_id IN (SELECT id FROM players)`,
  `UPDATE exploration_logs SET player_id = user_id WHERE player_id IS NULL AND user_id IS NOT NULL AND user_id != '' AND user_id IN (SELECT id FROM players)`,

  // plants
  `ALTER TABLE plants ADD COLUMN IF NOT EXISTS player_id TEXT REFERENCES players(id) ON DELETE CASCADE`,
  `ALTER TABLE plants ADD COLUMN IF NOT EXISTS slot_index INTEGER`,
  `ALTER TABLE plants ADD COLUMN IF NOT EXISTS growth_percent REAL NOT NULL DEFAULT 0`,
  `ALTER TABLE plants ADD COLUMN IF NOT EXISTS water_level REAL NOT NULL DEFAULT 50`,
  `ALTER TABLE plants ADD COLUMN IF NOT EXISTS fertilizer_level REAL NOT NULL DEFAULT 0`,
  `ALTER TABLE plants ADD COLUMN IF NOT EXISTS is_mutant BOOLEAN NOT NULL DEFAULT FALSE`,
  `ALTER TABLE plants ADD COLUMN IF NOT EXISTS mutation_type TEXT`,
  `ALTER TABLE plants ADD COLUMN IF NOT EXISTS health REAL NOT NULL DEFAULT 100`,
  `ALTER TABLE plants ADD COLUMN IF NOT EXISTS plant_type TEXT`,
  `ALTER TABLE plants ADD COLUMN IF NOT EXISTS stage TEXT NOT NULL DEFAULT 'seed'`,
  `ALTER TABLE plants ADD COLUMN IF NOT EXISTS planted_at TIMESTAMP NOT NULL DEFAULT NOW()`,
  `ALTER TABLE plants ADD COLUMN IF NOT EXISTS last_watered TIMESTAMP`,
  `ALTER TABLE plants ADD COLUMN IF NOT EXISTS ready_at TIMESTAMP`,

  // inventory
  `ALTER TABLE inventory ADD COLUMN IF NOT EXISTS player_id TEXT REFERENCES players(id) ON DELETE CASCADE`,
  `ALTER TABLE inventory ADD COLUMN IF NOT EXISTS acquired_at TIMESTAMP NOT NULL DEFAULT NOW()`,
  `ALTER TABLE inventory ADD COLUMN IF NOT EXISTS metadata JSONB`,
  // item_type is a legacy NOT NULL column — add it as nullable so old rows and new INSERTs don't fail
  `ALTER TABLE inventory ADD COLUMN IF NOT EXISTS item_type TEXT`,
  `ALTER TABLE inventory ALTER COLUMN item_type DROP NOT NULL`,
  // inventory user_id fix is handled at the top of MIGRATION_STEPS via bare ALTER TABLE

  // pets
  `ALTER TABLE pets ADD COLUMN IF NOT EXISTS player_id TEXT REFERENCES players(id) ON DELETE CASCADE`,
  `ALTER TABLE pets ADD COLUMN IF NOT EXISTS pet_type TEXT`,
  `ALTER TABLE pets ADD COLUMN IF NOT EXISTS name TEXT`,
  `ALTER TABLE pets ADD COLUMN IF NOT EXISTS level INTEGER NOT NULL DEFAULT 1`,
  `ALTER TABLE pets ADD COLUMN IF NOT EXISTS xp INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE pets ADD COLUMN IF NOT EXISTS hunger REAL NOT NULL DEFAULT 100`,
  `ALTER TABLE pets ADD COLUMN IF NOT EXISTS happiness REAL NOT NULL DEFAULT 100`,
  `ALTER TABLE pets ADD COLUMN IF NOT EXISTS bond REAL NOT NULL DEFAULT 0`,
  `ALTER TABLE pets ADD COLUMN IF NOT EXISTS health REAL NOT NULL DEFAULT 100`,
  `ALTER TABLE pets ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'healthy'`,
  `ALTER TABLE pets ADD COLUMN IF NOT EXISTS skills JSONB NOT NULL DEFAULT '[]'`,
  `ALTER TABLE pets ADD COLUMN IF NOT EXISTS last_fed TIMESTAMP`,
  `ALTER TABLE pets ADD COLUMN IF NOT EXISTS last_played TIMESTAMP`,
  `ALTER TABLE pets ADD COLUMN IF NOT EXISTS adopted_at TIMESTAMP NOT NULL DEFAULT NOW()`,

  // player_quests
  `ALTER TABLE player_quests ADD COLUMN IF NOT EXISTS player_id TEXT REFERENCES players(id) ON DELETE CASCADE`,
  `ALTER TABLE player_quests ADD COLUMN IF NOT EXISTS quest_id TEXT`,
  `ALTER TABLE player_quests ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'`,
  `ALTER TABLE player_quests ADD COLUMN IF NOT EXISTS objectives JSONB NOT NULL DEFAULT '[]'`,
  `ALTER TABLE player_quests ADD COLUMN IF NOT EXISTS started_at TIMESTAMP NOT NULL DEFAULT NOW()`,
  `ALTER TABLE player_quests ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP`,
  `ALTER TABLE player_quests ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP`,

  // npc_relations
  `ALTER TABLE npc_relations ADD COLUMN IF NOT EXISTS player_id TEXT REFERENCES players(id) ON DELETE CASCADE`,
  `ALTER TABLE npc_relations ADD COLUMN IF NOT EXISTS npc_id TEXT`,
  `ALTER TABLE npc_relations ADD COLUMN IF NOT EXISTS relation_score INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE npc_relations ADD COLUMN IF NOT EXISTS relation TEXT NOT NULL DEFAULT 'stranger'`,
  `ALTER TABLE npc_relations ADD COLUMN IF NOT EXISTS last_talked TIMESTAMP`,
  `ALTER TABLE npc_relations ADD COLUMN IF NOT EXISTS gifts_given INTEGER NOT NULL DEFAULT 0`,

  // wildlife_discoveries
  `ALTER TABLE wildlife_discoveries ADD COLUMN IF NOT EXISTS player_id TEXT REFERENCES players(id) ON DELETE CASCADE`,
  `ALTER TABLE wildlife_discoveries ADD COLUMN IF NOT EXISTS wildlife_id TEXT`,
  `ALTER TABLE wildlife_discoveries ADD COLUMN IF NOT EXISTS first_seen_at TIMESTAMP NOT NULL DEFAULT NOW()`,
  `ALTER TABLE wildlife_discoveries ADD COLUMN IF NOT EXISTS times_seen INTEGER NOT NULL DEFAULT 1`,
  `ALTER TABLE wildlife_discoveries ADD COLUMN IF NOT EXISTS tamed BOOLEAN NOT NULL DEFAULT FALSE`,

  // player_achievements
  `ALTER TABLE player_achievements ADD COLUMN IF NOT EXISTS player_id TEXT REFERENCES players(id) ON DELETE CASCADE`,
  `ALTER TABLE player_achievements ADD COLUMN IF NOT EXISTS achievement_id TEXT`,
  `ALTER TABLE player_achievements ADD COLUMN IF NOT EXISTS unlocked_at TIMESTAMP NOT NULL DEFAULT NOW()`,
  `ALTER TABLE player_achievements ADD COLUMN IF NOT EXISTS notified BOOLEAN NOT NULL DEFAULT FALSE`,

  // homes
  `ALTER TABLE homes ADD COLUMN IF NOT EXISTS player_id TEXT REFERENCES players(id) ON DELETE CASCADE`,
  `ALTER TABLE homes ADD COLUMN IF NOT EXISTS level INTEGER NOT NULL DEFAULT 1`,
  `ALTER TABLE homes ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT 'My Home'`,
  `ALTER TABLE homes ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT 'A cozy little home in the twilight garden.'`,
  `ALTER TABLE homes ADD COLUMN IF NOT EXISTS storage_slots INTEGER NOT NULL DEFAULT 30`,
  `ALTER TABLE homes ADD COLUMN IF NOT EXISTS garden_slots INTEGER NOT NULL DEFAULT 6`,
  `ALTER TABLE homes ADD COLUMN IF NOT EXISTS defense_rating INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE homes ADD COLUMN IF NOT EXISTS decorations JSONB NOT NULL DEFAULT '[]'`,
  `ALTER TABLE homes ADD COLUMN IF NOT EXISTS last_upgraded_at TIMESTAMP`,

  // journal_entries
  `ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS player_id TEXT REFERENCES players(id) ON DELETE CASCADE`,
  `ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS type TEXT`,
  `ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS target_id TEXT`,
  `ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS title TEXT`,
  `ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS content TEXT`,
  `ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS discovered_at TIMESTAMP NOT NULL DEFAULT NOW()`,

  // exploration_logs
  `ALTER TABLE exploration_logs ADD COLUMN IF NOT EXISTS player_id TEXT REFERENCES players(id) ON DELETE CASCADE`,
  `ALTER TABLE exploration_logs ADD COLUMN IF NOT EXISTS area TEXT`,
  `ALTER TABLE exploration_logs ADD COLUMN IF NOT EXISTS event TEXT`,
  `ALTER TABLE exploration_logs ADD COLUMN IF NOT EXISTS result TEXT`,
  `ALTER TABLE exploration_logs ADD COLUMN IF NOT EXISTS reward JSONB`,
  `ALTER TABLE exploration_logs ADD COLUMN IF NOT EXISTS explored_at TIMESTAMP NOT NULL DEFAULT NOW()`,

  // news — columns added/renamed in later schema versions
  `ALTER TABLE news ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE news ADD COLUMN IF NOT EXISTS importance INTEGER NOT NULL DEFAULT 1`,
  `ALTER TABLE news ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT NOW()`,
  `ALTER TABLE news ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP NOT NULL DEFAULT NOW() + INTERVAL '7 days'`,

  // world_state
  `ALTER TABLE world_state ADD COLUMN IF NOT EXISTS guild_id TEXT`,
  `ALTER TABLE world_state ADD COLUMN IF NOT EXISTS current_season TEXT NOT NULL DEFAULT 'spring'`,
  `ALTER TABLE world_state ADD COLUMN IF NOT EXISTS current_weather TEXT NOT NULL DEFAULT 'sunny'`,
  `ALTER TABLE world_state ADD COLUMN IF NOT EXISTS time_of_day TEXT NOT NULL DEFAULT 'morning'`,
  `ALTER TABLE world_state ADD COLUMN IF NOT EXISTS day_number INTEGER NOT NULL DEFAULT 1`,
  `ALTER TABLE world_state ADD COLUMN IF NOT EXISTS active_events JSONB NOT NULL DEFAULT '[]'`,
  `ALTER TABLE world_state ADD COLUMN IF NOT EXISTS world_tick INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE world_state ADD COLUMN IF NOT EXISTS last_tick_at TIMESTAMP NOT NULL DEFAULT NOW()`,

  // guild_config
  `ALTER TABLE guild_config ADD COLUMN IF NOT EXISTS guild_id TEXT`,
  `ALTER TABLE guild_config ADD COLUMN IF NOT EXISTS notification_channel_id TEXT`,
  `ALTER TABLE guild_config ADD COLUMN IF NOT EXISTS news_channel_id TEXT`,
  `ALTER TABLE guild_config ADD COLUMN IF NOT EXISTS admin_role_id TEXT`,
  `ALTER TABLE guild_config ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'en'`,
  `ALTER TABLE guild_config ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'UTC'`,
  `ALTER TABLE guild_config ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW()`,

  // players — columns added in later schema versions
  `ALTER TABLE players ADD COLUMN IF NOT EXISTS discord_id TEXT`,
  `ALTER TABLE players ADD COLUMN IF NOT EXISTS guild_id TEXT`,
  `ALTER TABLE players ADD COLUMN IF NOT EXISTS username TEXT`,
  `ALTER TABLE players ADD COLUMN IF NOT EXISTS coins INTEGER NOT NULL DEFAULT 100`,
  `ALTER TABLE players ADD COLUMN IF NOT EXISTS gems INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE players ADD COLUMN IF NOT EXISTS xp INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE players ADD COLUMN IF NOT EXISTS level INTEGER NOT NULL DEFAULT 1`,
  `ALTER TABLE players ADD COLUMN IF NOT EXISTS current_area TEXT NOT NULL DEFAULT 'village'`,
  `ALTER TABLE players ADD COLUMN IF NOT EXISTS reputation INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE players ADD COLUMN IF NOT EXISTS stats JSONB DEFAULT '{}'`,
  `ALTER TABLE players ADD COLUMN IF NOT EXISTS energy_max INTEGER NOT NULL DEFAULT 100`,
  `ALTER TABLE players ADD COLUMN IF NOT EXISTS energy_current INTEGER NOT NULL DEFAULT 100`,
  `ALTER TABLE players ADD COLUMN IF NOT EXISTS energy_regen_at TIMESTAMP`,
  `ALTER TABLE players ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP NOT NULL DEFAULT NOW()`,
  `ALTER TABLE players ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT NOW()`,
];

export async function setupDatabase(): Promise<void> {
  const rawUrl = process.env.DATABASE_URL ?? '';
  const isInternal =
    rawUrl.includes('localhost') ||
    rawUrl.includes('127.0.0.1') ||
    rawUrl.includes('.railway.internal');
  const connStr = isInternal ? (process.env.DATABASE_PUBLIC_URL ?? rawUrl) : rawUrl;
  const useSSL = !connStr.includes('localhost') && !connStr.includes('127.0.0.1');
  const pool = new Pool({ connectionString: connStr, ssl: useSSL ? { rejectUnauthorized: false } : false });

  try {
    // ── 1. Create tables individually so a failure in one doesn't block others ──
    let tableErrors = 0;
    for (const sql of CREATE_TABLES) {
      try {
        await pool.query(sql);
      } catch (err: any) {
        tableErrors++;
        logger.error(`CREATE TABLE failed: ${err.message}`);
      }
    }
    if (tableErrors === 0) {
      logger.info(`Database tables created/verified (${CREATE_TABLES.length} tables)`);
    } else {
      logger.warn(`Database setup finished with ${tableErrors} table error(s) — check logs above`);
    }

    // ── 2. Apply schema migrations (idempotent ALTER TABLE ADD COLUMN IF NOT EXISTS) ──
    let applied = 0;
    let skipped = 0;
    let failed = 0;
    for (const step of MIGRATION_STEPS) {
      try {
        await pool.query(step);
        applied++;
      } catch (err: any) {
        const msg: string = err.message ?? '';
        if (msg.includes('already exists')) {
          skipped++;
        } else {
          failed++;
          // Log at warn so it shows in Railway/production logs but doesn't crash the bot.
          // Common non-fatal causes: table doesn't exist yet (will be created on next start),
          // or column constraint conflicts on existing nullable rows.
          logger.warn(`Migration step failed: ${msg} | SQL: ${step}`);
        }
      }
    }
    logger.info(
      `Database migrations: ${applied} applied, ${skipped} already existed, ${failed} failed` +
        (failed > 0 ? ' — see warnings above' : ''),
    );
  } finally {
    await pool.end();
  }
}
