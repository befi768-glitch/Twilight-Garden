import { AchievementService, ACHIEVEMENTS } from '../../services/AchievementService';
import { PlayerService } from '../../services/PlayerService';

export async function checkAll(playerId: string): Promise<string[]> {
  const unlocked = await AchievementService.checkStatAchievements(playerId);
  return unlocked.map((a) => `${a.emoji} **${a.name}** unlocked!`);
}
