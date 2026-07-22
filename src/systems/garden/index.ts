import { GardenService, PLANTS } from '../../services/GardenService';
import { JournalService } from '../../services/JournalService';
import { AchievementService } from '../../services/AchievementService';
import { QuestService } from '../../services/QuestService';
import { PlayerService } from '../../services/PlayerService';
import { NewsService } from '../../services/NewsService';

export async function afterHarvest(playerId: string, plantType: string, quantity: number, isMutant: boolean, guildId: string): Promise<void> {
  // Update quests
  await QuestService.updateObjective(playerId, 'harvest', plantType, quantity);
  await QuestService.updateObjective(playerId, 'harvest', 'any', quantity);

  // Update stats
  await PlayerService.incrementStat(playerId, 'cropsHarvested', quantity);
  await PlayerService.incrementStat(playerId, 'plantsGrown', 1);

  // Add to journal
  const def = PLANTS[plantType];
  if (def) {
    await JournalService.addEntry(playerId, 'plant', plantType, `${def.emoji} ${def.name}`, `First harvested a ${def.name}. ${def.description}`);
  }

  // Check achievements
  await AchievementService.checkStatAchievements(playerId);

  // Secret achievement for mutant
  if (isMutant) {
    await AchievementService.triggerEvent(playerId, 'mutant_harvest');
  }

  // Post news for legendary harvests
  if (def && (def.rarity === 'legendary' || def.rarity === 'mythic')) {
    const player = await PlayerService.getById(playerId);
    await NewsService.postNews(guildId, `🌑 Rare Harvest!`, `**${player?.username ?? 'A player'}** harvested a legendary **${def.name}**!`, 'player_achievement', 2, 12);
  }
}
