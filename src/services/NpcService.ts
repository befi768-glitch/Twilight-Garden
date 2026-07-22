import { eq, and } from 'drizzle-orm';
import { db, schema } from '../database';
import { Npc, PlayerNpcRelation, NpcRelation } from '../models/types';
import { PlayerService } from './PlayerService';
import { InventoryService } from './InventoryService';
import { randomFrom, randomInt, clamp } from '../utils/helpers';
import { randomUUID } from 'crypto';

export const NPCS: Record<string, Npc> = {
  merchant_elara: {
    id: 'merchant_elara', name: 'Elara', emoji: '🧑‍🌾', title: 'The Twilight Merchant',
    description: 'A cheerful merchant who travels between villages selling rare goods.',
    location: 'village', maxRelation: 100,
    schedule: [
      { timeOfDay: 'morning', location: 'village', activity: 'Setting up her stall.' },
      { timeOfDay: 'afternoon', location: 'meadow', activity: 'Picking wildflowers.' },
      { timeOfDay: 'evening', location: 'village', activity: 'Counting her earnings.' },
    ],
    personality: ['cheerful', 'shrewd', 'generous'],
    dialogues: [
      { id: 'd1', trigger: 'greet', text: "Hello, traveler! What brings you to my stall today? I've got some lovely wares if you're interested.", options: [{ text: 'What do you have?', response: "Seeds, potions, and the occasional rarity. Take a look!" }] },
      { id: 'd2', trigger: 'friend', text: "Ah, my favorite customer! I set aside something special for you.", options: [], relationRequired: 50 },
    ],
    trades: [
      { give: { itemId: 'crop_moonflower', quantity: 3 }, receive: { itemId: 'seed_starbloom', quantity: 1 }, stockPerDay: 2, relationRequired: 20 },
      { give: { itemId: 'moonstone', quantity: 1 }, receive: { coins: 200 }, stockPerDay: 5, relationRequired: 0 },
    ],
    questIds: [],
  },
  herbalist_moss: {
    id: 'herbalist_moss', name: 'Old Moss', emoji: '🧙', title: 'The Forest Herbalist',
    description: 'A wise old herbalist who knows the secrets of every plant in the twilight garden.',
    location: 'forest', maxRelation: 100,
    schedule: [
      { timeOfDay: 'dawn', location: 'forest', activity: 'Collecting morning dew.' },
      { timeOfDay: 'morning', location: 'forest', activity: 'Tending forest herbs.' },
      { timeOfDay: 'midnight', location: 'cave', activity: 'Studying glowing fungi.' },
    ],
    personality: ['wise', 'mysterious', 'patient'],
    dialogues: [
      { id: 'd1', trigger: 'greet', text: "Hmm. Another seeker of the garden's wisdom. What do you wish to know?", options: [{ text: 'Tell me about plants.', response: "Each plant holds a piece of the world's soul. Tend them with respect and they will reward you." }] },
      { id: 'd2', trigger: 'deep', text: "You have grown much, young gardener. Let me share a secret of the shadow blooms...", options: [], relationRequired: 70 },
    ],
    trades: [
      { give: { itemId: 'crop_dreamcap', quantity: 5 }, receive: { itemId: 'growth_potion', quantity: 1 }, stockPerDay: 3, relationRequired: 0 },
      { give: { coins: 500 }, receive: { itemId: 'seed_shadowbloom', quantity: 1 }, stockPerDay: 1, relationRequired: 60 },
    ],
    questIds: ['moonstone_collector'],
  },
  wanderer_kira: {
    id: 'wanderer_kira', name: 'Kira', emoji: '🧝', title: 'The Wandering Explorer',
    description: 'A restless explorer who has been to every corner of the garden world.',
    location: 'meadow', maxRelation: 100,
    schedule: [
      { timeOfDay: 'morning', location: 'meadow', activity: 'Sketching the landscape.' },
      { timeOfDay: 'afternoon', location: 'mountain', activity: 'Climbing.' },
      { timeOfDay: 'evening', location: 'lake', activity: 'Watching the reflection.' },
    ],
    personality: ['adventurous', 'curious', 'free-spirited'],
    dialogues: [
      { id: 'd1', trigger: 'greet', text: "Hey there! Just got back from the mountain. The view from Starfall Peak is incredible!", options: [{ text: 'Tell me about your travels.', response: "I\'ve mapped every area here. The ruins are my favorite — ancient mystery at every turn." }] },
    ],
    trades: [
      { give: { itemId: 'ancient_relic', quantity: 2 }, receive: { itemId: 'treasure_map', quantity: 1 }, stockPerDay: 2, relationRequired: 30 },
    ],
    questIds: ['explorer_badge'],
  },
  oracle_nyx: {
    id: 'oracle_nyx', name: 'Nyx', emoji: '🌙', title: 'The Oracle of Twilight',
    description: 'An enigmatic oracle who speaks in riddles and glimpses the future of the garden.',
    location: 'ruins', maxRelation: 80,
    schedule: [
      { timeOfDay: 'midnight', location: 'ruins', activity: 'Communing with the void.' },
      { timeOfDay: 'night', location: 'ruins', activity: 'Reading star patterns.' },
    ],
    personality: ['cryptic', 'all-knowing', 'detached'],
    dialogues: [
      { id: 'd1', trigger: 'greet', text: "...You come seeking answers. The stars speak of your journey — a garden grown from twilight seeds and moonlit dreams.", options: [{ text: 'What is my future?', response: "I see moonflowers blooming in crystal light. Tend your garden well, and the shadows will reward you." }] },
      { id: 'd2', trigger: 'secret', text: "Seek the shadowbloom at the ruins at midnight during a storm. The world will remember your discovery.", options: [], relationRequired: 60 },
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
    await db.insert(schema.npcRelations).values({ id, playerId, npcId, relationScore: 0, relation: 'stranger', giftsGiven: 0 });
    return (await NpcService.getRelation(playerId, npcId))!;
  }

  static async talk(playerId: string, npcId: string): Promise<{ dialogue: string; relationGain: number }> {
    const npc = NPCS[npcId];
    if (!npc) throw new Error('NPC not found');

    const relation = await NpcService.getOrCreateRelation(playerId, npcId);

    // Pick a dialogue based on relation
    const eligible = npc.dialogues.filter((d) => (d.relationRequired ?? 0) <= relation.relationScore);
    const dialogue = eligible.length > 0 ? randomFrom(eligible) : npc.dialogues[0];

    // Gain relation score from talking (diminishing)
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
    if (!npc) throw new Error('NPC not found');

    const hasItem = await InventoryService.hasItem(playerId, itemId, 1);
    if (!hasItem) throw new Error('You do not have that item');

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
      `${npc.name} smiles warmly. "Thank you, this means a lot to me!"`,
      `"Oh, how thoughtful!" ${npc.name} tucks the gift away carefully.`,
      `${npc.name} nods appreciatively. "You have good taste."`,
    ];

    return { relationGain: gain, response: randomFrom(responses) };
  }

  static async getAllRelations(playerId: string): Promise<PlayerNpcRelation[]> {
    const result = await db.select().from(schema.npcRelations).where(eq(schema.npcRelations.playerId, playerId));
    return result as unknown as PlayerNpcRelation[];
  }
}
