import { eq, and, lt } from 'drizzle-orm';
import { db, schema } from '../database';
import { WorldEvent, ActiveWorldEvent } from '../models/types';
import { chance, randomFrom } from '../utils/helpers';
import { NewsService } from './NewsService';
import { randomUUID } from 'crypto';

export const WORLD_EVENTS: Record<string, WorldEvent> = {
  harvest_festival: {
    id: 'harvest_festival', name: 'Lễ Hội Mùa Gặt', emoji: '🎪', type: 'festival',
    description: 'Cả khu vườn ăn mừng vụ mùa bội thu! Nông sản bán được giá gấp đôi và hạt giống hiếm xuất hiện trong cửa hàng.',
    durationHours: 6, rarity: 'uncommon',
    effects: [{ type: 'price_change', target: 'all_crops', multiplier: 2 }],
    participantRewards: { coins: 200, xp: 150 },
  },
  moonstone_shower: {
    id: 'moonstone_shower', name: 'Mưa Đá Trăng', emoji: '🌠', type: 'mystery',
    description: 'Đá mặt trăng rơi từ bầu trời! Tìm thêm trong các chuyến khám phá.',
    durationHours: 3, rarity: 'rare',
    effects: [{ type: 'drop_rate', target: 'moonstone', multiplier: 3 }],
    participantRewards: { coins: 100, xp: 100, items: [{ itemId: 'moonstone', quantity: 2 }] },
  },
  great_storm: {
    id: 'great_storm', name: 'Đại Phong Ba', emoji: '⛈️', type: 'storm',
    description: 'Một cơn bão ma pháp dữ dội quét qua khu vườn. Sinh vật hiếm xuất hiện và cây trồng phát triển nhanh hơn.',
    durationHours: 4, rarity: 'uncommon',
    effects: [{ type: 'growth_rate', target: 'all', multiplier: 1.5 }, { type: 'spawn_rate', target: 'shadow_wolf', multiplier: 5 }],
    participantRewards: { coins: 150, xp: 120 },
  },
  shadow_invasion: {
    id: 'shadow_invasion', name: 'Xâm Lăng Bóng Tối', emoji: '🌑', type: 'invasion',
    description: 'Sinh vật bóng tối xâm chiếm khu vườn! Hãy đẩy lùi chúng để bảo vệ mùa màng.',
    durationHours: 2, rarity: 'rare',
    effects: [{ type: 'drop_rate', target: 'ancient_relic', multiplier: 4 }],
    participantRewards: { coins: 300, xp: 200, items: [{ itemId: 'ancient_relic', quantity: 1 }] },
  },
  merchant_caravan: {
    id: 'merchant_caravan', name: 'Đoàn Thương Nhân', emoji: '🛒', type: 'market',
    description: 'Một đoàn thương nhân lữ hành đến với hàng hóa ngoại quốc, giá giảm đặc biệt!',
    durationHours: 5, rarity: 'common',
    effects: [{ type: 'price_change', target: 'shop', multiplier: 0.7 }],
    participantRewards: { coins: 80, xp: 50 },
  },
};

export class WorldEventService {
  static async getActiveEvent(guildId: string): Promise<ActiveWorldEvent | null> {
    const result = await db.select().from(schema.activeWorldEvents)
      .where(and(eq(schema.activeWorldEvents.guildId, guildId), eq(schema.activeWorldEvents.completed, false))).limit(1);
    return result.length > 0 ? (result[0] as unknown as ActiveWorldEvent) : null;
  }

  static async startEvent(guildId: string, eventId: string): Promise<ActiveWorldEvent> {
    const event = WORLD_EVENTS[eventId];
    if (!event) throw new Error('Không tìm thấy sự kiện này.');

    const id = randomUUID();
    const endsAt = new Date(Date.now() + event.durationHours * 3600 * 1000);
    await db.insert(schema.activeWorldEvents).values({ id, guildId, eventId, startedAt: new Date(), endsAt, participants: [], completed: false });

    await NewsService.postNews(guildId, `${event.emoji} ${event.name} Đã Bắt Đầu!`, event.description, 'world_event', 3, event.durationHours + 1);

    return (await WorldEventService.getActiveEvent(guildId))!;
  }

  /** Randomly trigger a world event for a guild */
  static async maybeSpawnEvent(guildId: string): Promise<WorldEvent | null> {
    const active = await WorldEventService.getActiveEvent(guildId);
    if (active) return null;
    if (!chance(0.05)) return null;

    const candidates = Object.values(WORLD_EVENTS);
    const event = randomFrom(candidates);
    await WorldEventService.startEvent(guildId, event.id);
    return event;
  }

  static async participate(guildId: string, playerId: string): Promise<{ event: WorldEvent; alreadyIn: boolean }> {
    const active = await WorldEventService.getActiveEvent(guildId);
    if (!active) throw new Error('Hiện không có sự kiện thế giới nào đang diễn ra.');

    const event = WORLD_EVENTS[active.eventId];
    const participants: string[] = active.participants as string[];

    if (participants.includes(playerId)) return { event, alreadyIn: true };

    participants.push(playerId);
    await db.update(schema.activeWorldEvents).set({ participants: participants as any }).where(eq(schema.activeWorldEvents.id, active.id));

    return { event, alreadyIn: false };
  }

  static async resolveExpiredEvents(): Promise<void> {
    const expired = await db.select().from(schema.activeWorldEvents)
      .where(and(eq(schema.activeWorldEvents.completed, false), lt(schema.activeWorldEvents.endsAt, new Date())));

    for (const evt of expired) {
      const event = WORLD_EVENTS[evt.eventId];
      const participants: string[] = evt.participants as string[];

      if (event && participants.length > 0) {
        const { PlayerService } = await import('./PlayerService');
        const { InventoryService } = await import('./InventoryService');
        for (const pid of participants) {
          await PlayerService.updateCoins(pid, event.participantRewards.coins);
          await PlayerService.addXp(pid, event.participantRewards.xp);
          if (event.participantRewards.items) {
            for (const item of event.participantRewards.items) await InventoryService.addItem(pid, item.itemId, item.quantity);
          }
        }
      }
      await db.update(schema.activeWorldEvents).set({ completed: true }).where(eq(schema.activeWorldEvents.id, evt.id));
    }
  }

  static getAllEvents(): WorldEvent[] {
    return Object.values(WORLD_EVENTS);
  }
}
