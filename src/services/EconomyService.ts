import { eq, and, desc, lt } from 'drizzle-orm';
import { db, schema } from '../database';
import { ItemDefinition, ItemCategory, Rarity, AuctionListing } from '../models/types';
import { PlayerService } from './PlayerService';
import { InventoryService } from './InventoryService';
import { randomUUID } from 'crypto';

/** Static item catalogue */
export const ITEMS: Record<string, ItemDefinition> = {
  // Seeds
  seed_moonflower: { id: 'seed_moonflower', name: 'Moonflower Seed', emoji: '🌱', category: 'seed', rarity: 'uncommon', description: 'Plant in your garden.', sellPrice: 10, buyPrice: 20, usable: true, stackable: true, maxStack: 99 },
  seed_starbloom: { id: 'seed_starbloom', name: 'Starbloom Seed', emoji: '🌱', category: 'seed', rarity: 'rare', description: 'Rare celestial seed.', sellPrice: 25, buyPrice: 50, usable: true, stackable: true, maxStack: 99 },
  seed_twilight_rose: { id: 'seed_twilight_rose', name: 'Rose Seed', emoji: '🌱', category: 'seed', rarity: 'common', description: 'A simple rose seed.', sellPrice: 4, buyPrice: 8, usable: true, stackable: true, maxStack: 99 },
  seed_crystalvine: { id: 'seed_crystalvine', name: 'Crystalvine Seed', emoji: '💠', category: 'seed', rarity: 'epic', description: 'Nearly impossible to find.', sellPrice: 60, buyPrice: 120, usable: true, stackable: true, maxStack: 99 },
  seed_dreamcap: { id: 'seed_dreamcap', name: 'Dreamcap Spore', emoji: '🍄', category: 'seed', rarity: 'uncommon', description: 'Mushroom spore.', sellPrice: 8, buyPrice: 15, usable: true, stackable: true, maxStack: 99 },
  seed_sunpetal: { id: 'seed_sunpetal', name: 'Sunpetal Seed', emoji: '🌻', category: 'seed', rarity: 'common', description: 'Basic sunny seed.', sellPrice: 3, buyPrice: 5, usable: true, stackable: true, maxStack: 99 },
  seed_shadowbloom: { id: 'seed_shadowbloom', name: 'Shadowbloom Seed', emoji: '🌑', category: 'seed', rarity: 'legendary', description: 'Incredibly rare.', sellPrice: 150, buyPrice: 300, usable: true, stackable: true, maxStack: 10 },

  // Crops
  crop_moonflower: { id: 'crop_moonflower', name: 'Moonflower', emoji: '🌙', category: 'crop', rarity: 'uncommon', description: 'A harvested moonflower.', sellPrice: 45, buyPrice: null, usable: false, stackable: true, maxStack: 999 },
  crop_starbloom: { id: 'crop_starbloom', name: 'Starbloom', emoji: '⭐', category: 'crop', rarity: 'rare', description: 'A harvested starbloom.', sellPrice: 80, buyPrice: null, usable: false, stackable: true, maxStack: 999 },
  crop_twilight_rose: { id: 'crop_twilight_rose', name: 'Twilight Rose', emoji: '🌹', category: 'crop', rarity: 'common', description: 'A harvested rose.', sellPrice: 20, buyPrice: null, usable: false, stackable: true, maxStack: 999 },
  crop_crystalvine: { id: 'crop_crystalvine', name: 'Crystalvine Shard', emoji: '💎', category: 'crop', rarity: 'epic', description: 'Crystallized vine.', sellPrice: 200, buyPrice: null, usable: false, stackable: true, maxStack: 999 },
  crop_dreamcap: { id: 'crop_dreamcap', name: 'Dreamcap', emoji: '🍄', category: 'crop', rarity: 'uncommon', description: 'A harvested dreamcap.', sellPrice: 35, buyPrice: null, usable: false, stackable: true, maxStack: 999 },
  crop_sunpetal: { id: 'crop_sunpetal', name: 'Sunpetal', emoji: '🌻', category: 'crop', rarity: 'common', description: 'A harvested sunpetal.', sellPrice: 15, buyPrice: null, usable: false, stackable: true, maxStack: 999 },
  crop_shadowbloom: { id: 'crop_shadowbloom', name: 'Shadowbloom', emoji: '🌑', category: 'crop', rarity: 'legendary', description: 'Rare shadow essence.', sellPrice: 500, buyPrice: null, usable: false, stackable: true, maxStack: 99 },

  // Tools & potions
  watering_can: { id: 'watering_can', name: 'Watering Can', emoji: '🪣', category: 'tool', rarity: 'common', description: 'Water your plants.', sellPrice: 10, buyPrice: 30, usable: true, stackable: false, maxStack: 1 },
  fertilizer: { id: 'fertilizer', name: 'Fertilizer', emoji: '💩', category: 'material', rarity: 'common', description: 'Speeds up plant growth.', sellPrice: 5, buyPrice: 12, usable: true, stackable: true, maxStack: 99 },
  growth_potion: { id: 'growth_potion', name: 'Growth Potion', emoji: '🧪', category: 'potion', rarity: 'uncommon', description: 'Instantly advances plant growth.', sellPrice: 30, buyPrice: 75, usable: true, stackable: true, maxStack: 10 },
  moonstone: { id: 'moonstone', name: 'Moonstone', emoji: '🔮', category: 'gem', rarity: 'rare', description: 'A gem infused with moonlight.', sellPrice: 150, buyPrice: null, usable: false, stackable: true, maxStack: 99 },
  healing_herb: { id: 'healing_herb', name: 'Healing Herb', emoji: '🌿', category: 'food', rarity: 'common', description: 'Restores energy.', sellPrice: 8, buyPrice: 15, usable: true, stackable: true, maxStack: 50 },
  pet_food: { id: 'pet_food', name: 'Pet Food', emoji: '🥩', category: 'food', rarity: 'common', description: 'Feed your pet.', sellPrice: 3, buyPrice: 8, usable: true, stackable: true, maxStack: 99 },
  taming_charm: { id: 'taming_charm', name: 'Taming Charm', emoji: '🪄', category: 'tool', rarity: 'uncommon', description: 'Used to tame wildlife.', sellPrice: 20, buyPrice: 50, usable: true, stackable: true, maxStack: 10 },
  treasure_map: { id: 'treasure_map', name: 'Treasure Map', emoji: '🗺️', category: 'key', rarity: 'rare', description: 'Leads to hidden treasure.', sellPrice: 100, buyPrice: null, usable: true, stackable: true, maxStack: 5 },
  ancient_relic: { id: 'ancient_relic', name: 'Ancient Relic', emoji: '🏺', category: 'misc', rarity: 'epic', description: 'A relic from a forgotten age.', sellPrice: 300, buyPrice: null, usable: false, stackable: true, maxStack: 10 },
};

