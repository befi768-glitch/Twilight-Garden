import { eq, and } from 'drizzle-orm';
import { db, schema } from '../database';
import { Achievement, PlayerAchievement } from '../models/types';
import { PlayerService } from './PlayerService';
import { randomUUID } from 'crypto';

export const ACHIEVEMENTS: Record<string, Achievement> = {
  first_plant: { id: 'first_plant', name: 'Green Thumb', emoji: '🌱', description: 'Plant your first seed.', secret: false, rarity: 'common', condition: { type: 'stat', target: 'plantsGrown', value: 1 }, reward: { coins: 50, xp: 20 } },
  harvest_10: { id: 'harvest_10', name: 'Seasoned Gardener', emoji: '🌾', description: 'Harvest 10 crops.', secret: false, rarity: 'common', condition: { type: 'stat', target: 'cropsHarvested', value: 10 }, reward: { coins: 150, xp: 75 } },
  harvest_100: { id: 'harvest_100', name: 'Master Cultivator', emoji: '🏡', description: 'Harvest 100 crops.', secret: false, rarity: 'uncommon', condition: { type: 'stat', target: 'cropsHarvested', value: 100 }, reward: { coins: 500, xp: 300 } },
  explorer_1: { id: 'explorer_1', name: 'Wanderer', emoji: '🗺️', description: 'Explore 5 times.', secret: false, rarity: 'common', condition: { type: 'stat', target: 'explorationCount', value: 5 }, reward: { coins: 100, xp: 50 } },
  explorer_50: { id: 'explorer_50', name: 'Seasoned Explorer', emoji: '🧭', description: 'Explore 50 times.', secret: false, rarity: 'uncommon', condition: { type: 'stat', target: 'explorationCount', value: 50 }, reward: { coins: 400, xp: 250 } },
  rich_1: { id: 'rich_1', name: 'Mooncoins Collector', emoji: '💰', description: 'Earn 1000 mooncoins.', secret: false, rarity: 'common', condition: { type: 'stat', target: 'coinsEarned', value: 1000 }, reward: { coins: 200, xp: 100 } },
  rich_2: { id: 'rich_2', name: 'Twilight Tycoon', emoji: '🤑', description: 'Earn 10000 mooncoins.', secret: false, rarity: 'rare', condition: { type: 'stat', target: 'coinsEarned', value: 10000 }, reward: { coins: 1000, xp: 500 } },
  pet_adopter: { id: 'pet_adopter', name: 'Pet Parent', emoji: '🐾', description: 'Adopt your first pet.', secret: false, rarity: 'common', condition: { type: 'stat', target: 'petsOwned', value: 1 }, reward: { coins: 100, xp: 50, title: 'Pet Parent' } },
  wildlife_5: { id: 'wildlife_5', name: 'Wildlife Observer', emoji: '🔭', description: 'Discover 5 unique wildlife species.', secret: false, rarity: 'uncommon', condition: { type: 'stat', target: 'wildlifeFound', value: 5 }, reward: { coins: 300, xp: 200 } },
  quest_10: { id: 'quest_10', name: 'Quest Master', emoji: '📜', description: 'Complete 10 quests.', secret: false, rarity: 'uncommon', condition: { type: 'stat', target: 'questsCompleted', value: 10 }, reward: { coins: 400, xp: 300 } },
  secret_mutant: { id: 'secret_mutant', name: 'Mutation Whisperer', emoji: '✨', description: '???', secret: true, rarity: 'rare', condition: { type: 'event', target: 'mutant_harvest', value: 1 }, reward: { coins: 500, xp: 400, title: 'Mutant Whisperer' } },
  secret_shadow: { id: 'secret_shadow', name: 'Shadow Tender', emoji: '🌑', description: '???', secret: true, rarity: 'legendary', condition: { type: 'plant', target: 'shadowbloom', value: 1 }, reward: { coins: 2000, xp: 1000, title: 'Shadow Tender' } },
};

export class AchievementService {
  static getAchievement(id: string): Achievement | null {
    return ACHIEVEMENTS[id] ?? null;
  }

  static getAllAchievements(): Achievement[] {
    return Object.values(ACHIEVEMENTS);
  }

  static async getPlayerAchievements(playerId: string): Promise<PlayerAchievement[]> {
    const result = await db.select().from(schema.playerAchievements).where(eq(schema.playerAchievements.playerId, playerId));
    return result as unknown as PlayerAchievement[];
  }

  static async hasAchievement(playerId: string, achievementId: string): Promise<boolean> {
    const result = await db.select().from(schema.playerAchievements)
      .where(and(eq(schema.playerAchievements.playerId, playerId), eq(schema.playerAchievements.achievementId, achievementId))).limit(1);
    return result.length > 0;
  }

  static async unlock(playerId: string, achievementId: string): Promise<Achievement | null> {
    const achievement = ACHIEVEMENTS[achievementId];
    if (!achievement) return null;
    if (await AchievementService.hasAchievement(playerId, achievementId)) return null;

    await db.insert(schema.playerAchievements).values({ id: randomUUID(), playerId, achievementId, unlockedAt: new Date(), notified: false });

    await PlayerService.updateCoins(playerId, achievement.reward.coins);
    await PlayerService.addXp(playerId, achievement.reward.xp);
    await PlayerService.incrementStat(playerId, 'achievementsUnlocked');

    return achievement;
  }

  /** Check all stat-based achievements for a player */
  static async checkStatAchievements(playerId: string): Promise<Achievement[]> {
    const player = await PlayerService.getById(playerId);
    if (!player) return [];
    const stats = ((player as any).stats ?? {}) as Record<string, number>;
    const unlocked: Achievement[] = [];

    for (const ach of Object.values(ACHIEVEMENTS)) {
      if (ach.condition.type !== 'stat') continue;
      if (await AchievementService.hasAchievement(playerId, ach.id)) continue;
      const statVal = stats[ach.condition.target as string] ?? 0;
      if (statVal >= ach.condition.value) {
        const result = await AchievementService.unlock(playerId, ach.id);
        if (result) unlocked.push(result);
      }
    }
    return unlocked;
  }

  /** Trigger an event-based achievement */
  static async triggerEvent(playerId: string, eventType: string): Promise<Achievement[]> {
    const unlocked: Achievement[] = [];
    for (const ach of Object.values(ACHIEVEMENTS)) {
      if (ach.condition.type !== 'event') continue;
      if (ach.condition.target !== eventType) continue;
      const result = await AchievementService.unlock(playerId, ach.id);
      if (result) unlocked.push(result);
    }
    return unlocked;
  }

  static async markNotified(playerId: string, achievementId: string): Promise<void> {
    await db.update(schema.playerAchievements)
      .set({ notified: true })
      .where(and(eq(schema.playerAchievements.playerId, playerId), eq(schema.playerAchievements.achievementId, achievementId)));
  }

  static async getUnnotified(playerId: string): Promise<PlayerAchievement[]> {
    const result = await db.select().from(schema.playerAchievements)
      .where(and(eq(schema.playerAchievements.playerId, playerId), eq(schema.playerAchievements.notified, false)));
    return result as unknown as PlayerAchievement[];
  }
}
