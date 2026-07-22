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
  sunny: '☀️ Clear skies, warm golden light.',
  cloudy: '☁️ Soft clouds drift overhead.',
  rainy: '🌧️ A gentle rain nourishes the garden.',
  stormy: '⛈️ Thunder rumbles across the peaks.',
  magical: '✨ The air shimmers with arcane energy.',
  snowy: '❄️ Silent snowflakes drift through twilight.',
  foggy: '🌫️ A thick mist rolls in from the forest.',
};

export const WEATHER_EMOJIS: Record<Weather, string> = {
  sunny: '☀️', cloudy: '☁️', rainy: '🌧️', stormy: '⛈️', magical: '✨', snowy: '❄️', foggy: '🌫️',
};

export function startWeatherSystem(guildIds: string[]): void {
  // Change weather every 2 hours
  cron.schedule('0 */2 * * *', async () => {
    for (const guildId of guildIds) {
      const world = await GuildService.getOrCreateWorldState(guildId);
      const newWeather = rollWeather(world.currentSeason as Season);
      await GuildService.updateWorldState(guildId, { currentWeather: newWeather });
      logger.info(`Weather changed to ${newWeather} for guild ${guildId}`);
    }
  });
}
