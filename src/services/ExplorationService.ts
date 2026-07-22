import { db, schema } from '../database';
import { Area, ExplorationEvent, ExplorationReward, AreaType } from '../models/types';
import { randomFrom, chance, randomInt, roll } from '../utils/helpers';
import { PlayerService } from './PlayerService';
import { InventoryService } from './InventoryService';
import { randomUUID } from 'crypto';

export const AREAS: Record<AreaType, Area> = {
  village: {
    id: 'village', name: 'Twilight Village', emoji: '🏘️',
    description: 'The starting hub. Cozy cottages, a market, and friendly faces.',
    minLevel: 1, energyCost: 5,
    events: [
      { id: 'market_deal', name: 'Market Deal', description: 'A merchant offers a rare discount.', probability: 0.3, type: 'find', reward: { coins: randomInt(10, 30) } },
      { id: 'lost_cat', name: 'Lost Cat', description: 'You help find a lost cat. The owner is grateful.', probability: 0.2, type: 'npc', reward: { coins: 25, xp: 20 } },
      { id: 'festival_scraps', name: 'Festival Scraps', description: 'Someone dropped festival goods.', probability: 0.15, type: 'find', reward: { items: [{ itemId: 'healing_herb', quantity: 2 }] } },
    ],
    monsters: [], items: ['healing_herb', 'seed_twilight_rose'],
  },
  forest: {
    id: 'forest', name: 'Twilight Forest', emoji: '🌲',
    description: 'Ancient trees whisper secrets. Wildlife roams freely here.',
    minLevel: 3, energyCost: 15,
    events: [
      { id: 'herb_patch', name: 'Herb Patch', description: 'You find a hidden patch of healing herbs.', probability: 0.3, type: 'find', reward: { items: [{ itemId: 'healing_herb', quantity: 3 }], xp: 15 } },
      { id: 'wolf_encounter', name: 'Wolf Encounter', description: 'A shadow wolf crosses your path.', probability: 0.2, type: 'combat', reward: { coins: 40, xp: 30 } },
      { id: 'ancient_tree', name: 'Ancient Tree', description: 'You discover a tree older than memory. It drops a strange seed.', probability: 0.1, type: 'mystery', reward: { items: [{ itemId: 'seed_moonflower', quantity: 1 }], xp: 50 } },
      { id: 'mushroom_grove', name: 'Mushroom Grove', description: 'A ring of dreamcap mushrooms.', probability: 0.2, type: 'find', reward: { items: [{ itemId: 'seed_dreamcap', quantity: 2 }] } },
    ],
    monsters: ['wolf', 'boar'], items: ['healing_herb', 'seed_moonflower', 'seed_dreamcap'],
  },
  lake: {
    id: 'lake', name: 'Mirror Lake', emoji: '🌊',
    description: 'A still lake that perfectly mirrors the twilight sky.',
    minLevel: 5, energyCost: 20,
    events: [
      { id: 'moonstone_shore', name: 'Moonstone Shore', description: 'You find moonstones along the bank.', probability: 0.2, type: 'find', reward: { items: [{ itemId: 'moonstone', quantity: 1 }], xp: 40 } },
      { id: 'spirit_fish', name: 'Spirit Fish', description: 'A luminous fish leaps and drops a gem.', probability: 0.1, type: 'mystery', reward: { items: [{ itemId: 'moonstone', quantity: 2 }], xp: 60 } },
      { id: 'fisherman_tip', name: "Fisherman's Tip", description: 'An old fisherman shares a secret.', probability: 0.25, type: 'npc', reward: { coins: 50, xp: 25 } },
    ],
    monsters: [], items: ['moonstone'],
  },
  mountain: {
    id: 'mountain', name: 'Starfall Peak', emoji: '⛰️',
    description: 'The highest point in the garden world. Stars feel reachable here.',
    minLevel: 10, energyCost: 30,
    events: [
      { id: 'crystal_vein', name: 'Crystal Vein', description: 'You mine a crystalvine from the rock face.', probability: 0.15, type: 'find', reward: { items: [{ itemId: 'crop_crystalvine', quantity: 1 }], xp: 80 } },
      { id: 'starfall', name: 'Starfall', description: 'A star falls nearby — you grab a fragment.', probability: 0.08, type: 'mystery', reward: { items: [{ itemId: 'moonstone', quantity: 3 }], xp: 120 } },
      { id: 'mountain_eagle', name: 'Mountain Eagle', description: 'An eagle drops its prey — fine loot.', probability: 0.2, type: 'combat', reward: { coins: 80, xp: 50 } },
    ],
    monsters: ['eagle', 'golem'], items: ['moonstone', 'ancient_relic'],
  },
  cave: {
    id: 'cave', name: 'Glowstone Cave', emoji: '🕳️',
    description: 'Bioluminescent fungi light these tunnels with an eerie glow.',
    minLevel: 8, energyCost: 25,
    events: [
      { id: 'treasure_chest', name: 'Treasure Chest', description: 'A dusty chest! Inside: coins and a relic.', probability: 0.1, type: 'treasure', reward: { coins: 150, items: [{ itemId: 'ancient_relic', quantity: 1 }], xp: 100 } },
      { id: 'cave_bat', name: 'Cave Bat Swarm', description: 'Bats scatter your belongings — you recover some coins.', probability: 0.25, type: 'combat', reward: { coins: 30, xp: 20 } },
      { id: 'hidden_passage', name: 'Hidden Passage', description: 'You find a passage to a deeper chamber.', probability: 0.08, type: 'mystery', reward: { items: [{ itemId: 'treasure_map', quantity: 1 }], xp: 150 } },
    ],
    monsters: ['bat', 'cave_spider'], items: ['ancient_relic', 'treasure_map'],
  },
  ruins: {
    id: 'ruins', name: 'Forgotten Ruins', emoji: '🏚️',
    description: 'Crumbling pillars of a civilization lost to time.',
    minLevel: 15, energyCost: 35,
    events: [
      { id: 'relic_dig', name: 'Relic Dig', description: 'You unearth an ancient relic from the rubble.', probability: 0.2, type: 'find', reward: { items: [{ itemId: 'ancient_relic', quantity: 2 }], xp: 100 } },
      { id: 'ghost_encounter', name: 'Ghost Encounter', description: 'A ghost whispers forgotten knowledge.', probability: 0.1, type: 'mystery', reward: { xp: 200, coins: 50 } },
      { id: 'shadow_trap', name: 'Shadow Trap', description: 'A magical trap fires — but you dodge and find the prize.', probability: 0.15, type: 'mystery', reward: { items: [{ itemId: 'seed_shadowbloom', quantity: 1 }], xp: 250 } },
    ],
    monsters: ['skeleton', 'ghost'], items: ['ancient_relic', 'seed_shadowbloom'],
  },
  meadow: {
    id: 'meadow', name: 'Starlight Meadow', emoji: '🌸',
    description: 'A vast meadow where twilight flowers bloom year-round.',
    minLevel: 2, energyCost: 10,
    events: [
      { id: 'flower_find', name: 'Flower Find', description: 'Rare flowers grow wild here.', probability: 0.35, type: 'find', reward: { items: [{ itemId: 'seed_starbloom', quantity: 1 }], xp: 25 } },
      { id: 'butterfly_guide', name: 'Butterfly Guide', description: 'A glowing butterfly leads you to a patch of rare seeds.', probability: 0.15, type: 'mystery', reward: { items: [{ itemId: 'seed_crystalvine', quantity: 1 }], xp: 60 } },
      { id: 'peaceful_rest', name: 'Peaceful Rest', description: 'You rest in the meadow and feel refreshed.', probability: 0.4, type: 'find', reward: { xp: 20, coins: 10 } },
    ],
    monsters: [], items: ['seed_starbloom', 'seed_sunpetal'],
  },
  swamp: {
    id: 'swamp', name: 'Murk Swamp', emoji: '🌿',
    description: 'A murky swamp thick with fog and unusual flora.',
    minLevel: 12, energyCost: 28,
    events: [
      { id: 'swamp_herb', name: 'Swamp Herb', description: 'Rare herbs grow at the water\'s edge.', probability: 0.25, type: 'find', reward: { items: [{ itemId: 'healing_herb', quantity: 5 }], xp: 50 } },
      { id: 'will_o_wisp', name: "Will-o'-Wisp", description: "You follow a wisp — it leads you to a moonstone.", probability: 0.12, type: 'mystery', reward: { items: [{ itemId: 'moonstone', quantity: 2 }], xp: 80 } },
      { id: 'swamp_ambush', name: 'Swamp Ambush', description: 'Something lurks in the muck. You fight it off.', probability: 0.2, type: 'combat', reward: { coins: 60, xp: 45 } },
    ],
    monsters: ['swamp_beast', 'crocodile'], items: ['healing_herb', 'moonstone'],
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
    if (!area) throw new Error('Unknown area');

    const player = await PlayerService.getById(playerId);
    if (!player) throw new Error('Player not found');
    if (player.level < area.minLevel) throw new Error(`You need to be level ${area.minLevel} to explore ${area.name}`);

    const energyOk = await PlayerService.useEnergy(playerId, area.energyCost);
    if (!energyOk) throw new Error(`Not enough energy. You need ${area.energyCost} energy.`);

    // Move player to area
    await PlayerService.moveToArea(playerId, areaId);

    // Pick a random event (weather & time can boost probabilities)
    const event = ExplorationService.pickEvent(area, worldState);
    const reward = { ...event.reward };

    // Apply weather bonuses
    if (worldState.currentWeather === 'magical') {
      if (reward.coins) reward.coins = Math.ceil(reward.coins * 1.5);
      if (reward.xp) reward.xp = Math.ceil(reward.xp * 1.3);
    }

    // Give rewards
    if (reward.coins) await PlayerService.updateCoins(playerId, reward.coins);
    if (reward.xp) await PlayerService.addXp(playerId, reward.xp);
    if (reward.items) {
      for (const item of reward.items) await InventoryService.addItem(playerId, item.itemId, item.quantity);
    }

    // Log exploration
    await db.insert(schema.explorationLogs).values({
      id: randomUUID(), playerId, area: areaId,
      event: event.name, result: event.description,
      reward: reward as any,
      exploredAt: new Date(),
    });

    await PlayerService.incrementStat(playerId, 'explorationCount');

    // Build message
    let message = `**${event.name}**\n${event.description}`;
    const parts: string[] = [];
    if (reward.coins) parts.push(`🌙 **${reward.coins}** mooncoins`);
    if (reward.xp) parts.push(`✨ **${reward.xp}** XP`);
    if (reward.items) {
      for (const it of reward.items) parts.push(`📦 ${it.quantity}x *${it.itemId.replace(/_/g, ' ')}*`);
    }
    if (parts.length) message += `\n\n**Rewards:** ${parts.join(' · ')}`;

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
