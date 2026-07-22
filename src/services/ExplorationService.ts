import { db, schema } from '../database';
import { Area, ExplorationEvent, ExplorationReward, AreaType } from '../models/types';
import { randomFrom, chance, randomInt, roll } from '../utils/helpers';
import { PlayerService } from './PlayerService';
import { InventoryService } from './InventoryService';
import { randomUUID } from 'crypto';

export const AREAS: Record<AreaType, Area> = {
  village: {
    id: 'village', name: 'Làng Hoàng Hôn', emoji: '🏘️',
    description: 'Điểm xuất phát. Những ngôi nhà nhỏ ấm cúng, chợ nhộn nhịp và những người bạn thân thiện.',
    minLevel: 1, energyCost: 5,
    events: [
      { id: 'market_deal', name: 'Ưu Đãi Chợ', description: 'Một thương nhân đề nghị giảm giá đặc biệt.', probability: 0.3, type: 'find', reward: { coins: randomInt(30, 90) } },
      { id: 'lost_cat', name: 'Mèo Lạc', description: 'Bạn giúp tìm lại con mèo bị lạc. Chủ nhân rất biết ơn.', probability: 0.2, type: 'npc', reward: { coins: 70, xp: 20 } },
      { id: 'festival_scraps', name: 'Đồ Lễ Hội', description: 'Ai đó đánh rơi đồ lễ hội.', probability: 0.15, type: 'find', reward: { items: [{ itemId: 'healing_herb', quantity: 2 }] } },
    ],
    monsters: [], items: ['healing_herb', 'seed_twilight_rose'],
  },
  forest: {
    id: 'forest', name: 'Rừng Hoàng Hôn', emoji: '🌲',
    description: 'Những cây cổ thụ thì thầm bí mật. Sinh vật hoang dã tự do đi lại.',
    minLevel: 3, energyCost: 15,
    events: [
      { id: 'herb_patch', name: 'Vườn Thảo Dược', description: 'Bạn tìm thấy bãi thảo dược chữa lành ẩn sâu trong rừng.', probability: 0.3, type: 'find', reward: { items: [{ itemId: 'healing_herb', quantity: 3 }], xp: 15 } },
      { id: 'wolf_encounter', name: 'Gặp Sói Bóng Tối', description: 'Một con sói bóng tối chặn đường bạn.', probability: 0.2, type: 'combat', reward: { coins: 110, xp: 30 } },
      { id: 'ancient_tree', name: 'Cây Cổ Thụ', description: 'Bạn phát hiện cây cổ thụ lâu đời hơn ký ức. Nó rụng xuống một hạt giống lạ.', probability: 0.1, type: 'mystery', reward: { items: [{ itemId: 'seed_moonflower', quantity: 1 }], xp: 50 } },
      { id: 'mushroom_grove', name: 'Rừng Nấm', description: 'Một vòng tròn nấm mộng mơ kỳ diệu.', probability: 0.2, type: 'find', reward: { items: [{ itemId: 'seed_dreamcap', quantity: 2 }] } },
    ],
    monsters: ['sói', 'lợn rừng'], items: ['healing_herb', 'seed_moonflower', 'seed_dreamcap'],
  },
  lake: {
    id: 'lake', name: 'Hồ Gương', emoji: '🌊',
    description: 'Mặt hồ phẳng lặng phản chiếu hoàn hảo bầu trời hoàng hôn.',
    minLevel: 5, energyCost: 20,
    events: [
      { id: 'moonstone_shore', name: 'Bãi Đá Trăng', description: 'Bạn tìm thấy đá mặt trăng dọc theo bờ hồ.', probability: 0.2, type: 'find', reward: { items: [{ itemId: 'moonstone', quantity: 1 }], xp: 40 } },
      { id: 'spirit_fish', name: 'Cá Linh Hồn', description: 'Một con cá phát sáng nhảy lên và thả rơi một viên đá quý.', probability: 0.1, type: 'mystery', reward: { items: [{ itemId: 'moonstone', quantity: 2 }], xp: 60 } },
      { id: 'fisherman_tip', name: 'Bí Mật Ngư Dân', description: 'Một ngư dân già chia sẻ bí mật của vùng hồ.', probability: 0.25, type: 'npc', reward: { coins: 130, xp: 25 } },
    ],
    monsters: [], items: ['moonstone'],
  },
  mountain: {
    id: 'mountain', name: 'Đỉnh Sao Băng', emoji: '⛰️',
    description: 'Điểm cao nhất trong thế giới vườn. Những ngôi sao dường như trong tầm với.',
    minLevel: 10, energyCost: 30,
    events: [
      { id: 'crystal_vein', name: 'Mạch Pha Lê', description: 'Bạn khai thác được dây pha lê từ vách đá.', probability: 0.15, type: 'find', reward: { items: [{ itemId: 'crop_crystalvine', quantity: 1 }], xp: 80 } },
      { id: 'starfall', name: 'Sao Băng Rơi', description: 'Một ngôi sao rơi xuống gần đây — bạn nhặt được mảnh vỡ.', probability: 0.08, type: 'mystery', reward: { items: [{ itemId: 'moonstone', quantity: 3 }], xp: 120 } },
      { id: 'mountain_eagle', name: 'Đại Bàng Núi', description: 'Một con đại bàng thả mồi — chiến lợi phẩm tốt.', probability: 0.2, type: 'combat', reward: { coins: 220, xp: 50 } },
    ],
    monsters: ['đại bàng', 'thạch thần'], items: ['moonstone', 'ancient_relic'],
  },
  cave: {
    id: 'cave', name: 'Hang Đá Phát Quang', emoji: '🕳️',
    description: 'Nấm phát quang thắp sáng những đường hầm bằng ánh sáng ma quái.',
    minLevel: 8, energyCost: 25,
    events: [
      { id: 'treasure_chest', name: 'Rương Kho Báu', description: 'Một rương phủ bụi! Bên trong: xu và cổ vật.', probability: 0.1, type: 'treasure', reward: { coins: 420, items: [{ itemId: 'ancient_relic', quantity: 1 }], xp: 100 } },
      { id: 'cave_bat', name: 'Đàn Dơi Hang', description: 'Đàn dơi làm tán loạn đồ đạc — bạn thu lại được ít xu.', probability: 0.25, type: 'combat', reward: { coins: 85, xp: 20 } },
      { id: 'hidden_passage', name: 'Hành Lang Bí Mật', description: 'Bạn tìm thấy lối đi đến buồng sâu hơn.', probability: 0.08, type: 'mystery', reward: { items: [{ itemId: 'treasure_map', quantity: 1 }], xp: 150 } },
    ],
    monsters: ['dơi', 'nhện hang'], items: ['ancient_relic', 'treasure_map'],
  },
  ruins: {
    id: 'ruins', name: 'Phế Tích Bị Lãng Quên', emoji: '🏚️',
    description: 'Những cột trụ đổ nát của một nền văn minh đã bị thời gian xóa nhòa.',
    minLevel: 15, energyCost: 35,
    events: [
      { id: 'relic_dig', name: 'Khai Quật Cổ Vật', description: 'Bạn khai quật được cổ vật cổ đại từ đống đổ nát.', probability: 0.2, type: 'find', reward: { items: [{ itemId: 'ancient_relic', quantity: 2 }], xp: 100 } },
      { id: 'ghost_encounter', name: 'Gặp Hồn Ma', description: 'Một hồn ma thì thầm những kiến thức đã bị quên lãng.', probability: 0.1, type: 'mystery', reward: { xp: 200, coins: 140 } },
      { id: 'shadow_trap', name: 'Bẫy Bóng Tối', description: 'Một bẫy ma pháp kích hoạt — nhưng bạn né được và tìm thấy phần thưởng.', probability: 0.15, type: 'mystery', reward: { items: [{ itemId: 'seed_shadowbloom', quantity: 1 }], xp: 250 } },
    ],
    monsters: ['xương khô', 'hồn ma'], items: ['ancient_relic', 'seed_shadowbloom'],
  },
  meadow: {
    id: 'meadow', name: 'Đồng Cỏ Ánh Sao', emoji: '🌸',
    description: 'Đồng cỏ bao la nơi hoa hoàng hôn nở quanh năm.',
    minLevel: 2, energyCost: 10,
    events: [
      { id: 'flower_find', name: 'Tìm Hoa Quý', description: 'Những loài hoa hiếm mọc hoang ở đây.', probability: 0.35, type: 'find', reward: { items: [{ itemId: 'seed_starbloom', quantity: 1 }], xp: 25 } },
      { id: 'butterfly_guide', name: 'Bướm Dẫn Đường', description: 'Một con bướm phát sáng dẫn bạn đến bãi hạt giống quý hiếm.', probability: 0.15, type: 'mystery', reward: { items: [{ itemId: 'seed_crystalvine', quantity: 1 }], xp: 60 } },
      { id: 'peaceful_rest', name: 'Nghỉ Ngơi Bình Yên', description: 'Bạn nghỉ ngơi trong đồng cỏ và cảm thấy thư thái.', probability: 0.4, type: 'find', reward: { xp: 20, coins: 30 } },
    ],
    monsters: [], items: ['seed_starbloom', 'seed_sunpetal'],
  },
  swamp: {
    id: 'swamp', name: 'Đầm Lầy Mờ Ảo', emoji: '🌿',
    description: 'Đầm lầy mờ ảo dày đặc sương mù và những loài thực vật kỳ lạ.',
    minLevel: 12, energyCost: 28,
    events: [
      { id: 'swamp_herb', name: 'Thảo Dược Đầm Lầy', description: 'Những loại thảo dược hiếm mọc ven bờ nước.', probability: 0.25, type: 'find', reward: { items: [{ itemId: 'healing_herb', quantity: 5 }], xp: 50 } },
      { id: 'will_o_wisp', name: 'Đom Đóm Ma', description: 'Bạn theo đom đóm — nó dẫn đến một viên đá mặt trăng.', probability: 0.12, type: 'mystery', reward: { items: [{ itemId: 'moonstone', quantity: 2 }], xp: 80 } },
      { id: 'swamp_ambush', name: 'Phục Kích Đầm Lầy', description: 'Có gì đó ẩn nấp trong bùn. Bạn đánh đuổi nó đi.', probability: 0.2, type: 'combat', reward: { coins: 160, xp: 45 } },
    ],
    monsters: ['quái vật đầm', 'cá sấu'], items: ['healing_herb', 'moonstone'],
  },
};