/** Items available in the basic shop */
export const SHOP_ITEMS: { itemId: string; price: number }[] = [
  { itemId: 'seed_twilight_rose', price: 8 },
  { itemId: 'seed_sunpetal', price: 5 },
  { itemId: 'seed_moonflower', price: 20 },
  { itemId: 'seed_dreamcap', price: 15 },
  { itemId: 'fertilizer', price: 12 },
  { itemId: 'growth_potion', price: 75 },
  { itemId: 'healing_herb', price: 15 },
  { itemId: 'pet_food', price: 8 },
  { itemId: 'taming_charm', price: 50 },
  { itemId: 'watering_can', price: 30 },
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
    if (!shopEntry) throw new Error('Item not available in shop');

    const totalCost = shopEntry.price * quantity;
    const hasEnough = await PlayerService.hasEnoughCoins(playerId, totalCost);
    if (!hasEnough) throw new Error('Not enough mooncoins');

    await PlayerService.updateCoins(playerId, -totalCost);
    await InventoryService.addItem(playerId, itemId, quantity);

    // Log transaction
    await EconomyService.logTransaction(null, playerId, 'spend', totalCost, itemId, quantity, `Bought ${quantity}x ${ITEMS[itemId]?.name ?? itemId} from shop`);

    const player = await PlayerService.getById(playerId);
    return { spent: totalCost, newBalance: player?.coins ?? 0 };
  }

  /** Sell an item */
  static async sellItem(playerId: string, itemId: string, quantity: number): Promise<{ earned: number; newBalance: number }> {
    const item = ITEMS[itemId];
    if (!item) throw new Error('Unknown item');

    const hasItem = await InventoryService.hasItem(playerId, itemId, quantity);
    if (!hasItem) throw new Error('Not enough items in inventory');

    await InventoryService.removeItem(playerId, itemId, quantity);
    const earned = item.sellPrice * quantity;
    await PlayerService.updateCoins(playerId, earned);

    await EconomyService.logTransaction(playerId, null, 'earn', earned, itemId, quantity, `Sold ${quantity}x ${item.name}`);

    const player = await PlayerService.getById(playerId);
    return { earned, newBalance: player?.coins ?? 0 };
  }

  /** Transfer coins between players */
  static async transfer(fromId: string, toId: string, amount: number): Promise<void> {
    const hasEnough = await PlayerService.hasEnoughCoins(fromId, amount);
    if (!hasEnough) throw new Error('Not enough mooncoins');

    await PlayerService.updateCoins(fromId, -amount);
    await PlayerService.updateCoins(toId, amount);
    await EconomyService.logTransaction(fromId, toId, 'transfer', amount, null, null, `Transfer`);
  }

  /** Create an auction listing */
  static async createAuction(sellerId: string, itemId: string, quantity: number, startPrice: number, durationHours: number): Promise<string> {
    const hasItem = await InventoryService.hasItem(sellerId, itemId, quantity);
    if (!hasItem) throw new Error('Not enough items');

    await InventoryService.removeItem(sellerId, itemId, quantity);

    const id = randomUUID();
    const endsAt = new Date(Date.now() + durationHours * 3600 * 1000);
    await db.insert(schema.auctions).values({ id, sellerId, itemId, quantity, startPrice, currentBid: startPrice, endsAt, status: 'active', createdAt: new Date() });
    return id;
  }

  /** Bid on an auction */
  static async bid(auctionId: string, bidderId: string, amount: number): Promise<void> {
    const result = await db.select().from(schema.auctions).where(eq(schema.auctions.id, auctionId)).limit(1);
    if (!result.length) throw new Error('Auction not found');
    const auction = result[0];
    if (auction.status !== 'active') throw new Error('Auction is not active');
    if (new Date() > auction.endsAt) throw new Error('Auction has ended');
    if (amount <= auction.currentBid) throw new Error('Bid must be higher than current bid');

    const hasEnough = await PlayerService.hasEnoughCoins(bidderId, amount);
    if (!hasEnough) throw new Error('Not enough mooncoins');

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
