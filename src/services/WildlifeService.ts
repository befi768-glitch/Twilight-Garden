import { eq, and } from 'drizzle-orm';
import { db, schema } from '../database';
import { Wildlife, PlayerWildlife, AreaType, Season, Weather, TimeOfDay } from '../models/types';
import { chance, randomFrom, clamp } from '../utils/helpers';
import { PlayerService } from './PlayerService';
import { InventoryService } from './InventoryService';
import { randomUUID } from 'crypto';

export const WILDLIFE: Record<string, Wildlife> = {
  twilight_fox: {
    id: 'twilight_fox', name: 'Twilight Fox', emoji: '🦊', rarity: 'uncommon',
    description: 'A fox with a coat that shifts colors at dusk.',
    habitat: ['forest', 'meadow'], activeTime: ['evening', 'night', 'dawn'], weather: ['sunny', 'cloudy'], season: ['spring', 'summer', 'autumn'],
    tameChance: 0.3, tameCost: [{ itemId: 'pet_food', quantity: 3 }],
    drops: [{ itemId: 'healing_herb', quantity: 1, chance: 0.6 }],
  },
  moon_owl: {
    id: 'moon_owl', name: 'Moon Owl', emoji: '🦉', rarity: 'rare',
    description: 'An owl whose eyes hold tiny moons.',
    habitat: ['forest', 'ruins'], activeTime: ['night', 'midnight'], weather: ['cloudy', 'foggy'], season: ['winter', 'autumn'],
    tameChance: 0.15, tameCost: [{ itemId: 'moonstone', quantity: 1 }],
    drops: [{ itemId: 'moonstone', quantity: 1, chance: 0.3 }],
  },
  crystal_deer: {
    id: 'crystal_deer', name: 'Crystal Deer', emoji: '🦌', rarity: 'rare',
    description: 'Antlers made of living crystal that chime in the breeze.',
    habitat: ['meadow', 'forest'], activeTime: ['morning', 'dawn'], weather: ['sunny', 'magical'], season: ['spring'],
    tameChance: 0.1, tameCost: [{ itemId: 'seed_starbloom', quantity: 2 }],
    drops: [{ itemId: 'moonstone', quantity: 1, chance: 0.4 }, { itemId: 'crop_crystalvine', quantity: 1, chance: 0.1 }],
  },
  glowworm: {
    id: 'glowworm', name: 'Glowworm', emoji: '🪲', rarity: 'common',
    description: 'A tiny worm that pulses with bioluminescent light.',
    habitat: ['cave', 'swamp'], activeTime: ['night', 'midnight'], weather: ['rainy', 'foggy'], season: ['spring', 'summer', 'autumn', 'winter'],
    tameChance: 0.6, tameCost: [{ itemId: 'healing_herb', quantity: 1 }],
    drops: [{ itemId: 'healing_herb', quantity: 1, chance: 0.7 }],
  },
  starfish: {
    id: 'starfish', name: 'Starfish', emoji: '⭐', rarity: 'uncommon',
    description: 'A starfish that floats through the air on moonlit nights.',
    habitat: ['lake'], activeTime: ['night', 'midnight'], weather: ['magical', 'cloudy'], season: ['summer', 'spring'],
    tameChance: 0.2, tameCost: [{ itemId: 'moonstone', quantity: 1 }],
    drops: [{ itemId: 'moonstone', quantity: 1, chance: 0.5 }],
  },
  shadow_wolf: {
    id: 'shadow_wolf', name: 'Shadow Wolf', emoji: '🐺', rarity: 'epic',
    description: 'A massive wolf that walks in darkness and leaves no footprints.',
    habitat: ['forest', 'ruins'], activeTime: ['night', 'midnight'], weather: ['stormy', 'foggy'], season: ['winter'],
    tameChance: 0.05, tameCost: [{ itemId: 'taming_charm', quantity: 2 }, { itemId: 'pet_food', quantity: 5 }],
    drops: [{ itemId: 'ancient_relic', quantity: 1, chance: 0.2 }, { itemId: 'moonstone', quantity: 2, chance: 0.4 }],
  },
  phantom_butterfly: {
    id: 'phantom_butterfly', name: 'Phantom Butterfly', emoji: '🦋', rarity: 'rare',
    description: 'A butterfly so translucent you can see the stars through its wings.',
    habitat: ['meadow', 'village'], activeTime: ['dawn', 'morning', 'afternoon'], weather: ['sunny', 'magical'], season: ['spring', 'summer'],
    tameChance: 0.12, tameCost: [{ itemId: 'seed_moonflower', quantity: 2 }],
    drops: [{ itemId: 'seed_starbloom', quantity: 1, chance: 0.25 }],
  },
  cave_drake: {
    id: 'cave_drake', name: 'Cave Drake', emoji: '🐲', rarity: 'legendary',
    description: 'A small dragon that nests in deep caves and hoards crystals.',
    habitat: ['cave', 'mountain'], activeTime: ['night', 'midnight'], weather: ['stormy'], season: ['winter', 'autumn'],
    tameChance: 0.02, tameCost: [{ itemId: 'taming_charm', quantity: 3 }, { itemId: 'crop_crystalvine', quantity: 2 }],
    drops: [{ itemId: 'ancient_relic', quantity: 2, chance: 0.5 }, { itemId: 'crop_crystalvine', quantity: 1, chance: 0.3 }],
  },
};

