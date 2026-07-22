import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../../client';
import { PlayerService } from '../../services/PlayerService';
import { ExplorationService, AREAS } from '../../services/ExplorationService';
import { GuildService } from '../../services/GuildService';
import { encounterWildlife } from '../../systems/wildlife';
import { explorationEmbed, errorEmbed } from '../../utils/embed';
import { AreaType } from '../../models/types';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('explore')
    .setDescription('Explore areas of the twilight world')
    .addSubcommand((sub) => sub.setName('areas').setDescription('List all explorable areas'))
    .addSubcommand((sub) =>
      sub.setName('go')
        .setDescription('Explore a specific area')
        .addStringOption((o) =>
          o.setName('area').setDescription('Area to explore').setRequired(true)
            .addChoices(...Object.values(AREAS).map((a) => ({ name: `${a.emoji} ${a.name}`, value: a.id })))
        )
    )
    .addSubcommand((sub) => sub.setName('history').setDescription('View your recent explorations')) as any,

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    const sub = interaction.options.getSubcommand();
    const player = await PlayerService.getOrCreate(interaction.user.id, interaction.guildId!, interaction.user.username);
    const world = await GuildService.getOrCreateWorldState(interaction.guildId!);

    if (sub === 'areas') {
      const lines = Object.values(AREAS).map((a) =>
        `${a.emoji} **${a.name}** — Min Level: ${a.minLevel} · Energy: ⚡${a.energyCost}\n> ${a.description}`
      );
      return interaction.editReply({ embeds: [explorationEmbed('Explorable Areas', lines.join('\n\n'))] });
    }

    if (sub === 'go') {
      const areaId = interaction.options.getString('area', true) as AreaType;
      try {
        const result = await ExplorationService.explore(player.id, areaId, world);

        // Chance to encounter wildlife
        let wildlifeMsg = '';
        if (Math.random() < 0.4) {
          const enc = await encounterWildlife(player.id, areaId, world.currentSeason as any, world.currentWeather as any, world.timeOfDay as any, interaction.guildId!);
          if (enc) {
            wildlifeMsg = `\n\n🐾 **Wildlife Encounter!** You spotted a **${enc.wildlife.emoji} ${enc.wildlife.name}**${enc.isNew ? ' — *New discovery!* 🆕' : ''}`;
          }
        }

        const area = AREAS[areaId];
        const embed = explorationEmbed(`Explored: ${area.emoji} ${area.name}`, result.message + wildlifeMsg)
          .addFields(
            { name: '⚡ Energy Remaining', value: String(player.energyCurrent - area.energyCost), inline: true },
            { name: '🌤️ Weather', value: world.currentWeather, inline: true },
          );
        return interaction.editReply({ embeds: [embed] });
      } catch (err) {
        return interaction.editReply({ embeds: [errorEmbed(String(err instanceof Error ? err.message : err))] });
      }
    }

    if (sub === 'history') {
      const logs = await ExplorationService.getExplorationHistory(player.id, 8);
      if (!logs.length) return interaction.editReply({ embeds: [explorationEmbed('Exploration History', '*No explorations yet. Use `/explore go` to start your adventure!*')] });

      const lines = logs.map((l) => `**${l.area}** — ${l.event}\n> *<t:${Math.floor(new Date(l.exploredAt).getTime() / 1000)}:R>*`);
      return interaction.editReply({ embeds: [explorationEmbed('Exploration History', lines.join('\n\n'))] });
    }
  },
};
