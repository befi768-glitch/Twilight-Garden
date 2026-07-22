import { PetService } from '../../services/PetService';
import { AchievementService } from '../../services/AchievementService';
import { PlayerService } from '../../services/PlayerService';

export async function afterAdopt(playerId: string): Promise<void> {
  await PlayerService.incrementStat(playerId, 'petsOwned');
  await AchievementService.checkStatAchievements(playerId);
}
