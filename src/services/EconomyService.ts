import { eq, and, desc, lt } from 'drizzle-orm';
import { db, schema } from '../database';
import { ItemDefinition, ItemCategory, Rarity, AuctionListing } from '../models/types';
import { PlayerService } from './PlayerService';
import { InventoryService } from './InventoryService';
import { randomUUID } from 'crypto';

/** Static item catalogue */
export const ITEMS: Record<string, ItemDefinition> = {
  // Hạt giống
  seed_moonflower: { id: 'seed_moonflower', name: 'Hạt Hoa Trăng', emoji: '🌱', category: 'seed', rarity: 'uncommon', description: 'Trồng vào vườn để lấy Hoa Trăng.', sellPrice: 18, buyPrice: 110, usable: true, stackable: true, maxStack: 99 },
  seed_starbloom: { id: 'seed_starbloom', name: 'Hạt Tinh Hoa Sao', emoji: '🌱', category: 'seed', rarity: 'rare', description: 'Hạt giống thiên thể hiếm có.', sellPrice: 45, buyPrice: 280, usable: true, stackable: true, maxStack: 99 },
  seed_twilight_rose: { id: 'seed_twilight_rose', name: 'Hạt Hồng Hoàng Hôn', emoji: '🌱', category: 'seed', rarity: 'common', description: 'Hạt hoa hồng đơn giản, dễ trồng.', sellPrice: 6, buyPrice: 40, usable: true, stackable: true, maxStack: 99 },
  seed_crystalvine: { id: 'seed_crystalvine', name: 'Hạt Dây Pha Lê', emoji: '💠', category: 'seed', rarity: 'epic', description: 'Gần như không thể tìm thấy ngoài tự nhiên.', sellPrice: 100, buyPrice: 650, usable: true, stackable: true, maxStack: 99 },
  seed_dreamcap: { id: 'seed_dreamcap', name: 'Bào Tử Nấm Mộng Mơ', emoji: '🍄', category: 'seed', rarity: 'uncommon', description: 'Bào tử nấm đặc biệt.', sellPrice: 14, buyPrice: 80, usable: true, stackable: true, maxStack: 99 },
  seed_sunpetal: { id: 'seed_sunpetal', name: 'Hạt Cánh Hoa Nắng', emoji: '🌻', category: 'seed', rarity: 'common', description: 'Hạt hoa phổ thông, dễ trồng dưới nắng.', sellPrice: 5, buyPrice: 25, usable: true, stackable: true, maxStack: 99 },
  seed_shadowbloom: { id: 'seed_shadowbloom', name: 'Hạt Hoa Bóng Tối', emoji: '🌑', category: 'seed', rarity: 'legendary', description: 'Cực kỳ hiếm. Chỉ nở trong đêm tối.', sellPrice: 250, buyPrice: 1600, usable: true, stackable: true, maxStack: 10 },

  // Nông sản
  crop_moonflower: { id: 'crop_moonflower', name: 'Hoa Trăng', emoji: '🌙', category: 'crop', rarity: 'uncommon', description: 'Hoa Trăng vừa thu hoạch.', sellPrice: 55, buyPrice: null, usable: false, stackable: true, maxStack: 999 },
  crop_starbloom: { id: 'crop_starbloom', name: 'Tinh Hoa Sao', emoji: '⭐', category: 'crop', rarity: 'rare', description: 'Tinh Hoa Sao vừa thu hoạch.', sellPrice: 95, buyPrice: null, usable: false, stackable: true, maxStack: 999 },
  crop_twilight_rose: { id: 'crop_twilight_rose', name: 'Hồng Hoàng Hôn', emoji: '🌹', category: 'crop', rarity: 'common', description: 'Hoa hồng hoàng hôn tươi.', sellPrice: 25, buyPrice: null, usable: false, stackable: true, maxStack: 999 },
  crop_crystalvine: { id: 'crop_crystalvine', name: 'Mảnh Dây Pha Lê', emoji: '💎', category: 'crop', rarity: 'epic', description: 'Dây leo kết tinh thành pha lê.', sellPrice: 230, buyPrice: null, usable: false, stackable: true, maxStack: 999 },
  crop_dreamcap: { id: 'crop_dreamcap', name: 'Nấm Mộng Mơ', emoji: '🍄', category: 'crop', rarity: 'uncommon', description: 'Nấm mộng mơ vừa thu hoạch.', sellPrice: 50, buyPrice: null, usable: false, stackable: true, maxStack: 999 },
  crop_sunpetal: { id: 'crop_sunpetal', name: 'Cánh Hoa Nắng', emoji: '🌻', category: 'crop', rarity: 'common', description: 'Cánh hoa nắng tươi sáng.', sellPrice: 18, buyPrice: null, usable: false, stackable: true, maxStack: 999 },
  crop_shadowbloom: { id: 'crop_shadowbloom', name: 'Hoa Bóng Tối', emoji: '🌑', category: 'crop', rarity: 'legendary', description: 'Tinh chất bóng tối huyền bí.', sellPrice: 600, buyPrice: null, usable: false, stackable: true, maxStack: 99 },

  // Công cụ & thuốc
  watering_can: { id: 'watering_can', name: 'Bình Tưới Nước', emoji: '🪣', category: 'tool', rarity: 'common', description: 'Dùng để tưới cây trong vườn.', sellPrice: 25, buyPrice: 150, usable: true, stackable: false, maxStack: 1 },
  fertilizer: { id: 'fertilizer', name: 'Phân Bón', emoji: '💩', category: 'material', rarity: 'common', description: 'Thúc đẩy cây tăng trưởng nhanh hơn.', sellPrice: 10, buyPrice: 65, usable: true, stackable: true, maxStack: 99 },
  growth_potion: { id: 'growth_potion', name: 'Thuốc Tăng Trưởng', emoji: '🧪', category: 'potion', rarity: 'uncommon', description: 'Lập tức thúc đẩy cây phát triển ngay.', sellPrice: 70, buyPrice: 380, usable: true, stackable: true, maxStack: 10 },
  moonstone: { id: 'moonstone', name: 'Đá Mặt Trăng', emoji: '🔮', category: 'gem', rarity: 'rare', description: 'Viên đá quý thấm đầy ánh trăng.', sellPrice: 320, buyPrice: null, usable: false, stackable: true, maxStack: 99 },
  healing_herb: { id: 'healing_herb', name: 'Thảo Dược Chữa Lành', emoji: '🌿', category: 'food', rarity: 'common', description: 'Hồi phục năng lượng.', sellPrice: 18, buyPrice: 65, usable: true, stackable: true, maxStack: 50 },
  pet_food: { id: 'pet_food', name: 'Thức Ăn Thú Cưng', emoji: '🥩', category: 'food', rarity: 'common', description: 'Cho thú cưng ăn.', sellPrice: 6, buyPrice: 40, usable: true, stackable: true, maxStack: 99 },
  taming_charm: { id: 'taming_charm', name: 'Bùa Thuần Hóa', emoji: '🪄', category: 'tool', rarity: 'uncommon', description: 'Dùng để thuần hóa sinh vật hoang dã.', sellPrice: 45, buyPrice: 260, usable: true, stackable: true, maxStack: 10 },
  treasure_map: { id: 'treasure_map', name: 'Bản Đồ Kho Báu', emoji: '🗺️', category: 'key', rarity: 'rare', description: 'Dẫn đến kho báu bí ẩn.', sellPrice: 250, buyPrice: null, usable: true, stackable: true, maxStack: 5 },
  ancient_relic: { id: 'ancient_relic', name: 'Cổ Vật Cổ Đại', emoji: '🏺', category: 'misc', rarity: 'epic', description: 'Di vật từ một nền văn minh đã lãng quên.', sellPrice: 700, buyPrice: null, usable: false, stackable: true, maxStack: 10 },
};

