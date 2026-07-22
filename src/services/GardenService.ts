import { eq, and } from 'drizzle-orm';
import { db, schema } from '../database';
import { Plant, PlantDefinition, PlantStage } from '../models/types';
import { chance, randomFrom } from '../utils/helpers';
import { randomUUID } from 'crypto';

/** Static plant catalogue */
export const PLANTS: Record<string, PlantDefinition> = {
  moonflower: {
    id: 'moonflower', name: 'Moonflower', emoji: '🌙', rarity: 'uncommon',
    growTimeMinutes: 60, baseYield: 3, sellPrice: 45, seedPrice: 20,
    description: 'Blooms only under moonlight. Glows softly in the dark.',
    mutationChance: 0.05, seasonBonus: ['autumn', 'winter'], weatherBonus: ['cloudy', 'foggy'],
  },
  starbloom: {
    id: 'starbloom', name: 'Starbloom', emoji: '⭐', rarity: 'rare',
    growTimeMinutes: 120, baseYield: 2, sellPrice: 80, seedPrice: 50,
    description: 'A flower that twinkles like a distant star.',
    mutationChance: 0.08, seasonBonus: ['winter'], weatherBonus: ['magical'],
  },
  twilight_rose: {
    id: 'twilight_rose', name: 'Twilight Rose', emoji: '🌹', rarity: 'common',
    growTimeMinutes: 30, baseYield: 4, sellPrice: 20, seedPrice: 8,
    description: 'A classic garden rose with a faint purple hue at dusk.',
    mutationChance: 0.03, seasonBonus: ['spring', 'summer'], weatherBonus: ['sunny'],
  },
  crystalvine: {
    id: 'crystalvine', name: 'Crystalvine', emoji: '💎', rarity: 'epic',
    growTimeMinutes: 180, baseYield: 1, sellPrice: 200, seedPrice: 120,
    description: 'Its leaves are translucent like glass and shimmer in the light.',
    mutationChance: 0.12, seasonBonus: ['winter'], weatherBonus: ['magical', 'stormy'],
  },
  dreamcap: {
    id: 'dreamcap', name: 'Dreamcap Mushroom', emoji: '🍄', rarity: 'uncommon',
    growTimeMinutes: 45, baseYield: 5, sellPrice: 35, seedPrice: 15,
    description: 'Grows best in misty forests. Said to bring vivid dreams.',
    mutationChance: 0.04, seasonBonus: ['autumn'], weatherBonus: ['foggy', 'rainy'],
  },
  sunpetal: {
    id: 'sunpetal', name: 'Sunpetal', emoji: '🌻', rarity: 'common',
    growTimeMinutes: 25, baseYield: 5, sellPrice: 15, seedPrice: 5,
    description: 'A cheerful flower that always faces the sun.',
    mutationChance: 0.02, seasonBonus: ['spring', 'summer'], weatherBonus: ['sunny'],
  },
  shadowbloom: {
    id: 'shadowbloom', name: 'Shadowbloom', emoji: '🌑', rarity: 'legendary',
    growTimeMinutes: 300, baseYield: 1, sellPrice: 500, seedPrice: 300,
    description: 'Absorbs light around it. Extremely rare and powerful.',
    mutationChance: 0.15, seasonBonus: ['winter'], weatherBonus: ['stormy', 'foggy'],
  },
};

const MUTATIONS: Record<string, { name: string; emoji: string; yieldMultiplier: number; priceMultiplier: number }> = {
  golden: { name: 'Golden', emoji: '✨', yieldMultiplier: 2.5, priceMultiplier: 3 },
  giant: { name: 'Giant', emoji: '🔮', yieldMultiplier: 4, priceMultiplier: 2 },
  twin: { name: 'Twin', emoji: '👥', yieldMultiplier: 2, priceMultiplier: 1.5 },
  glowing: { name: 'Glowing', emoji: '💫', yieldMultiplier: 1.5, priceMultiplier: 4 },
};

export class GardenService {
  static async getPlants(playerId: string): Promise<Plant[]> {
    const result = await db.select().from(schema.plants).where(eq(schema.plants.playerId, playerId));
    return result as unknown as Plant[];
  }

  static async getPlantBySlot(playerId: string, slot: number): Promise<Plant | null> {
    const result = await db
      .select()
      .from(schema.plants)
      .where(and(eq(schema.plants.playerId, playerId), eq(schema.plants.slotIndex, slot)))
      .limit(1);
    return result.length > 0 ? (result[0] as unknown as Plant) : null;
  }

  /** Plant a seed in an empty slot */
  static async plant(playerId: string, plantType: string, slot: number, worldState: { currentSeason: string; currentWeather: string }): Promise<Plant> {
    const existing = await GardenService.getPlantBySlot(playerId, slot);
    if (existing) throw new Error('Slot already occupied');

    const def = PLANTS[plantType];
    if (!def) throw new Error('Unknown plant type');

    // Season/weather bonus speeds growth
    let growMins = def.growTimeMinutes;
    if (def.seasonBonus.includes(worldState.currentSeason as any)) growMins *= 0.8;
    if (def.weatherBonus.includes(worldState.currentWeather as any)) growMins *= 0.85;

    const readyAt = new Date(Date.now() + growMins * 60 * 1000);

    const id = randomUUID();
    await db.insert(schema.plants).values({
      id,
      playerId,
      slotIndex: slot,
      plantType,
      stage: 'seed',
      growthPercent: 0,
      waterLevel: 60,
      fertilizerLevel: 0,
      health: 100,
      isMutant: false,
      plantedAt: new Date(),
      readyAt,
    });

    return (await GardenService.getPlantBySlot(playerId, slot))!;
  }

