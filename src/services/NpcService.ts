import { eq, and } from 'drizzle-orm';
import { db, schema } from '../database';
import { Npc, PlayerNpcRelation, NpcRelation } from '../models/types';
import { PlayerService } from './PlayerService';
import { InventoryService } from './InventoryService';
import { randomFrom, randomInt, clamp } from '../utils/helpers';
import { randomUUID } from 'crypto';

export const NPCS: Record<string, Npc> = {
  merchant_elara: {
    id: 'merchant_elara', name: 'Elara', emoji: '🧑‍🌾', title: 'Thương Nhân Hoàng Hôn',
    description: 'Một thương nhân vui vẻ đi lại giữa các làng để bán hàng hiếm.',
    location: 'village', maxRelation: 100,
    schedule: [
      { timeOfDay: 'morning', location: 'village', activity: 'Đang bày hàng lên quầy.' },
      { timeOfDay: 'afternoon', location: 'meadow', activity: 'Hái hoa dại.' },
      { timeOfDay: 'evening', location: 'village', activity: 'Đang đếm tiền thu được.' },
    ],
    personality: ['vui vẻ', 'khôn ngoan', 'hào phóng'],
    dialogues: [
      { id: 'd1', trigger: 'greet', text: 'Chào khách lữ hành! Hôm nay ghé thăm vì chuyện gì vậy? Ta có vài món hàng đẹp nếu bạn quan tâm đó.', options: [{ text: 'Bạn có gì bán không?', response: 'Hạt giống, thuốc và đôi khi cả đồ hiếm. Nhìn thử đi!' }] },
      { id: 'd2', trigger: 'friend', text: 'A, khách quen của ta! Ta đã để dành thứ gì đó đặc biệt cho bạn rồi.', options: [], relationRequired: 50 },
    ],
    trades: [
      { give: { itemId: 'crop_moonflower', quantity: 3 }, receive: { itemId: 'seed_starbloom', quantity: 1 }, stockPerDay: 2, relationRequired: 20 },
      { give: { itemId: 'moonstone', quantity: 1 }, receive: { coins: 200 }, stockPerDay: 5, relationRequired: 0 },
    ],
    questIds: [],
  },
  herbalist_moss: {
    id: 'herbalist_moss', name: 'Lão Rêu', emoji: '🧙', title: 'Thảo Dược Sư Rừng',
    description: 'Một thảo dược sư già khôn ngoan biết bí mật của mọi loài cây trong khu vườn hoàng hôn.',
    location: 'forest', maxRelation: 100,
    schedule: [
      { timeOfDay: 'dawn', location: 'forest', activity: 'Thu thập sương mai.' },
      { timeOfDay: 'morning', location: 'forest', activity: 'Chăm sóc thảo dược rừng.' },
      { timeOfDay: 'midnight', location: 'cave', activity: 'Nghiên cứu nấm phát quang.' },
    ],
    personality: ['khôn ngoan', 'huyền bí', 'kiên nhẫn'],
    dialogues: [
      { id: 'd1', trigger: 'greet', text: 'Hmm. Lại thêm một kẻ tìm kiếm sự khôn ngoan của khu vườn. Ngươi muốn biết điều gì?', options: [{ text: 'Kể tôi nghe về cây trồng.', response: 'Mỗi loài cây đều mang một mảnh tâm hồn của thế giới. Chăm sóc chúng thành tâm, chúng sẽ đền đáp xứng đáng.' }] },
      { id: 'd2', trigger: 'deep', text: 'Ngươi đã lớn lên nhiều rồi, người làm vườn trẻ. Để ta chia sẻ bí mật về hoa bóng tối...', options: [], relationRequired: 70 },
    ],
    trades: [
      { give: { itemId: 'crop_dreamcap', quantity: 5 }, receive: { itemId: 'growth_potion', quantity: 1 }, stockPerDay: 3, relationRequired: 0 },
      { give: { coins: 500 }, receive: { itemId: 'seed_shadowbloom', quantity: 1 }, stockPerDay: 1, relationRequired: 60 },
    ],
    questIds: ['moonstone_collector'],
  },
  wanderer_kira: {
    id: 'wanderer_kira', name: 'Kira', emoji: '🧝', title: 'Nhà Thám Hiểm Lang Thang',
    description: 'Một nhà thám hiểm bồn chồn đã đặt chân đến mọi góc của thế giới vườn.',
    location: 'meadow', maxRelation: 100,
    schedule: [
      { timeOfDay: 'morning', location: 'meadow', activity: 'Phác thảo phong cảnh.' },
      { timeOfDay: 'afternoon', location: 'mountain', activity: 'Leo núi.' },
      { timeOfDay: 'evening', location: 'lake', activity: 'Ngắm bóng phản chiếu trên hồ.' },
    ],
    personality: ['phiêu lưu', 'tò mò', 'tự do'],
    dialogues: [
      { id: 'd1', trigger: 'greet', text: 'Ê, chào! Mình vừa trở về từ ngọn núi. Cảnh từ Đỉnh Sao Băng nhìn xuống thật tuyệt vời!', options: [{ text: 'Kể tôi nghe chuyến đi của bạn.', response: 'Mình đã lập bản đồ mọi khu vực ở đây rồi. Phế tích là nơi mình thích nhất — bí ẩn ở khắp mọi nơi.' }] },
    ],
    trades: [
      { give: { itemId: 'ancient_relic', quantity: 2 }, receive: { itemId: 'treasure_map', quantity: 1 }, stockPerDay: 2, relationRequired: 30 },
    ],
    questIds: ['explorer_badge'],
  },
  oracle_nyx: {
    id: 'oracle_nyx', name: 'Nyx', emoji: '🌙', title: 'Tiên Tri Hoàng Hôn',
    description: 'Vị tiên tri bí ẩn nói bằng câu đố và nhìn thấy tương lai của khu vườn.',
    location: 'ruins', maxRelation: 80,
    schedule: [
      { timeOfDay: 'midnight', location: 'ruins', activity: 'Giao tiếp với hư vô.' },
      { timeOfDay: 'night', location: 'ruins', activity: 'Đọc hình dạng các vì sao.' },
    ],
    personality: ['bí ẩn', 'toàn tri', 'thờ ơ'],
    dialogues: [
      { id: 'd1', trigger: 'greet', text: '...Ngươi đến tìm câu trả lời. Những vì sao đã nói về hành trình của ngươi — một khu vườn nảy sinh từ hạt giống hoàng hôn và những giấc mơ ánh trăng.', options: [{ text: 'Tương lai của tôi ra sao?', response: 'Ta thấy hoa trăng nở trong ánh sáng pha lê. Hãy chăm sóc khu vườn của ngươi, và bóng tối sẽ ban thưởng cho ngươi.' }] },
      { id: 'd2', trigger: 'secret', text: 'Hãy tìm hoa bóng tối tại phế tích vào lúc nửa đêm trong cơn bão. Thế giới sẽ ghi nhớ khám phá của ngươi.', options: [], relationRequired: 60 },
    ],
    trades: [
      { give: { itemId: 'moonstone', quantity: 5 }, receive: { itemId: 'seed_crystalvine', quantity: 1 }, stockPerDay: 1, relationRequired: 50 },
    ],
    questIds: [],
  },
};

