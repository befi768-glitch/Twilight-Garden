import { WorldEventService } from '../../services/WorldEventService';
import { GuildService } from '../../services/GuildService';
import { logger } from '../../utils/logger';

export async function tickEvents(guildId: string): Promise<void> {
  await WorldEventService.resolveExpiredEvents();
  const spawned = await WorldEventService.maybeSpawnEvent(guildId);
  if (spawned) logger.info(`World event spawned: ${spawned.name} for guild ${guildId}`);
}
