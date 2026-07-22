import { eq, and } from 'drizzle-orm';
import { db, schema } from '../database';
import { Player, PlayerStats } from '../models/types';
import { xpToLevel } from '../utils/helpers';
import { randomUUID } from 'crypto';

export class PlayerService {
  /** Get or create a player record */
  static async getOrCreate(discordId: string, guildId: string, username: string): Promise<Player> {
    const existing = await db
      .select()
      .from(schema.players)
      .where(and(eq(schema.players.discordId, discordId), eq(schema.players.guildId, guildId)))
      .limit(1);

    if (existing.length > 0) {
      // Update last seen & username
      await db
        .update(schema.players)
        .set({ lastSeen: new Date(), username })
        .where(eq(schema.players.id, existing[0].id));
      return existing[0] as unknown as Player;
    }

    const id = randomUUID();
    await db.insert(schema.players).values({
      id,
      discordId,
      guildId,
      username,
      coins: 200,
      gems: 5,
      xp: 0,
      level: 1,
      currentArea: 'village',
      reputation: 0,
      energyMax: 100,
      energyCurrent: 100,
      stats: {},
      lastSeen: new Date(),
      createdAt: new Date(),
    });

    // Create home
    const { HomeService } = await import('./HomeService');
    await HomeService.createHome(id);

    return (await db
      .select()
      .from(schema.players)
      .where(eq(schema.players.id, id))
      .limit(1))[0] as unknown as Player;
  }

  static async getById(id: string): Promise<Player | null> {
    const result = await db.select().from(schema.players).where(eq(schema.players.id, id)).limit(1);
    return result.length > 0 ? (result[0] as unknown as Player) : null;
  }

  static async getByDiscord(discordId: string, guildId: string): Promise<Player | null> {
    const result = await db
      .select()
      .from(schema.players)
      .where(and(eq(schema.players.discordId, discordId), eq(schema.players.guildId, guildId)))
      .limit(1);
    return result.length > 0 ? (result[0] as unknown as Player) : null;
  }

  /** Add XP and handle level-up */
  static async addXp(playerId: string, amount: number): Promise<{ leveledUp: boolean; newLevel: number; oldLevel: number }> {
    const player = await PlayerService.getById(playerId);
    if (!player) throw new Error('Player not found');

    const newXp = player.xp + amount;
    const newLevel = xpToLevel(newXp);
    const leveledUp = newLevel > player.level;

    await db.update(schema.players).set({ xp: newXp, level: newLevel }).where(eq(schema.players.id, playerId));

    return { leveledUp, newLevel, oldLevel: player.level };
  }

  /** Add or subtract coins */
  static async updateCoins(playerId: string, delta: number): Promise<number> {
    const player = await PlayerService.getById(playerId);
    if (!player) throw new Error('Player not found');
    const newCoins = Math.max(0, player.coins + delta);
    await db.update(schema.players).set({ coins: newCoins }).where(eq(schema.players.id, playerId));
    return newCoins;
  }

  /** Check if player has enough coins */
  static async hasEnoughCoins(playerId: string, amount: number): Promise<boolean> {
    const player = await PlayerService.getById(playerId);
    return (player?.coins ?? 0) >= amount;
  }

  /** Use energy */
  static async useEnergy(playerId: string, amount: number): Promise<boolean> {
    const player = await PlayerService.getById(playerId);
    if (!player || player.energyCurrent < amount) return false;
    await db
      .update(schema.players)
      .set({ energyCurrent: player.energyCurrent - amount })
      .where(eq(schema.players.id, playerId));
    return true;
  }

  /** Regenerate energy (called periodically) — max once every 15 minutes per player */
  static async regenEnergy(playerId: string): Promise<void> {
    const player = await PlayerService.getById(playerId);
    if (!player) return;
    if (player.energyCurrent >= player.energyMax) return;

    // FIX: time-gated regen — prevent calling rapidly to exploit free energy
    const REGEN_COOLDOWN_MS = 15 * 60 * 1000; // 15 minutes
    const lastRegen = player.energyRegenAt ? new Date(player.energyRegenAt).getTime() : 0;
    if (Date.now() - lastRegen < REGEN_COOLDOWN_MS) return;

    const newEnergy = Math.min(player.energyMax, player.energyCurrent + 10);
    await db.update(schema.players)
      .set({ energyCurrent: newEnergy, energyRegenAt: new Date() })
      .where(eq(schema.players.id, playerId));
  }

  /** Move player to a different area */
  static async moveToArea(playerId: string, area: string): Promise<void> {
    await db.update(schema.players).set({ currentArea: area }).where(eq(schema.players.id, playerId));
  }

  /** Update reputation */
  static async addReputation(playerId: string, amount: number): Promise<void> {
    const player = await PlayerService.getById(playerId);
    if (!player) return;
    await db
      .update(schema.players)
      .set({ reputation: player.reputation + amount })
      .where(eq(schema.players.id, playerId));
  }

  /** Update a stat counter */
  static async incrementStat(playerId: string, statKey: keyof PlayerStats, amount = 1): Promise<void> {
    const player = await PlayerService.getById(playerId);
    if (!player) return;
    const stats = ((player as any).stats ?? {}) as Partial<PlayerStats>;
    const current = (stats[statKey] ?? 0) as number;
    await db
      .update(schema.players)
      .set({ stats: { ...stats, [statKey]: current + amount } })
      .where(eq(schema.players.id, playerId));
  }

  /** Get all players in a guild */
  static async getAllInGuild(guildId: string): Promise<Player[]> {
    const result = await db.select().from(schema.players).where(eq(schema.players.guildId, guildId));
    return result as unknown as Player[];
  }

  /** Get top players by coin amount */
  static async getLeaderboard(guildId: string, field: 'coins' | 'xp' | 'reputation', limit = 10): Promise<Player[]> {
    const col = field === 'coins' ? schema.players.coins : field === 'xp' ? schema.players.xp : schema.players.reputation;
    const { desc } = await import('drizzle-orm');
    const result = await db
      .select()
      .from(schema.players)
      .where(eq(schema.players.guildId, guildId))
      .orderBy(desc(col))
      .limit(limit);
    return result as unknown as Player[];
  }
}