/** Items available in the basic shop */
export const SHOP_ITEMS: { itemId: string; price: number }[] = [
  { itemId: 'seed_sunpetal',      price: 25 },
  { itemId: 'seed_twilight_rose', price: 40 },
  { itemId: 'seed_moonflower',    price: 110 },
  { itemId: 'seed_dreamcap',      price: 80 },
  { itemId: 'seed_starbloom',     price: 280 },
  { itemId: 'seed_crystalvine',   price: 650 },
  { itemId: 'fertilizer',         price: 65 },
  { itemId: 'growth_potion',      price: 380 },
  { itemId: 'healing_herb',       price: 65 },
  { itemId: 'pet_food',           price: 40 },
  { itemId: 'taming_charm',       price: 260 },
  { itemId: 'watering_can',       price: 150 },
];

export class EconomyService {
  static getItem(itemId: string): ItemDefinition | null {
    return ITEMS[itemId] ?? null;
  }

  static getAllItems(): ItemDefinition[] {
    return Object.values(ITEMS);
  }

  /** Buy an item from the shop */
  static async buyFromShop(playerId: string, itemId: string, quantity: number): Promise<{ spent: number; newBalance: number }> {
    const shopEntry = SHOP_ITEMS.find((s) => s.itemId === itemId);
    if (!shopEntry) throw new Error('Vật phẩm này không có trong cửa hàng.');

    const totalCost = shopEntry.price * quantity;
    const hasEnough = await PlayerService.hasEnoughCoins(playerId, totalCost);
    if (!hasEnough) throw new Error('Không đủ xu để mua.');

    await PlayerService.updateCoins(playerId, -totalCost);
    await InventoryService.addItem(playerId, itemId, quantity);

    // Log transaction
    await EconomyService.logTransaction(null, playerId, 'spend', totalCost, itemId, quantity, `Mua ${quantity}x ${ITEMS[itemId]?.name ?? itemId} từ cửa hàng`);

    const player = await PlayerService.getById(playerId);
    return { spent: totalCost, newBalance: player?.coins ?? 0 };
  }

