import { Season } from '../../models/types';
import { GuildService } from '../../services/GuildService';
import { NewsService } from '../../services/NewsService';
import cron from 'node-cron';
import { logger } from '../../utils/logger';

const SEASON_ORDER: Season[] = ['spring', 'summer', 'autumn', 'winter'];

export const SEASON_INFO: Record<Season, { emoji: string; description: string; dayDuration: number }> = {
  spring: { emoji: '🌸', description: 'Flowers bloom everywhere. Perfect for planting delicate seeds.', dayDuration: 30 },
  summer: { emoji: '☀️', description: 'Long bright days. Sunpetals and starbloom thrive.', dayDuration: 30 },
  autumn: { emoji: '🍂', description: 'A time of harvest and mystery. Moonflowers peak.', dayDuration: 30 },
  winter: { emoji: '❄️', description: 'The garden sleeps under snow. Shadowblooms stir in the dark.', dayDuration: 30 },
};

export function getNextSeason(current: Season): Season {
  const idx = SEASON_ORDER.indexOf(current);
  return SEASON_ORDER[(idx + 1) % 4];
}

export async function advanceSeason(guildId: string): Promise<Season> {
  const world = await GuildService.getOrCreateWorldState(guildId);
  const next = getNextSeason(world.currentSeason as Season);
  await GuildService.updateWorldState(guildId, { currentSeason: next });

  const info = SEASON_INFO[next];
  await NewsService.postNews(guildId, `${info.emoji} Season Changed: ${next.charAt(0).toUpperCase() + next.slice(1)}!`, info.description, 'season_change', 3, 48);

  logger.info(`Season advanced to ${next} for guild ${guildId}`);
  return next;
}

/** Season changes every 30 in-game days. Called from tick engine. */
export function startSeasonSystem(guildIds: string[]): void {
  // Check season every day
  cron.schedule('0 0 * * *', async () => {
    for (const guildId of guildIds) {
      const world = await GuildService.getOrCreateWorldState(guildId);
      const info = SEASON_INFO[world.currentSeason as Season];
      if (world.dayNumber % info.dayDuration === 0) {
        await advanceSeason(guildId);
      }
    }
  });
}
