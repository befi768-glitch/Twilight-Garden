import { eq, and } from 'drizzle-orm';
import { db, schema } from '../database';
import { Pet, PetDefinition, PetStatus } from '../models/types';
import { chance, randomFrom, clamp } from '../utils/helpers';
import { randomUUID } from 'crypto';

export const PETS: Record<string, PetDefinition> = {
  fox: { id: 'fox', name: 'Twilight Fox', emoji: '🦊', rarity: 'uncommon', description: 'A clever fox with a russet coat that shimmers at dusk.', maxLevel: 50, abilities: ['Treasure Nose', 'Quick Dash'], passiveBonus: '+10% exploration loot', adoptCost: 300 },
  owl: { id: 'owl', name: 'Moon Owl', emoji: '🦉', rarity: 'rare', description: 'A wise owl with eyes that glow like lanterns.', maxLevel: 50, abilities: ['Night Vision', 'Silent Hunt'], passiveBonus: '+15% XP gain at night', adoptCost: 500 },
  rabbit: { id: 'rabbit', name: 'Starlight Rabbit', emoji: '🐇', rarity: 'common', description: 'A fluffy rabbit with silver-tipped ears.', maxLevel: 50, abilities: ['Lucky Dig', 'Swift Hop'], passiveBonus: '+5% coin drops', adoptCost: 150 },
  wolf: { id: 'wolf', name: 'Shadow Wolf', emoji: '🐺', rarity: 'epic', description: 'A fearless wolf born in the heart of the dark forest.', maxLevel: 50, abilities: ['Pack Howl', 'Feral Strike'], passiveBonus: '+20% combat effectiveness', adoptCost: 800 },
  deer: { id: 'deer', name: 'Crystal Deer', emoji: '🦌', rarity: 'rare', description: 'Antlers made of translucent crystal catch moonlight beautifully.', maxLevel: 50, abilities: ['Gentle Grace', 'Forest Path'], passiveBonus: '+10% garden growth speed', adoptCost: 600 },
  dragon: { id: 'dragon', name: 'Twilight Wyvern', emoji: '🐉', rarity: 'legendary', description: 'A small dragon that breathes stardust instead of fire.', maxLevel: 100, abilities: ['Star Breath', 'Arcane Wings', 'Dragon Sense'], passiveBonus: '+25% all stats', adoptCost: 2000 },
  cat: { id: 'cat', name: 'Moonshadow Cat', emoji: '🐈', rarity: 'common', description: 'A sleek cat that melts into shadows and emerges with secrets.', maxLevel: 50, abilities: ['Shadow Sneak', 'Nine Lives'], passiveBonus: '+8% energy regen', adoptCost: 100 },
  phoenix: { id: 'phoenix', name: 'Ember Phoenix', emoji: '🔥', rarity: 'mythic', description: 'Born from moonfire. Incredibly rare — only seen once a season.', maxLevel: 100, abilities: ['Rebirth Flame', 'Blazing Trail', 'Sunfire Aura'], passiveBonus: '+30% all rewards', adoptCost: 5000 },
};

const DECAY_INTERVAL_HOURS = 2; // hunger/happiness decay every 2 hours

export class PetService {
  static getPetDef(petType: string): PetDefinition | null {
    return PETS[petType] ?? null;
  }

  static getAllPets(): PetDefinition[] {
    return Object.values(PETS);
  }

  static async getPets(playerId: string): Promise<Pet[]> {
    const result = await db.select().from(schema.pets).where(eq(schema.pets.playerId, playerId));
    return result as unknown as Pet[];
  }

  static async getPet(petId: string): Promise<Pet | null> {
    const result = await db.select().from(schema.pets).where(eq(schema.pets.id, petId)).limit(1);
    return result.length > 0 ? (result[0] as unknown as Pet) : null;
  }

  static async adopt(playerId: string, petType: string, name: string): Promise<Pet> {
    const def = PETS[petType];
    if (!def) throw new Error('Unknown pet type');

    const { PlayerService } = await import('./PlayerService');
    const hasEnough = await PlayerService.hasEnoughCoins(playerId, def.adoptCost);
    if (!hasEnough) throw new Error(`Not enough mooncoins. Adoption costs ${def.adoptCost} 🌙`);

    await PlayerService.updateCoins(playerId, -def.adoptCost);

    const id = randomUUID();
    await db.insert(schema.pets).values({
      id, playerId, petType,
      name: name.slice(0, 30),
      level: 1, xp: 0,
      hunger: 100, happiness: 100, bond: 0, health: 100,
      status: 'healthy',
      skills: [],
      lastFed: new Date(), lastPlayed: new Date(),
      adoptedAt: new Date(),
    });

    return (await PetService.getPet(id))!;
  }

