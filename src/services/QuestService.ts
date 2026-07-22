import { eq, and, inArray } from 'drizzle-orm';
import { db, schema } from '../database';
import { Quest, PlayerQuest, QuestObjective, QuestStatus } from '../models/types';
import { PlayerService } from './PlayerService';
import { InventoryService } from './InventoryService';
import { randomUUID } from 'crypto';

export const QUESTS: Record<string, Quest> = {
  first_harvest: {
    id: 'first_harvest', name: 'Vụ Mùa Đầu Tiên', type: 'main', rarity: 'common',
    description: 'Trồng và thu hoạch vụ mùa đầu tiên trong khu vườn.',
    objectives: [{ id: 'o1', description: 'Thu hoạch bất kỳ loại cây nào', type: 'harvest', target: 'any', required: 1, current: 0 }],
    rewards: { coins: 200, xp: 50, items: [{ itemId: 'seed_moonflower', quantity: 3 }] },
    prerequisites: [], timeLimit: null, minLevel: 1, npcGiver: null,
  },
  garden_apprentice: {
    id: 'garden_apprentice', name: 'Học Việc Làm Vườn', type: 'main', rarity: 'common',
    description: 'Trồng 5 loại cây khác nhau để học những điều cơ bản về khu vườn hoàng hôn.',
    objectives: [{ id: 'o1', description: 'Thu hoạch 5 vụ mùa bất kỳ', type: 'harvest', target: 'any', required: 5, current: 0 }],
    rewards: { coins: 600, xp: 150, items: [{ itemId: 'fertilizer', quantity: 5 }] },
    prerequisites: ['first_harvest'], timeLimit: null, minLevel: 2, npcGiver: null,
  },
  explorer_badge: {
    id: 'explorer_badge', name: 'Huy Hiệu Thám Hiểm', type: 'side', rarity: 'uncommon',
    description: 'Đặt chân đến 3 khu vực khác nhau trong thế giới hoàng hôn.',
    objectives: [{ id: 'o1', description: 'Khám phá 3 khu vực độc đáo', type: 'explore', target: 'unique_areas', required: 3, current: 0 }],
    rewards: { coins: 700, xp: 200 },
    prerequisites: [], timeLimit: null, minLevel: 3, npcGiver: null,
  },
  daily_harvest: {
    id: 'daily_harvest', name: 'Thu Hoạch Hằng Ngày', type: 'daily', rarity: 'common',
    description: 'Thu hoạch 3 vụ mùa hôm nay.',
    objectives: [{ id: 'o1', description: 'Thu hoạch 3 vụ mùa', type: 'harvest', target: 'any', required: 3, current: 0 }],
    rewards: { coins: 200, xp: 40 },
    prerequisites: [], timeLimit: 1440, minLevel: 1, npcGiver: null,
  },
  daily_explore: {
    id: 'daily_explore', name: 'Thám Hiểm Hằng Ngày', type: 'daily', rarity: 'common',
    description: 'Khám phá bất kỳ khu vực nào một lần hôm nay.',
    objectives: [{ id: 'o1', description: 'Khám phá một lần', type: 'explore', target: 'any', required: 1, current: 0 }],
    rewards: { coins: 160, xp: 30 },
    prerequisites: [], timeLimit: 1440, minLevel: 1, npcGiver: null,
  },
  moonstone_collector: {
    id: 'moonstone_collector', name: 'Người Thu Gom Đá Trăng', type: 'side', rarity: 'rare',
    description: 'Thu thập 5 viên đá mặt trăng qua các chuyến phiêu lưu.',
    objectives: [{ id: 'o1', description: 'Sở hữu 5 đá mặt trăng', type: 'collect', target: 'moonstone', required: 5, current: 0 }],
    rewards: { coins: 1500, xp: 400, items: [{ itemId: 'seed_crystalvine', quantity: 1 }] },
    prerequisites: [], timeLimit: null, minLevel: 5, npcGiver: null,
  },
  pet_lover: {
    id: 'pet_lover', name: 'Người Yêu Thú Cưng', type: 'side', rarity: 'uncommon',
    description: 'Nhận nuôi thú cưng đầu tiên và chơi với nó 3 lần.',
    objectives: [
      { id: 'o1', description: 'Nhận nuôi một thú cưng', type: 'collect', target: 'pet', required: 1, current: 0 },
    ],
    rewards: { coins: 500, xp: 150, items: [{ itemId: 'pet_food', quantity: 10 }] },
    prerequisites: [], timeLimit: null, minLevel: 3, npcGiver: null,
  },
  rich_merchant: {
    id: 'rich_merchant', name: 'Thương Nhân Phú Quý', type: 'side', rarity: 'rare',
    description: 'Kiếm tổng cộng 8000 xu bằng cách bán nông sản.',
    objectives: [{ id: 'o1', description: 'Bán hàng để kiếm 8000 xu', type: 'sell', target: 'coins', required: 8000, current: 0 }],
    rewards: { coins: 3000, xp: 500, items: [{ itemId: 'seed_shadowbloom', quantity: 1 }] },
    prerequisites: ['first_harvest'], timeLimit: null, minLevel: 5, npcGiver: null,
  },
};

export class QuestService {
  static getQuest(questId: string): Quest | null {
    return QUESTS[questId] ?? null;
  }

  static getAllQuests(): Quest[] {
    return Object.values(QUESTS);
  }

  static async getPlayerQuests(playerId: string): Promise<PlayerQuest[]> {
    const result = await db.select().from(schema.playerQuests).where(eq(schema.playerQuests.playerId, playerId));
    return result as unknown as PlayerQuest[];
  }

