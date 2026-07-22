import { eq } from 'drizzle-orm';
import { db, schema } from '../database';
import { randomUUID } from 'crypto';
import { WorldState, Season, Weather, TimeOfDay } from '../models/types';

export class GuildService {
  static async getOrCreateConfig(guildId: string) {
    const existing = await db.select().from(schema.guildConfig).where(eq(schema.guildConfig.guildId, guildId)).limit(1);
    if (existing.length > 0) return existing[0];

    await db.insert(schema.guildConfig).values({ id: randomUUID(), guildId, language: 'en', timezone: 'UTC', createdAt: new Date(), updatedAt: new Date() });
    return (await db.select().from(schema.guildConfig).where(eq(schema.guildConfig.guildId, guildId)).limit(1))[0];
  }

  static async setNotificationChannel(guildId: string, channelId: string): Promise<void> {
    await GuildService.getOrCreateConfig(guildId);
    await db.update(schema.guildConfig).set({ notificationChannelId: channelId, updatedAt: new Date() }).where(eq(schema.guildConfig.guildId, guildId));
  }

  static async setNewsChannel(guildId: string, channelId: string): Promise<void> {
    await GuildService.getOrCreateConfig(guildId);
    await db.update(schema.guildConfig).set({ newsChannelId: channelId, updatedAt: new Date() }).where(eq(schema.guildConfig.guildId, guildId));
  }

  static async getOrCreateWorldState(guildId: string): Promise<WorldState> {
    const existing = await db.select().from(schema.worldState).where(eq(schema.worldState.guildId, guildId)).limit(1);
    if (existing.length > 0) return existing[0] as unknown as WorldState;

    await db.insert(schema.worldState).values({
      id: randomUUID(), guildId,
      currentSeason: 'spring', currentWeather: 'sunny', timeOfDay: 'morning',
      dayNumber: 1, activeEvents: [], worldTick: 0, lastTickAt: new Date(),
    });
    return (await db.select().from(schema.worldState).where(eq(schema.worldState.guildId, guildId)).limit(1))[0] as unknown as WorldState;
  }

  static async updateWorldState(guildId: string, patch: Partial<WorldState>): Promise<void> {
    await db.update(schema.worldState).set(patch as any).where(eq(schema.worldState.guildId, guildId));
  }
}
