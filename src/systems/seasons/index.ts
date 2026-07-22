import { Season } from '../../models/types';
import { GuildService } from '../../services/GuildService';
import { NewsService } from '../../services/NewsService';
import cron from 'node-cron';
import { logger } from '../../utils/logger';

const SEASON_ORDER: Season[] = ['spring', 'summer', 'autumn', 'winter'];

export const SEASON_INFO: Record<Season, { emoji: string; description: string; dayDuration: number }> = {
  spring: { emoji: '🌸', description: 'Hoa nở khắp nơi. Thích hợp để trồng những hạt giống mỏng manh.', dayDuration: 30 },
  summer: { emoji: '☀️', description: 'Những ngày dài rực rỡ. Cánh hoa nắng và tinh hoa sao phát triển tốt nhất.', dayDuration: 30 },
  autumn: { emoji: '🍂', description: 'Mùa thu hoạch và bí ẩn. Hoa trăng đạt đỉnh điểm nở rộ.', dayDuration: 30 },
  winter: { emoji: '❄️', description: 'Khu vườn ngủ dưới tuyết. Hoa bóng tối thức dậy trong màn đêm.', dayDuration: 30 },
};

const SEASON_NAMES: Record<Season, string> = {
  spring: 'Mùa Xuân',
  summer: 'Mùa Hạ',
  autumn: 'Mùa Thu',
  winter: 'Mùa Đông',
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
  await NewsService.postNews(guildId, `${info.emoji} Mùa Đã Thay Đổi: ${SEASON_NAMES[next]}!`, info.description, 'season_change', 3, 48);

  logger.info(`Mùa chuyển sang ${next} cho server ${guildId}`);
  return next;
}

/** Season changes every 30 in-game days. Called from tick engine. */
export function startSeasonSystem(guildIds: string[]): void {
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
