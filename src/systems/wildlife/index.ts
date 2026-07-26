import { WildlifeService } from '../../services/WildlifeService';
import { JournalService } from '../../services/JournalService';
import { AchievementService } from '../../services/AchievementService';
import { AreaType, Season, Weather, TimeOfDay } from '../../models/types';
import { PlayerService } from '../../services/PlayerService';
import { NewsService } from '../../services/NewsService';

export async function encounterWildlife(playerId: string, area: AreaType, season: Season, weather: Weather, timeOfDay: TimeOfDay, guildId: string) {
  const wildlife = WildlifeService.encounterInArea(area, season, weather, timeOfDay);
  if (!wildlife) return null;

  // FIX: WildlifeService.recordSighting() already calls PlayerService.incrementStat('wildlifeFound')
  // when it's a new sighting, so we must NOT call it again here — that was double-counting the stat.
  const isNew = await WildlifeService.recordSighting(playerId, wildlife.id);
  if (isNew) {
    await JournalService.addEntry(playerId, 'wildlife', wildlife.id, `${wildlife.emoji} ${wildlife.name}`, `First encountered a ${wildlife.name}. ${wildlife.description}`);
    // incrementStat('wildlifeFound') is already called inside recordSighting — do NOT repeat it here
    await AchievementService.checkStatAchievements(playerId);

    if (wildlife.rarity === 'legendary' || wildlife.rarity === 'mythic') {
      const player = await PlayerService.getById(playerId);
      await NewsService.postNews(guildId, `✨ Phát Hiện Hiếm!`, `**${player?.username ?? 'Một người chơi'}** đã khám phá **${wildlife.name}** ${wildlife.emoji} huyền thoại!`, 'rare_spawn', 3, 12);
    }
  }

  return { wildlife, isNew };
}