function scoreToRelation(score: number): NpcRelation {
  if (score < 10) return 'stranger';
  if (score < 30) return 'acquaintance';
  if (score < 60) return 'friend';
  if (score < 80) return 'close_friend';
  return 'beloved';
}

export class NpcService {
  static getNpc(npcId: string): Npc | null {
    return NPCS[npcId] ?? null;
  }

  static getAllNpcs(): Npc[] {
    return Object.values(NPCS);
  }

  static async getRelation(playerId: string, npcId: string): Promise<PlayerNpcRelation | null> {
    const result = await db.select().from(schema.npcRelations)
      .where(and(eq(schema.npcRelations.playerId, playerId), eq(schema.npcRelations.npcId, npcId))).limit(1);
    return result.length > 0 ? (result[0] as unknown as PlayerNpcRelation) : null;
  }

  static async getOrCreateRelation(playerId: string, npcId: string): Promise<PlayerNpcRelation> {
    const existing = await NpcService.getRelation(playerId, npcId);
    if (existing) return existing;

    const id = randomUUID();
    await db.insert(schema.npcRelations).values({ id, userId: playerId, playerId, npcId, relationScore: 0, relation: 'stranger', giftsGiven: 0 }); // userId mirrors playerId (legacy NOT NULL col)
    return (await NpcService.getRelation(playerId, npcId))!;
  }