  /** Sell an item */
  static async sellItem(playerId: string, itemId: string, quantity: number): Promise<{ earned: number; newBalance: number }> {
    const item = ITEMS[itemId];
    if (!item) throw new Error('Không tìm thấy vật phẩm này.');

    const hasItem = await InventoryService.hasItem(playerId, itemId, quantity);
    if (!hasItem) throw new Error('Không đủ số lượng vật phẩm trong túi đồ.');

    await InventoryService.removeItem(playerId, itemId, quantity);
    const earned = Math.floor(item.sellPrice * quantity * 0.92); // 8% thuế giao dịch
    await PlayerService.updateCoins(playerId, earned);

    await EconomyService.logTransaction(playerId, null, 'earn', earned, itemId, quantity, `Bán ${quantity}x ${item.name}`);

    const player = await PlayerService.getById(playerId);
    return { earned, newBalance: player?.coins ?? 0 };
  }

  /** Transfer coins between players */
  static async transfer(fromId: string, toId: string, amount: number): Promise<void> {
    const hasEnough = await PlayerService.hasEnoughCoins(fromId, amount);
    if (!hasEnough) throw new Error('Không đủ xu để chuyển.');

    await PlayerService.updateCoins(fromId, -amount);
    await PlayerService.updateCoins(toId, amount);
    await EconomyService.logTransaction(fromId, toId, 'transfer', amount, null, null, 'Chuyển xu');
  }

  /** Create an auction listing */
  static async createAuction(sellerId: string, itemId: string, quantity: number, startPrice: number, durationHours: number): Promise<string> {
    const hasItem = await InventoryService.hasItem(sellerId, itemId, quantity);
    if (!hasItem) throw new Error('Không đủ số lượng vật phẩm.');

    await InventoryService.removeItem(sellerId, itemId, quantity);

    const id = randomUUID();
    const endsAt = new Date(Date.now() + durationHours * 3600 * 1000);
    await db.insert(schema.auctions).values({ id, sellerId, itemId, quantity, startPrice, currentBid: startPrice, endsAt, status: 'active', createdAt: new Date() });
    return id;
  }

  /** Bid on an auction */
  static async bid(auctionId: string, bidderId: string, amount: number): Promise<void> {
    const result = await db.select().from(schema.auctions).where(eq(schema.auctions.id, auctionId)).limit(1);
    if (!result.length) throw new Error('Không tìm thấy phiên đấu giá.');
    const auction = result[0];
    if (auction.status !== 'active') throw new Error('Phiên đấu giá này không còn hoạt động.');
    if (new Date() > auction.endsAt) throw new Error('Phiên đấu giá đã kết thúc.');
    if (amount <= auction.currentBid) throw new Error('Giá đặt phải cao hơn giá hiện tại.');

    const hasEnough = await PlayerService.hasEnoughCoins(bidderId, amount);
    if (!hasEnough) throw new Error('Không đủ xu để đặt giá.');

    // Refund previous bidder
    if (auction.highestBidderId) {
      await PlayerService.updateCoins(auction.highestBidderId, auction.currentBid);
    }
    // Hold bid amount
    await PlayerService.updateCoins(bidderId, -amount);
    await db.update(schema.auctions).set({ currentBid: amount, highestBidderId: bidderId }).where(eq(schema.auctions.id, auctionId));
  }

  /** Resolve expired auctions */
  static async resolveAuctions(): Promise<void> {
    const expired = await db.select().from(schema.auctions).where(and(eq(schema.auctions.status, 'active'), lt(schema.auctions.endsAt, new Date())));
    for (const auction of expired) {
      if (auction.highestBidderId) {
        await InventoryService.addItem(auction.highestBidderId, auction.itemId, auction.quantity);
        await PlayerService.updateCoins(auction.sellerId, auction.currentBid);
        await db.update(schema.auctions).set({ status: 'sold' }).where(eq(schema.auctions.id, auction.id));
      } else {
        await InventoryService.addItem(auction.sellerId, auction.itemId, auction.quantity);
        await db.update(schema.auctions).set({ status: 'expired' }).where(eq(schema.auctions.id, auction.id));
      }
    }
  }

  static async getActiveAuctions(guildId?: string): Promise<typeof schema.auctions.$inferSelect[]> {
    return db.select().from(schema.auctions).where(eq(schema.auctions.status, 'active')).orderBy(desc(schema.auctions.endsAt));
  }

  private static async logTransaction(fromId: string | null, toId: string | null, type: string, amount: number, itemId: string | null, qty: number | null, desc: string): Promise<void> {
    await db.insert(schema.transactions).values({ id: randomUUID(), fromPlayerId: fromId, toPlayerId: toId, type, amount, itemId, itemQuantity: qty, description: desc, createdAt: new Date() });
  }
}
