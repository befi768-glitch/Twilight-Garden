import { WildlifeService } from '../../services/WildlifeService';
import { JournalService } from '../../services/JournalService';
import { AchievementService } from '../../services/AchievementService';
import { QuestService } from '../../services/QuestService';
import { PlayerService } from '../../services/PlayerService';
import { AreaType, Season, Weather, TimeOfDay } from '../../models/types';
import { NewsService } from '../../services/NewsService';

export async function encounterWildlife(playerId: string, area: AreaType, season: Season, weather: Weather, timeOfDay: TimeOfDay, guildId: string) {
  const wildlife = WildlifeService.encounterInArea(area, season, weather, timeOfDay);
  if (!wildlife) return null;

  const isNew = await WildlifeService.recordSighting(playerId, wildlife.id);
  if (isNew) {
    await JournalService.addEntry(playerId, 'wildlife', wildlife.id, `${wildlife.emoji} ${wildlife.name}`, `First encountered a ${wildlife.name}. ${wildlife.description}`);
    await PlayerService.incrementStat(playerId, 'wildlifeFound');
    await AchievementService.checkStatAchievements(playerId);

    if (wildlife.rarity === 'legendary' || wildlife.rarity === 'mythic') {
      const player = await PlayerService.getById(playerId);
      await NewsService.postNews(guildId, `✨ Rare Discovery!`, `**${player?.username ?? 'A player'}** discovered the legendary **${wildlife.name}** ${wildlife.emoji}!`, 'rare_spawn', 3, 12);
    }
  }

  return { wildlife, isNew };
}