export class ExplorationService {
  static getArea(areaId: AreaType): Area | null {
    return AREAS[areaId] ?? null;
  }

  static getAllAreas(): Area[] {
    return Object.values(AREAS);
  }

  static async explore(playerId: string, areaId: AreaType, worldState: { currentSeason: string; currentWeather: string; timeOfDay: string }): Promise<{
    event: ExplorationEvent;
    reward: ExplorationReward;
    message: string;
  }> {
    const area = AREAS[areaId];
    if (!area) throw new Error('Khu vực không tồn tại.');

    const player = await PlayerService.getById(playerId);
    if (!player) throw new Error('Không tìm thấy người chơi.');
    if (player.level < area.minLevel) throw new Error(`Bạn cần đạt cấp ${area.minLevel} để khám phá ${area.name}.`);

    const energyOk = await PlayerService.useEnergy(playerId, area.energyCost);
    if (!energyOk) throw new Error(`Không đủ năng lượng. Cần ${area.energyCost} ⚡.`);

    await PlayerService.moveToArea(playerId, areaId);

    const event = ExplorationService.pickEvent(area, worldState);
    const reward = { ...event.reward };

    if (worldState.currentWeather === 'magical') {
      if (reward.coins) reward.coins = Math.ceil(reward.coins * 1.5);
      if (reward.xp) reward.xp = Math.ceil(reward.xp * 1.3);
    }

    if (reward.coins) await PlayerService.updateCoins(playerId, reward.coins);
    if (reward.xp) await PlayerService.addXp(playerId, reward.xp);
    if (reward.items) {
      for (const item of reward.items) await InventoryService.addItem(playerId, item.itemId, item.quantity);
    }

    await db.insert(schema.explorationLogs).values({
      id: randomUUID(), playerId, area: areaId,
      event: event.name, result: event.description,
      reward: reward as any,
      exploredAt: new Date(),
    });

    await PlayerService.incrementStat(playerId, 'explorationCount');

    let message = `**${event.name}**\n${event.description}`;
    const parts: string[] = [];
    if (reward.coins) parts.push(`🌙 **${reward.coins}** xu`);
    if (reward.xp) parts.push(`✨ **${reward.xp}** XP`);
    if (reward.items) {
      const { ITEMS } = await import('./EconomyService');
      for (const it of reward.items) {
        const def = ITEMS[it.itemId];
        parts.push(`📦 ${it.quantity}x *${def?.name ?? it.itemId.replace(/_/g, ' ')}*`);
      }
    }
    if (parts.length) message += `\n\n**Phần thưởng:** ${parts.join(' · ')}`;

    return { event, reward, message };
  }

  private static pickEvent(area: Area, worldState: { currentWeather: string; timeOfDay: string }): ExplorationEvent {
    const total = area.events.reduce((s, e) => s + e.probability, 0);
    let r = Math.random() * total;
    for (const ev of area.events) {
      r -= ev.probability;
      if (r <= 0) return ev;
    }
    return area.events[area.events.length - 1];
  }

  static async getExplorationHistory(playerId: string, limit = 10): Promise<typeof schema.explorationLogs.$inferSelect[]> {
    const { desc } = await import('drizzle-orm');
    const { eq } = await import('drizzle-orm');
    return db.select().from(schema.explorationLogs)
      .where(eq(schema.explorationLogs.playerId, playerId))
      .orderBy(desc(schema.explorationLogs.exploredAt))
      .limit(limit);
  }
}