  /** Water a plant */
  static async water(playerId: string, slot: number): Promise<Plant> {
    const plant = await GardenService.getPlantBySlot(playerId, slot);
    if (!plant) throw new Error('No plant in that slot');
    if (plant.stage === 'mature' || plant.stage === 'flowering') throw new Error('Plant is already ready to harvest');

    const newWater = Math.min(100, plant.waterLevel + 30);
    await db
      .update(schema.plants)
      .set({ waterLevel: newWater, lastWatered: new Date() })
      .where(eq(schema.plants.id, plant.id));

    return (await GardenService.getPlantBySlot(playerId, slot))!;
  }

  /** Fertilize a plant */
  static async fertilize(playerId: string, slot: number): Promise<Plant> {
    const plant = await GardenService.getPlantBySlot(playerId, slot);
    if (!plant) throw new Error('No plant in that slot');

    const newFert = Math.min(100, plant.fertilizerLevel + 40);
    await db.update(schema.plants).set({ fertilizerLevel: newFert }).where(eq(schema.plants.id, plant.id));
    return (await GardenService.getPlantBySlot(playerId, slot))!;
  }

  /** Tick growth for all plants of a player */
  static async tickGrowth(playerId: string): Promise<void> {
    const plants = await GardenService.getPlants(playerId);
    for (const plant of plants) {
      if (plant.stage === 'mature' || plant.stage === 'flowering' || plant.stage === 'withered') continue;

      const now = Date.now();
      const readyAt = plant.readyAt ? new Date(plant.readyAt).getTime() : now;
      const totalTime = readyAt - new Date(plant.plantedAt).getTime();
      const elapsed = now - new Date(plant.plantedAt).getTime();
      const growthPercent = Math.min(100, (elapsed / totalTime) * 100);

      let stage: PlantStage = 'seed';
      if (growthPercent >= 100) stage = 'flowering';
      else if (growthPercent >= 75) stage = 'mature';
      else if (growthPercent >= 40) stage = 'growing';
      else if (growthPercent >= 10) stage = 'sprout';

      // Health decays if water is low
      let health = plant.health;
      if (plant.waterLevel < 20) health = Math.max(0, health - 5);
      if (plant.waterLevel < 10 && health <= 0) stage = 'withered';

      await db.update(schema.plants).set({ growthPercent, stage, health, waterLevel: Math.max(0, plant.waterLevel - 2) }).where(eq(schema.plants.id, plant.id));
    }
  }

  /** Harvest a mature plant */
  static async harvest(playerId: string, slot: number): Promise<{ yield: number; mutant: boolean; mutationType: string | null; sellValue: number }> {
    const plant = await GardenService.getPlantBySlot(playerId, slot);
    if (!plant) throw new Error('No plant in that slot');
    if (plant.stage !== 'flowering' && plant.stage !== 'mature') throw new Error('Plant is not ready to harvest yet');

    const def = PLANTS[plant.plantType];
    let yieldAmount = def.baseYield;
    let priceMultiplier = 1;
    let mutant = false;
    let mutationType: string | null = null;

    // Fertilizer boosts yield
    if (plant.fertilizerLevel > 50) yieldAmount = Math.ceil(yieldAmount * 1.5);

    // Check mutation
    if (chance(def.mutationChance + (plant.fertilizerLevel / 1000))) {
      mutant = true;
      const [mutKey, mutDef] = Object.entries(MUTATIONS)[Math.floor(Math.random() * Object.keys(MUTATIONS).length)];
      mutationType = mutKey;
      yieldAmount = Math.ceil(yieldAmount * mutDef.yieldMultiplier);
      priceMultiplier = mutDef.priceMultiplier;
    }

    const sellValue = Math.ceil(def.sellPrice * priceMultiplier * yieldAmount);

    // Remove plant from slot
    await db.delete(schema.plants).where(eq(schema.plants.id, plant.id));

    // Add crop to inventory
    const { InventoryService } = await import('./InventoryService');
    await InventoryService.addItem(playerId, `crop_${plant.plantType}`, yieldAmount);

    return { yield: yieldAmount, mutant, mutationType, sellValue };
  }

  /** Remove a withered plant */
  static async remove(playerId: string, slot: number): Promise<void> {
    const plant = await GardenService.getPlantBySlot(playerId, slot);
    if (!plant) throw new Error('No plant in that slot');
    await db.delete(schema.plants).where(eq(schema.plants.id, plant.id));
  }

  static getPlantDef(id: string): PlantDefinition | null {
    return PLANTS[id] ?? null;
  }

  static getAllPlants(): PlantDefinition[] {
    return Object.values(PLANTS);
  }
}
