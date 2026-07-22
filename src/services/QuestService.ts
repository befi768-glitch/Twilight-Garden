import { eq, and, inArray } from 'drizzle-orm';
import { db, schema } from '../database';
import { Quest, PlayerQuest, QuestObjective, QuestStatus } from '../models/types';
import { PlayerService } from './PlayerService';
import { InventoryService } from './InventoryService';
import { randomUUID } from 'crypto';

export const QUESTS: Record<string, Quest> = {
  first_harvest: {
    id: 'first_harvest', name: 'First Harvest', type: 'main', rarity: 'common',
    description: 'Plant and harvest your first crop from the garden.',
    objectives: [{ id: 'o1', description: 'Harvest any crop', type: 'harvest', target: 'any', required: 1, current: 0 }],
    rewards: { coins: 100, xp: 50, items: [{ itemId: 'seed_moonflower', quantity: 3 }] },
    prerequisites: [], timeLimit: null, minLevel: 1, npcGiver: null,
  },
  garden_apprentice: {
    id: 'garden_apprentice', name: 'Garden Apprentice', type: 'main', rarity: 'common',
    description: 'Grow 5 different plants to learn the basics of the twilight garden.',
    objectives: [{ id: 'o1', description: 'Harvest 5 crops of any type', type: 'harvest', target: 'any', required: 5, current: 0 }],
    rewards: { coins: 250, xp: 150, items: [{ itemId: 'fertilizer', quantity: 5 }] },
    prerequisites: ['first_harvest'], timeLimit: null, minLevel: 2, npcGiver: null,
  },
  explorer_badge: {
    id: 'explorer_badge', name: 'Explorer Badge', type: 'side', rarity: 'uncommon',
    description: 'Venture into 3 different areas of the twilight world.',
    objectives: [{ id: 'o1', description: 'Explore 3 unique areas', type: 'explore', target: 'unique_areas', required: 3, current: 0 }],
    rewards: { coins: 300, xp: 200 },
    prerequisites: [], timeLimit: null, minLevel: 3, npcGiver: null,
  },
  daily_harvest: {
    id: 'daily_harvest', name: 'Daily Harvest', type: 'daily', rarity: 'common',
    description: 'Harvest 3 crops today.',
    objectives: [{ id: 'o1', description: 'Harvest 3 crops', type: 'harvest', target: 'any', required: 3, current: 0 }],
    rewards: { coins: 80, xp: 40 },
    prerequisites: [], timeLimit: 1440, minLevel: 1, npcGiver: null,
  },
  daily_explore: {
    id: 'daily_explore', name: 'Daily Expedition', type: 'daily', rarity: 'common',
    description: 'Explore any area once today.',
    objectives: [{ id: 'o1', description: 'Explore once', type: 'explore', target: 'any', required: 1, current: 0 }],
    rewards: { coins: 60, xp: 30 },
    prerequisites: [], timeLimit: 1440, minLevel: 1, npcGiver: null,
  },
  moonstone_collector: {
    id: 'moonstone_collector', name: 'Moonstone Collector', type: 'side', rarity: 'rare',
    description: 'Collect 5 moonstones from your adventures.',
    objectives: [{ id: 'o1', description: 'Own 5 moonstones', type: 'collect', target: 'moonstone', required: 5, current: 0 }],
    rewards: { coins: 500, xp: 400, items: [{ itemId: 'seed_crystalvine', quantity: 1 }] },
    prerequisites: [], timeLimit: null, minLevel: 5, npcGiver: null,
  },
  pet_lover: {
    id: 'pet_lover', name: 'Pet Lover', type: 'side', rarity: 'uncommon',
    description: 'Adopt your first pet and play with it 3 times.',
    objectives: [
      { id: 'o1', description: 'Adopt a pet', type: 'collect', target: 'pet', required: 1, current: 0 },
    ],
    rewards: { coins: 200, xp: 150, items: [{ itemId: 'pet_food', quantity: 10 }] },
    prerequisites: [], timeLimit: null, minLevel: 3, npcGiver: null,
  },
  rich_merchant: {
    id: 'rich_merchant', name: 'Rich Merchant', type: 'side', rarity: 'rare',
    description: 'Earn 2000 mooncoins total through selling crops.',
    objectives: [{ id: 'o1', description: 'Sell items to earn 2000 coins', type: 'sell', target: 'coins', required: 2000, current: 0 }],
    rewards: { coins: 1000, xp: 500, items: [{ itemId: 'seed_shadowbloom', quantity: 1 }] },
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
    if (!quest) throw new Error('Quest not found');

    const player = await PlayerService.getById(playerId);
    if (!player) throw new Error('Player not found');
    if (player.level < quest.minLevel) throw new Error(`You need to be level ${quest.minLevel} to accept this quest`);

    // Check if already active or completed
    const existing = await db.select().from(schema.playerQuests)
      .where(and(eq(schema.playerQuests.playerId, playerId), eq(schema.playerQuests.questId, questId), inArray(schema.playerQuests.status, ['active', 'completed'])))
      .limit(1);
    if (existing.length > 0) throw new Error('Quest already active or completed');

    const id = randomUUID();
    const expiresAt = quest.timeLimit ? new Date(Date.now() + quest.timeLimit * 60 * 1000) : null;
    await db.insert(schema.playerQuests).values({
      id, playerId, questId, status: 'active',
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
      const objectives = pq.objectives.map((obj) => {
        if (obj.type === type && (obj.target === target || obj.target === 'any') && obj.current < obj.required) {
          updated = true;
          return { ...obj, current: Math.min(obj.required, obj.current + amount) };
        }
        return obj;
      });
      if (updated) {
        await db.update(schema.playerQuests).set({ objectives: objectives as any }).where(eq(schema.playerQuests.id, pq.id));
        // Check completion
        const allDone = objectives.every((o) => o.current >= o.required);
        if (allDone) await QuestService.completeQuest(playerId, pq.id);
      }
    }
  }

  static async completeQuest(playerId: string, playerQuestId: string): Promise<Quest> {
    const pq = (await db.select().from(schema.playerQuests).where(eq(schema.playerQuests.id, playerQuestId)).limit(1))[0] as unknown as PlayerQuest;
    if (!pq) throw new Error('Player quest not found');

    const quest = QUESTS[pq.questId];
    if (!quest) throw new Error('Quest definition not found');

    await db.update(schema.playerQuests).set({ status: 'completed', completedAt: new Date() }).where(eq(schema.playerQuests.id, playerQuestId));

    // Give rewards
    await PlayerService.updateCoins(playerId, quest.rewards.coins);
    await PlayerService.addXp(playerId, quest.rewards.xp);
    if (quest.rewards.items) {
      for (const item of quest.rewards.items) await InventoryService.addItem(playerId, item.itemId, item.quantity);
    }
    if (quest.rewards.reputationBonus) await PlayerService.addReputation(playerId, quest.rewards.reputationBonus);
    await PlayerService.incrementStat(playerId, 'questsCompleted');

    return quest;
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