  static async getActiveQuests(playerId: string): Promise<PlayerQuest[]> {
    const result = await db.select().from(schema.playerQuests)
      .where(and(eq(schema.playerQuests.playerId, playerId), eq(schema.playerQuests.status, 'active')));
    return result as unknown as PlayerQuest[];
  }

  static async acceptQuest(playerId: string, questId: string): Promise<PlayerQuest> {
    const quest = QUESTS[questId];
    if (!quest) throw new Error('Không tìm thấy nhiệm vụ này.');

    const player = await PlayerService.getById(playerId);
    if (!player) throw new Error('Không tìm thấy người chơi.');
    if (player.level < quest.minLevel) throw new Error(`Bạn cần đạt cấp ${quest.minLevel} để nhận nhiệm vụ này.`);

    const existing = await db.select().from(schema.playerQuests)
      .where(and(eq(schema.playerQuests.playerId, playerId), eq(schema.playerQuests.questId, questId), inArray(schema.playerQuests.status, ['active', 'completed'])))
      .limit(1);
    if (existing.length > 0) throw new Error('Nhiệm vụ đã được nhận hoặc hoàn thành rồi.');

    const id = randomUUID();
    const expiresAt = quest.timeLimit ? new Date(Date.now() + quest.timeLimit * 60 * 1000) : null;
    await db.insert(schema.playerQuests).values({
      id, userId: playerId, playerId, questId, status: 'active',  // userId mirrors playerId (legacy NOT NULL col)
      objectives: quest.objectives as any,
      startedAt: new Date(), expiresAt,
    });

    return (await db.select().from(schema.playerQuests).where(eq(schema.playerQuests.id, id)).limit(1))[0] as unknown as PlayerQuest;
  }

  /** Update objective progress */
  static async updateObjective(playerId: string, type: QuestObjective['type'], target: string, amount = 1): Promise<void> {
    const active = await QuestService.getActiveQuests(playerId);
    for (const pq of active) {
      const quest = QUESTS[pq.questId];
      if (!quest) continue;
      let updated = false;
      // FIX: jsonb from DB may be returned as a raw string depending on driver config — parse safely
      const rawObjectives = pq.objectives;
      const parsedObjectives: QuestObjective[] = Array.isArray(rawObjectives)
        ? rawObjectives
        : JSON.parse(rawObjectives as unknown as string);
      const objectives = parsedObjectives.map((obj) => {
        if (obj.type === type && (obj.target === target || obj.target === 'any') && obj.current < obj.required) {
          updated = true;
          return { ...obj, current: Math.min(obj.required, obj.current + amount) };
        }
        return obj;
      });
      if (updated) {
        await db.update(schema.playerQuests).set({ objectives: objectives as any }).where(eq(schema.playerQuests.id, pq.id));
        const allDone = objectives.every((o) => o.current >= o.required);
        if (allDone) await QuestService.completeQuest(playerId, pq.id);
      }
    }
  }

  static async completeQuest(playerId: string, playerQuestId: string): Promise<Quest> {
    const pq = (await db.select().from(schema.playerQuests).where(eq(schema.playerQuests.id, playerQuestId)).limit(1))[0] as unknown as PlayerQuest;
    if (!pq) throw new Error('Không tìm thấy nhiệm vụ của người chơi.');

    const quest = QUESTS[pq.questId];
    if (!quest) throw new Error('Không tìm thấy định nghĩa nhiệm vụ.');

    await db.update(schema.playerQuests).set({ status: 'completed', completedAt: new Date() }).where(eq(schema.playerQuests.id, playerQuestId));

    await PlayerService.updateCoins(playerId, quest.rewards.coins);
    await PlayerService.addXp(playerId, quest.rewards.xp);
    if (quest.rewards.items) {
      for (const item of quest.rewards.items) await InventoryService.addItem(playerId, item.itemId, item.quantity);
    }
    if (quest.rewards.reputationBonus) await PlayerService.addReputation(playerId, quest.rewards.reputationBonus);
    await PlayerService.incrementStat(playerId, 'questsCompleted');

    // Check achievements immediately after quest completion
    const { AchievementService } = await import('./AchievementService');
    await AchievementService.checkStatAchievements(playerId);

    return quest;
  }

  /** Reset completed daily quests so they can be re-accepted next day */
  static async resetDailyQuests(playerId: string): Promise<void> {
    const dailyQuestIds = Object.values(QUESTS)
      .filter((q) => q.type === 'daily')
      .map((q) => q.id);
    if (!dailyQuestIds.length) return;
    // Delete completed daily quests — they'll re-appear as available tomorrow
    for (const questId of dailyQuestIds) {
      await db.delete(schema.playerQuests).where(
        and(
          eq(schema.playerQuests.playerId, playerId),
          eq(schema.playerQuests.questId, questId),
          eq(schema.playerQuests.status, 'completed'),
        ),
      );
    }
  }

  static async getAvailableQuests(playerId: string): Promise<Quest[]> {
    const player = await PlayerService.getById(playerId);
    if (!player) return [];
    const completed = new Set((await QuestService.getPlayerQuests(playerId)).filter((q) => q.status === 'completed').map((q) => q.questId));
    const active = new Set((await QuestService.getActiveQuests(playerId)).map((q) => q.questId));

    return Object.values(QUESTS).filter((q) => {
      if (active.has(q.id)) return false;
      if (q.type !== 'daily' && completed.has(q.id)) return false;
      if (player.level < q.minLevel) return false;
      if (q.prerequisites.some((p) => !completed.has(p))) return false;
      return true;
    });
  }
}
