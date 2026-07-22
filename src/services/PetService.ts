import { eq, and } from 'drizzle-orm';
import { db, schema } from '../database';
import { Pet, PetDefinition, PetStatus } from '../models/types';
import { chance, randomFrom, clamp } from '../utils/helpers';
import { randomUUID } from 'crypto';

export const PETS: Record<string, PetDefinition> = {
  fox: { id: 'fox', name: 'Cáo Hoàng Hôn', emoji: '🦊', rarity: 'uncommon', description: 'Con cáo khôn ngoan với bộ lông hung đỏ lấp lánh lúc hoàng hôn.', maxLevel: 50, abilities: ['Mũi Thám Thính', 'Lao Nhanh'], passiveBonus: '+10% chiến lợi phẩm khám phá', adoptCost: 300 },
  owl: { id: 'owl', name: 'Cú Mặt Trăng', emoji: '🦉', rarity: 'rare', description: 'Con cú khôn ngoan với đôi mắt sáng như đèn lồng.', maxLevel: 50, abilities: ['Nhìn Đêm', 'Săn Im Lặng'], passiveBonus: '+15% XP vào ban đêm', adoptCost: 500 },
  rabbit: { id: 'rabbit', name: 'Thỏ Ánh Sao', emoji: '🐇', rarity: 'common', description: 'Con thỏ bông có đôi tai viền bạc xinh xắn.', maxLevel: 50, abilities: ['Đào May Mắn', 'Nhảy Nhanh'], passiveBonus: '+5% xu rơi', adoptCost: 150 },
  wolf: { id: 'wolf', name: 'Sói Bóng Tối', emoji: '🐺', rarity: 'epic', description: 'Con sói dũng mãnh sinh ra từ trái tim rừng tối.', maxLevel: 50, abilities: ['Hú Bầy', 'Cắn Hoang Dã'], passiveBonus: '+20% hiệu quả chiến đấu', adoptCost: 800 },
  deer: { id: 'deer', name: 'Nai Pha Lê', emoji: '🦌', rarity: 'rare', description: 'Gạc làm bằng pha lê trong suốt bắt ánh trăng tuyệt đẹp.', maxLevel: 50, abilities: ['Duyên Dáng', 'Đường Rừng'], passiveBonus: '+10% tốc độ tăng trưởng vườn', adoptCost: 600 },
  dragon: { id: 'dragon', name: 'Kỳ Lân Hoàng Hôn', emoji: '🐉', rarity: 'legendary', description: 'Rồng nhỏ thở bụi sao thay vì lửa.', maxLevel: 100, abilities: ['Hơi Thở Sao', 'Cánh Huyền Bí', 'Giác Quan Rồng'], passiveBonus: '+25% toàn bộ chỉ số', adoptCost: 2000 },
  cat: { id: 'cat', name: 'Mèo Bóng Trăng', emoji: '🐈', rarity: 'common', description: 'Con mèo thanh mảnh tan vào bóng tối và xuất hiện với những bí mật.', maxLevel: 50, abilities: ['Trốn Bóng', 'Chín Mạng'], passiveBonus: '+8% hồi năng lượng', adoptCost: 100 },
  phoenix: { id: 'phoenix', name: 'Phượng Hoàng Lửa', emoji: '🔥', rarity: 'mythic', description: 'Sinh ra từ lửa trăng. Cực kỳ hiếm — chỉ xuất hiện một lần mỗi mùa.', maxLevel: 100, abilities: ['Lửa Tái Sinh', 'Vết Rực', 'Hào Quang Nắng'], passiveBonus: '+30% toàn bộ phần thưởng', adoptCost: 5000 },
};

const DECAY_INTERVAL_HOURS = 2;

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
    if (!def) throw new Error('Không tìm thấy loại thú cưng này.');

    const { PlayerService } = await import('./PlayerService');
    const hasEnough = await PlayerService.hasEnoughCoins(playerId, def.adoptCost);
    if (!hasEnough) throw new Error(`Không đủ xu. Phí nhận nuôi là ${def.adoptCost} 🌙`);

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
    if (!pet || pet.playerId !== playerId) throw new Error('Không tìm thấy thú cưng.');

    const { InventoryService } = await import('./InventoryService');
    const hasFood = await InventoryService.hasItem(playerId, 'pet_food', 1);
    if (!hasFood) throw new Error('Không có thức ăn thú cưng trong túi đồ. Mua tại cửa hàng nhé!');

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
    if (!pet || pet.playerId !== playerId) throw new Error('Không tìm thấy thú cưng.');

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
    if (!pet || pet.playerId !== playerId) throw new Error('Không tìm thấy thú cưng.');

    const { InventoryService } = await import('./InventoryService');
    const hasHerb = await InventoryService.hasItem(playerId, 'healing_herb', 1);
    if (!hasHerb) throw new Error('Cần thảo dược chữa lành để chữa bệnh cho thú cưng.');

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
    if (!pet || pet.playerId !== playerId) throw new Error('Không tìm thấy thú cưng.');
    await db.update(schema.pets).set({ name: newName.slice(0, 30) }).where(eq(schema.pets.id, petId));
  }

  static async release(playerId: string, petId: string): Promise<void> {
    const pet = await PetService.getPet(petId);
    if (!pet || pet.playerId !== playerId) throw new Error('Không tìm thấy thú cưng.');
    await db.delete(schema.pets).where(eq(schema.pets.id, petId));
  }
}
