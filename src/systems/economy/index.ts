import { PlayerService } from '../../services/PlayerService';
import { AchievementService } from '../../services/AchievementService';
import { QuestService } from '../../services/QuestService';

export async function afterSell(playerId: string, amount: number): Promise<void> {
  await PlayerService.incrementStat(playerId, 'coinsEarned', amount);
  await PlayerService.incrementStat(playerId, 'coinsSpent', 0);
  await QuestService.updateObjective(playerId, 'sell', 'coins', amount);
  await AchievementService.checkStatAchievements(playerId);
}

export async function afterBuy(playerId: string, amount: number): Promise<void> {
  await PlayerService.incrementStat(playerId, 'coinsSpent', amount);
}