  static async feed(playerId: string, petId: string): Promise<Pet> {
    const pet = await PetService.getPet(petId);
    if (!pet || pet.playerId !== playerId) throw new Error('Pet not found');

    const { InventoryService } = await import('./InventoryService');
    const hasFood = await InventoryService.hasItem(playerId, 'pet_food', 1);
    if (!hasFood) throw new Error('No pet food in inventory. Buy some from the shop!');

    await InventoryService.removeItem(playerId, 'pet_food', 1);

    const newHunger = clamp(pet.hunger + 40, 0, 100);
    const newHappiness = clamp(pet.happiness + 10, 0, 100);
    const newBond = clamp(pet.bond + 2, 0, 100);
    const status = PetService.calcStatus(newHunger, newHappiness, pet.health);

    await db.update(schema.pets).set({ hunger: newHunger, happiness: newHappiness, bond: newBond, status, lastFed: new Date() }).where(eq(schema.pets.id, petId));
    return (await PetService.getPet(petId))!;
  }

  static async play(playerId: string, petId: string): Promise<{ xpGained: number; levelUp: boolean }> {
    const pet = await PetService.getPet(petId);
    if (!pet || pet.playerId !== playerId) throw new Error('Pet not found');

    const newHappiness = clamp(pet.happiness + 20, 0, 100);
    const newBond = clamp(pet.bond + 5, 0, 100);
    const xpGained = Math.floor(10 + pet.bond / 10);
    const newXp = pet.xp + xpGained;
    const { xpToLevel } = await import('../utils/helpers');
    const newLevel = Math.min(PETS[pet.petType]?.maxLevel ?? 50, xpToLevel(newXp));
    const levelUp = newLevel > pet.level;

    await db.update(schema.pets).set({ happiness: newHappiness, bond: newBond, xp: newXp, level: newLevel, lastPlayed: new Date() }).where(eq(schema.pets.id, petId));
    return { xpGained, levelUp };
  }

  /** Heal a sick pet using a healing herb */
  static async heal(playerId: string, petId: string): Promise<Pet> {
    const pet = await PetService.getPet(petId);
    if (!pet || pet.playerId !== playerId) throw new Error('Pet not found');

    const { InventoryService } = await import('./InventoryService');
    const hasHerb = await InventoryService.hasItem(playerId, 'healing_herb', 1);
    if (!hasHerb) throw new Error('Need a healing herb to heal your pet');

    await InventoryService.removeItem(playerId, 'healing_herb', 1);
    await db.update(schema.pets).set({ health: 100, status: 'healthy' }).where(eq(schema.pets.id, petId));
    return (await PetService.getPet(petId))!;
  }

  /** Decay stats over time (called by tick engine) */
  static async decayAll(): Promise<void> {
    const allPets = await db.select().from(schema.pets);
    for (const pet of allPets) {
      const hoursSinceFed = pet.lastFed ? (Date.now() - new Date(pet.lastFed).getTime()) / 3600000 : 99;
      const ticks = Math.floor(hoursSinceFed / DECAY_INTERVAL_HOURS);

      const newHunger = clamp(pet.hunger - ticks * 10, 0, 100);
      const newHappiness = clamp(pet.happiness - ticks * 5, 0, 100);
      let newHealth = pet.health;
      if (newHunger === 0) newHealth = clamp(newHealth - 10, 0, 100);

      const status = PetService.calcStatus(newHunger, newHappiness, newHealth);
      await db.update(schema.pets).set({ hunger: newHunger, happiness: newHappiness, health: newHealth, status }).where(eq(schema.pets.id, pet.id));
    }
  }

  private static calcStatus(hunger: number, happiness: number, health: number): PetStatus {
    if (health < 30) return 'sick';
    if (hunger < 20) return 'hungry';
    if (happiness < 20) return 'sad';
    if (hunger < 10 && happiness < 10) return 'neglected';
    if (happiness > 80 && hunger > 70) return 'happy';
    return 'healthy';
  }

  static async rename(playerId: string, petId: string, newName: string): Promise<void> {
    const pet = await PetService.getPet(petId);
    if (!pet || pet.playerId !== playerId) throw new Error('Pet not found');
    await db.update(schema.pets).set({ name: newName.slice(0, 30) }).where(eq(schema.pets.id, petId));
  }

  static async release(playerId: string, petId: string): Promise<void> {
    const pet = await PetService.getPet(petId);
    if (!pet || pet.playerId !== playerId) throw new Error('Pet not found');
    await db.delete(schema.pets).where(eq(schema.pets.id, petId));
  }
}
