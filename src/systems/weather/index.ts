import { Weather, Season } from '../../models/types';
import { GuildService } from '../../services/GuildService';
import { chance, randomFrom } from '../../utils/helpers';
import cron from 'node-cron';
import { logger } from '../../utils/logger';

const SEASON_WEATHER: Record<Season, Weather[]> = {
  spring: ['sunny', 'rainy', 'cloudy', 'magical'],
  summer: ['sunny', 'sunny', 'cloudy', 'stormy', 'magical'],
  autumn: ['cloudy', 'rainy', 'foggy', 'sunny', 'stormy'],
  winter: ['snowy', 'foggy', 'cloudy', 'stormy', 'magical'],
};

export function rollWeather(season: Season): Weather {
  const options = SEASON_WEATHER[season];
  return randomFrom(options);
}

export const WEATHER_DESCRIPTIONS: Record<Weather, string> = {
  sunny: '☀️ Bầu trời quang đãng, ánh nắng vàng ấm áp.',
  cloudy: '☁️ Những đám mây nhẹ nhàng trôi qua.',
  rainy: '🌧️ Mưa nhẹ tưới mát khu vườn.',
  stormy: '⛈️ Sấm sét vang rền trên các đỉnh núi.',
  magical: '✨ Không khí lung linh năng lượng huyền bí.',
  snowy: '❄️ Những bông tuyết im lặng rơi xuống trong hoàng hôn.',
  foggy: '🌫️ Màn sương dày đặc cuộn về từ khu rừng.',
};

export const WEATHER_EMOJIS: Record<Weather, string> = {
  sunny: '☀️', cloudy: '☁️', rainy: '🌧️', stormy: '⛈️', magical: '✨', snowy: '❄️', foggy: '🌫️',
};

export function startWeatherSystem(guildIds: string[]): void {
  cron.schedule('0 */2 * * *', async () => {
    for (const guildId of guildIds) {
      const world = await GuildService.getOrCreateWorldState(guildId);
      const newWeather = rollWeather(world.currentSeason as Season);
      await GuildService.updateWorldState(guildId, { currentWeather: newWeather });
      logger.info(`Thời tiết đổi sang ${newWeather} cho server ${guildId}`);
    }
  });
}
