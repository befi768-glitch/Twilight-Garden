import { eq, and } from 'drizzle-orm';
import { db, schema } from '../database';
import { Achievement, PlayerAchievement } from '../models/types';
import { PlayerService } from './PlayerService';
import { randomUUID } from 'crypto';

export const ACHIEVEMENTS: Record<string, Achievement> = {
  first_plant: { id: 'first_plant', name: 'Ngón Tay Xanh', emoji: '🌱', description: 'Trồng hạt giống đầu tiên của bạn.', secret: false, rarity: 'common', condition: { type: 'stat', target: 'plantsGrown', value: 1 }, reward: { coins: 100, xp: 20 } },
  harvest_10: { id: 'harvest_10', name: 'Người Làm Vườn Dày Dạn', emoji: '🌾', description: 'Thu hoạch 10 vụ mùa.', secret: false, rarity: 'common', condition: { type: 'stat', target: 'cropsHarvested', value: 10 }, reward: { coins: 400, xp: 75 } },
  harvest_100: { id: 'harvest_100', name: 'Bậc Thầy Trồng Trọt', emoji: '🏡', description: 'Thu hoạch 100 vụ mùa.', secret: false, rarity: 'uncommon', condition: { type: 'stat', target: 'cropsHarvested', value: 100 }, reward: { coins: 1500, xp: 300 } },
  explorer_1: { id: 'explorer_1', name: 'Kẻ Lang Thang', emoji: '🗺️', description: 'Khám phá 5 lần.', secret: false, rarity: 'common', condition: { type: 'stat', target: 'explorationCount', value: 5 }, reward: { coins: 250, xp: 50 } },
  explorer_50: { id: 'explorer_50', name: 'Nhà Thám Hiểm Dày Dạn', emoji: '🧭', description: 'Khám phá 50 lần.', secret: false, rarity: 'uncommon', condition: { type: 'stat', target: 'explorationCount', value: 50 }, reward: { coins: 1200, xp: 250 } },
  rich_1: { id: 'rich_1', name: 'Người Thu Gom Xu Trăng', emoji: '💰', description: 'Kiếm được 3000 xu.', secret: false, rarity: 'common', condition: { type: 'stat', target: 'coinsEarned', value: 3000 }, reward: { coins: 500, xp: 100 } },
  rich_2: { id: 'rich_2', name: 'Đại Gia Hoàng Hôn', emoji: '🤑', description: 'Kiếm được 40000 xu.', secret: false, rarity: 'rare', condition: { type: 'stat', target: 'coinsEarned', value: 40000 }, reward: { coins: 3000, xp: 500 } },
  pet_adopter: { id: 'pet_adopter', name: 'Cha/Mẹ Thú Cưng', emoji: '🐾', description: 'Nhận nuôi thú cưng đầu tiên.', secret: false, rarity: 'common', condition: { type: 'stat', target: 'petsOwned', value: 1 }, reward: { coins: 250, xp: 50, title: 'Cha/Mẹ Thú Cưng' } },
  wildlife_5: { id: 'wildlife_5', name: 'Nhà Quan Sát Sinh Vật', emoji: '🔭', description: 'Khám phá 5 loài sinh vật độc đáo.', secret: false, rarity: 'uncommon', condition: { type: 'stat', target: 'wildlifeFound', value: 5 }, reward: { coins: 800, xp: 200 } },
  quest_10: { id: 'quest_10', name: 'Bậc Thầy Nhiệm Vụ', emoji: '📜', description: 'Hoàn thành 10 nhiệm vụ.', secret: false, rarity: 'uncommon', condition: { type: 'stat', target: 'questsCompleted', value: 10 }, reward: { coins: 1200, xp: 300 } },
  secret_mutant: { id: 'secret_mutant', name: 'Người Thì Thầm Đột Biến', emoji: '✨', description: '???', secret: true, rarity: 'rare', condition: { type: 'event', target: 'mutant_harvest', value: 1 }, reward: { coins: 1500, xp: 400, title: 'Người Thì Thầm Đột Biến' } },
  secret_shadow: { id: 'secret_shadow', name: 'Người Chăm Bóng Tối', emoji: '🌑', description: '???', secret: true, rarity: 'legendary', condition: { type: 'plant', target: 'shadowbloom', value: 1 }, reward: { coins: 6000, xp: 1000, title: 'Người Chăm Bóng Tối' } },
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

    await db.insert(schema.playerAchievements).values({ id: randomUUID(), userId: playerId, playerId, achievementId, unlockedAt: new Date(), notified: false }); // userId mirrors playerId (legacy NOT NULL col)

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
