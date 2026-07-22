import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../../client';
import { GuildService } from '../../services/GuildService';
import { SEASON_INFO } from '../../systems/seasons';
import { WEATHER_DESCRIPTIONS, WEATHER_EMOJIS } from '../../systems/weather';
import { worldEmbed } from '../../utils/embed';

const TIME_EMOJIS: Record<string, string> = {
  dawn: '🌅', morning: '🌄', afternoon: '☀️', evening: '🌇', night: '🌃', midnight: '🌑',
};

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('world')
    .setDescription('View the state of the twilight world'),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    const world = await GuildService.getOrCreateWorldState(interaction.guildId!);

    const seasonInfo = SEASON_INFO[world.currentSeason as keyof typeof SEASON_INFO];
    const weatherDesc = WEATHER_DESCRIPTIONS[world.currentWeather as keyof typeof WEATHER_DESCRIPTIONS];
    const timeEmoji = TIME_EMOJIS[world.timeOfDay] ?? '⏰';

    const embed = worldEmbed('Twilight Garden — World State', seasonInfo.description)
      .addFields(
        { name: `${seasonInfo.emoji} Season`, value: `**${world.currentSeason.charAt(0).toUpperCase() + world.currentSeason.slice(1)}**`, inline: true },
        { name: `${WEATHER_EMOJIS[world.currentWeather as keyof typeof WEATHER_EMOJIS] ?? '🌤️'} Weather`, value: `**${world.currentWeather}**`, inline: true },
        { name: `${timeEmoji} Time of Day`, value: `**${world.timeOfDay}**`, inline: true },
        { name: '📅 Day', value: `Day **${world.dayNumber}**`, inline: true },
        { name: '⚙️ World Tick', value: String(world.worldTick), inline: true },
        { name: '📝 Weather', value: weatherDesc, inline: false },
      );

    return interaction.editReply({ embeds: [embed] });
  },
};
