import { Message } from 'discord.js';
import { Command } from '../../client';
import { GuildService } from '../../services/GuildService';
import { SEASON_INFO } from '../../systems/seasons';
import { WEATHER_DESCRIPTIONS, WEATHER_EMOJIS } from '../../systems/weather';
import { worldEmbed } from '../../utils/embed';

const TIME_EMOJIS: Record<string, string> = {
  dawn: '🌅', morning: '🌄', afternoon: '☀️', evening: '🌇', night: '🌃', midnight: '🌑',
};

export const command: Command = {
  name: 'the_gioi',

  async execute(message: Message, _args: string[]) {
    if ('sendTyping' in message.channel) await (message.channel as any).sendTyping();
    const world = await GuildService.getOrCreateWorldState(message.guildId!);

    const seasonInfo = SEASON_INFO[world.currentSeason as keyof typeof SEASON_INFO];
    const weatherDesc = WEATHER_DESCRIPTIONS[world.currentWeather as keyof typeof WEATHER_DESCRIPTIONS];
    const timeEmoji = TIME_EMOJIS[world.timeOfDay] ?? '⏰';

    const embed = worldEmbed('Thế Giới Hoàng Hôn', seasonInfo.description)
      .addFields(
        { name: `${seasonInfo.emoji} Mùa`, value: `**${world.currentSeason}**`, inline: true },
        { name: `${WEATHER_EMOJIS[world.currentWeather as keyof typeof WEATHER_EMOJIS] ?? '🌤️'} Thời tiết`, value: `**${world.currentWeather}**`, inline: true },
        { name: `${timeEmoji} Thời điểm`, value: `**${world.timeOfDay}**`, inline: true },
        { name: '📅 Ngày', value: `Ngày thứ **${world.dayNumber}**`, inline: true },
        { name: '⚙️ Vòng thế giới', value: String(world.worldTick), inline: true },
        { name: '📝 Thời tiết chi tiết', value: weatherDesc, inline: false },
      );

    return void message.reply({ embeds: [embed] });
  },
};