export class WildlifeService {
  static getWildlife(id: string): Wildlife | null {
    return WILDLIFE[id] ?? null;
  }

  static getAllWildlife(): Wildlife[] {
    return Object.values(WILDLIFE);
  }

  /** Try to encounter a wild creature in an area */
  static encounterInArea(area: AreaType, season: Season, weather: Weather, timeOfDay: TimeOfDay): Wildlife | null {
    const candidates = Object.values(WILDLIFE).filter((w) =>
      w.habitat.includes(area) &&
      (w.season.includes(season) || w.season.length === 0) &&
      (w.weather.includes(weather) || w.weather.length === 0) &&
      (w.activeTime.includes(timeOfDay) || w.activeTime.length === 0)
    );
    if (!candidates.length) return null;
    // Weight rarer creatures lower
    const rarityWeight: Record<string, number> = { common: 60, uncommon: 25, rare: 10, epic: 4, legendary: 1, mythic: 0.2 };
    const total = candidates.reduce((s, c) => s + (rarityWeight[c.rarity] ?? 1), 0);
    let r = Math.random() * total;
    for (const c of candidates) {
      r -= rarityWeight[c.rarity] ?? 1;
      if (r <= 0) return c;
    }
    return candidates[candidates.length - 1];
  }

  static async getDiscoveries(playerId: string): Promise<PlayerWildlife[]> {
    const result = await db.select().from(schema.wildlifeDiscoveries).where(eq(schema.wildlifeDiscoveries.playerId, playerId));
    return result as unknown as PlayerWildlife[];
  }

  /** Record seeing a creature; returns isNew */
  static async recordSighting(playerId: string, wildlifeId: string): Promise<boolean> {
    const existing = await db.select().from(schema.wildlifeDiscoveries)
      .where(and(eq(schema.wildlifeDiscoveries.playerId, playerId), eq(schema.wildlifeDiscoveries.wildlifeId, wildlifeId))).limit(1);

    if (existing.length > 0) {
      await db.update(schema.wildlifeDiscoveries).set({ timesSeen: existing[0].timesSeen + 1 }).where(eq(schema.wildlifeDiscoveries.id, existing[0].id));
      return false;
    }

    await db.insert(schema.wildlifeDiscoveries).values({ id: randomUUID(), playerId, wildlifeId, firstSeenAt: new Date(), timesSeen: 1, tamed: false });
    await PlayerService.incrementStat(playerId, 'wildlifeFound');
    return true;
  }

  /** Attempt to tame a wild creature */
  static async tame(playerId: string, wildlifeId: string): Promise<{ success: boolean; message: string }> {
    const wildlife = WILDLIFE[wildlifeId];
    if (!wildlife) throw new Error('Wildlife not found');

    // Check items
    for (const cost of wildlife.tameCost) {
      const hasItem = await InventoryService.hasItem(playerId, cost.itemId, cost.quantity);
      if (!hasItem) {
        const { EconomyService } = await import('./EconomyService');
        const def = EconomyService.getItem(cost.itemId);
        throw new Error(`You need ${cost.quantity}x ${def?.name ?? cost.itemId} to tame this creature`);
      }
    }

    // Consume items
    for (const cost of wildlife.tameCost) await InventoryService.removeItem(playerId, cost.itemId, cost.quantity);

    if (chance(wildlife.tameChance)) {
      // Mark as tamed
      await db.update(schema.wildlifeDiscoveries).set({ tamed: true })
        .where(and(eq(schema.wildlifeDiscoveries.playerId, playerId), eq(schema.wildlifeDiscoveries.wildlifeId, wildlifeId)));
      return { success: true, message: `You successfully tamed the **${wildlife.name}** ${wildlife.emoji}! It trusts you now.` };
    }

    return { success: false, message: `The **${wildlife.name}** ${wildlife.emoji} resisted your taming attempt and fled into the shadows.` };
  }

  /** Collect drops from an encounter */
  static async collectDrops(playerId: string, wildlifeId: string): Promise<{ itemId: string; quantity: number }[]> {
    const wildlife = WILDLIFE[wildlifeId];
    if (!wildlife) return [];
    const dropped: { itemId: string; quantity: number }[] = [];
    for (const drop of wildlife.drops) {
      if (chance(drop.chance)) {
        await InventoryService.addItem(playerId, drop.itemId, drop.quantity);
        dropped.push({ itemId: drop.itemId, quantity: drop.quantity });
      }
    }
    return dropped;
  }
}