  static async talk(playerId: string, npcId: string): Promise<{ dialogue: string; relationGain: number }> {
    const npc = NPCS[npcId];
    if (!npc) throw new Error('Không tìm thấy NPC này.');

    const relation = await NpcService.getOrCreateRelation(playerId, npcId);

    const eligible = npc.dialogues.filter((d) => (d.relationRequired ?? 0) <= relation.relationScore);
    const dialogue = eligible.length > 0 ? randomFrom(eligible) : npc.dialogues[0];

    const gain = relation.relationScore < 20 ? 3 : relation.relationScore < 50 ? 1 : 0;
    const newScore = clamp(relation.relationScore + gain, 0, npc.maxRelation);

    await db.update(schema.npcRelations).set({
      relationScore: newScore,
      relation: scoreToRelation(newScore),
      lastTalked: new Date(),
    }).where(and(eq(schema.npcRelations.playerId, playerId), eq(schema.npcRelations.npcId, npcId)));

    return { dialogue: dialogue.text, relationGain: gain };
  }

  static async giftItem(playerId: string, npcId: string, itemId: string): Promise<{ relationGain: number; response: string }> {
    const npc = NPCS[npcId];
    if (!npc) throw new Error('Không tìm thấy NPC này.');

    const hasItem = await InventoryService.hasItem(playerId, itemId, 1);
    if (!hasItem) throw new Error('Bạn không có vật phẩm này trong túi đồ.');

    await InventoryService.removeItem(playerId, itemId, 1);

    const { EconomyService } = await import('./EconomyService');
    const itemDef = EconomyService.getItem(itemId);
    const gain = itemDef ? Math.ceil(itemDef.sellPrice / 10) : 2;

    const relation = await NpcService.getOrCreateRelation(playerId, npcId);
    const newScore = clamp(relation.relationScore + gain, 0, npc.maxRelation);

    await db.update(schema.npcRelations).set({
      relationScore: newScore, relation: scoreToRelation(newScore),
      giftsGiven: relation.giftsGiven + 1,
    }).where(and(eq(schema.npcRelations.playerId, playerId), eq(schema.npcRelations.npcId, npcId)));

    const responses = [
      `${npc.name} mỉm cười ấm áp. "Cảm ơn bạn, điều này thật ý nghĩa với tôi!"`,
      `"Ồ, chu đáo quá!" ${npc.name} cẩn thận cất món quà vào.`,
      `${npc.name} gật đầu biết ơn. "Bạn có gu thật đấy."`,
    ];

    return { relationGain: gain, response: randomFrom(responses) };
  }

  /** Execute an NPC trade by index */
  static async executeTrade(playerId: string, npcId: string, tradeIndex: number): Promise<{ message: string }> {
    const npc = NPCS[npcId];
    if (!npc) throw new Error('Không tìm thấy NPC này.');

    const trade = npc.trades[tradeIndex];
    if (!trade) throw new Error('Giao dịch không hợp lệ.');

    const relation = await NpcService.getOrCreateRelation(playerId, npcId);
    if (relation.relationScore < trade.relationRequired) {
      throw new Error(`Cần điểm quan hệ tối thiểu ${trade.relationRequired} với ${npc.name} để thực hiện giao dịch này (hiện tại: ${relation.relationScore}).`);
    }

    const { EconomyService } = await import('./EconomyService');

    // Check player has what they need to give
    const give = trade.give;
    if ('itemId' in give) {
      const hasItem = await InventoryService.hasItem(playerId, give.itemId, give.quantity);
      if (!hasItem) {
        const itemDef = EconomyService.getItem(give.itemId);
        throw new Error(`Cần ${give.quantity}x ${itemDef?.name ?? give.itemId} để trao đổi.`);
      }
    } else {
      const hasEnough = await PlayerService.hasEnoughCoins(playerId, give.coins);
      if (!hasEnough) throw new Error(`Cần ${give.coins} xu để trao đổi.`);
    }

    // Execute: remove what player gives
    if ('itemId' in give) {
      await InventoryService.removeItem(playerId, give.itemId, give.quantity);
    } else {
      await PlayerService.updateCoins(playerId, -give.coins);
    }

    // Execute: add what player receives
    const receive = trade.receive;
    let receiveDesc: string;
    if ('itemId' in receive) {
      await InventoryService.addItem(playerId, receive.itemId, receive.quantity);
      const itemDef = EconomyService.getItem(receive.itemId);
      receiveDesc = `${receive.quantity}x ${itemDef?.name ?? receive.itemId}`;
    } else {
      await PlayerService.updateCoins(playerId, receive.coins);
      receiveDesc = `${receive.coins} xu`;
    }

    return { message: `${npc.name} gật đầu hài lòng. Bạn nhận được **${receiveDesc}**!` };
  }

  static async getAllRelations(playerId: string): Promise<PlayerNpcRelation[]> {
    const result = await db.select().from(schema.npcRelations).where(eq(schema.npcRelations.playerId, playerId));
    return result as unknown as PlayerNpcRelation[];
  }
}
