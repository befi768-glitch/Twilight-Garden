import { GuildService } from '../../services/GuildService';
import { WorldState } from '../../models/types';

export async function getWorldState(guildId: string): Promise<WorldState> {
  return GuildService.getOrCreateWorldState(guildId);
}
