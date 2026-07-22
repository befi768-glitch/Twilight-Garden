import { eq } from 'drizzle-orm';
import { db, schema } from '../database';
import { Home } from '../models/types';
import { PlayerService } from './PlayerService';
import { randomUUID } from 'crypto';

interface UpgradeTier {
  level: number;
  cost: number;
  gardenSlots: number;
  storageSlots: number;
  defenseRating: number;
  name: string;
  description: string;
}

export const HOME_UPGRADES: UpgradeTier[] = [
  { level: 1, cost: 0, gardenSlots: 6, storageSlots: 30, defenseRating: 0, name: 'Seedling Cottage', description: 'A humble beginning in the twilight garden.' },
  { level: 2, cost: 500, gardenSlots: 9, storageSlots: 50, defenseRating: 5, name: 'Moonbloom Cabin', description: 'Your home expands, reflecting your growing skill.' },
  { level: 3, cost: 1500, gardenSlots: 12, storageSlots: 80, defenseRating: 10, name: 'Starlit House', description: 'A proper house with star-glass windows.' },
  { level: 4, cost: 4000, gardenSlots: 16, storageSlots: 120, defenseRating: 20, name: 'Crystal Manor', description: 'Crystal fixtures adorn every room of your manor.' },
  { level: 5, cost: 10000, gardenSlots: 20, storageSlots: 200, defenseRating: 40, name: 'Twilight Estate', description: 'The grandest estate in the garden — a legend among players.' },
];

export class HomeService {
  static async createHome(playerId: string): Promise<Home> {
    const id = randomUUID();
    const tier = HOME_UPGRADES[0];
    await db.insert(schema.homes).values({
      id, playerId, level: 1,
      name: tier.name, description: tier.description,
      decorations: [], storageSlots: tier.storageSlots,
      gardenSlots: tier.gardenSlots, defenseRating: tier.defenseRating,
    });
    return (await HomeService.getHome(playerId))!;
  }

  static async getHome(playerId: string): Promise<Home | null> {
    const result = await db.select().from(schema.homes).where(eq(schema.homes.playerId, playerId)).limit(1);
    return result.length > 0 ? (result[0] as unknown as Home) : null;
  }

  static async upgrade(playerId: string): Promise<{ newLevel: number; tier: UpgradeTier }> {
    const home = await HomeService.getHome(playerId);
    if (!home) throw new Error('No home found');
    const nextTier = HOME_UPGRADES[home.level]; // index = current level (0-based next)
    if (!nextTier) throw new Error('Your home is already at maximum level!');

    const hasEnough = await PlayerService.hasEnoughCoins(playerId, nextTier.cost);
    if (!hasEnough) throw new Error(`You need ${nextTier.cost} mooncoins to upgrade.`);

    await PlayerService.updateCoins(playerId, -nextTier.cost);
    await db.update(schema.homes).set({
      level: nextTier.level,
      name: nextTier.name,
      description: nextTier.description,
      gardenSlots: nextTier.gardenSlots,
      storageSlots: nextTier.storageSlots,
      defenseRating: nextTier.defenseRating,
      lastUpgradedAt: new Date(),
    }).where(eq(schema.homes.playerId, playerId));

    return { newLevel: nextTier.level, tier: nextTier };
  }

  static async setName(playerId: string, name: string): Promise<void> {
    await db.update(schema.homes).set({ name: name.slice(0, 40) }).where(eq(schema.homes.playerId, playerId));
  }

  static async setDescription(playerId: string, description: string): Promise<void> {
    await db.update(schema.homes).set({ description: description.slice(0, 200) }).where(eq(schema.homes.playerId, playerId));
  }

  static async addDecoration(playerId: string, itemId: string, position: number): Promise<void> {
    const home = await HomeService.getHome(playerId);
    if (!home) throw new Error('No home found');
    const deco = home.decorations ?? [];
    deco.push({ itemId, position, placedAt: new Date() });
    await db.update(schema.homes).set({ decorations: deco as any }).where(eq(schema.homes.playerId, playerId));
  }

  static getNextUpgrade(currentLevel: number): UpgradeTier | null {
    return HOME_UPGRADES[currentLevel] ?? null;
  }
}
