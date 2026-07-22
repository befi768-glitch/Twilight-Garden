import { QuestService } from '../../services/QuestService';
import { AchievementService } from '../../services/AchievementService';
import { PlayerService } from '../../services/PlayerService';

export async function afterQuestComplete(playerId: string): Promise<void> {
  await PlayerService.incrementStat(playerId, 'questsCompleted');
  await AchievementService.checkStatAchievements(playerId);
}

export async function checkDailyQuestRefresh(playerId: string): Promise<void> {
  // Daily quests auto-reset; they just need to be re-accepted each day
  // This is handled by the quest availability filter
}
