import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../../client';
import { PlayerService } from '../../services/PlayerService';
import { WildlifeService, WILDLIFE } from '../../services/WildlifeService';
import { GuildService } from '../../services/GuildService';
import { encounterWildlife } from '../../systems/wildlife';
import { createEmbed, errorEmbed, successEmbed } from '../../utils/embed';
import { rarityEmoji, formatNumber } from '../../utils/helpers';
import { AREAS } from '../../services/ExplorationService';
import { AreaType } from '../../models/types';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('wildlife')
    .setDescription('Discover and interact with wildlife')
    .addSubcommand((sub) => sub.setName('discovered').setDescription('View your wildlife discoveries'))
    .addSubcommand((sub) => sub.setName('bestiary').setDescription('Full bestiary of known creatures'))
    .addSubcommand((sub) =>
      sub.setName('encounter')
        .setDescription('Try to encounter a wild creature in your current area')
    )
    .addSubcommand((sub) =>
      sub.setName('tame')
        .setDescription('Attempt to tame a wild creature')
        .addStringOption((o) => o.setName('creature').setDescription('Wildlife ID').setRequired(true)
          .addChoices(...Object.values(WILDLIFE).map((w) => ({ name: `${w.emoji} ${w.name}`, value: w.id }))))
    ) as any,

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    const sub = interaction.options.getSubcommand();
    const player = await PlayerService.getOrCreate(interaction.user.id, interaction.guildId!, interaction.user.username);
    const world = await GuildService.getOrCreateWorldState(interaction.guildId!);

    if (sub === 'bestiary') {
      const lines = Object.values(WILDLIFE).map((w) =>
        `${rarityEmoji[w.rarity]} **${w.emoji} ${w.name}**\n> ${w.description}\n> 🏕️ ${w.habitat.join(', ')} · 🍂 ${w.season.join(', ')}`
      );
      return interaction.editReply({ embeds: [createEmbed({ title: '📖 Twilight Bestiary', description: lines.join('\n\n'), color: 0x27ae60 })] });
    }

    if (sub === 'discovered') {
      const discoveries = await WildlifeService.getDiscoveries(player.id);
      if (!discoveries.length) return interaction.editReply({ embeds: [createEmbed({ title: '🔭 Wildlife Discovered', description: '*No wildlife discovered yet. Explore different areas!*', color: 0x27ae60 })] });

      const lines = discoveries.map((d) => {
        const w = WILDLIFE[d.wildlifeId];
        return `${rarityEmoji[w?.rarity ?? 'common']} ${w?.emoji ?? '?'} **${w?.name ?? d.wildlifeId}** — Seen ${formatNumber(d.timesSeen)}x${d.tamed ? ' 🤝 *Tamed*' : ''}`;
      });
      return interaction.editReply({ embeds: [createEmbed({ title: `🔭 Wildlife: ${discoveries.length}/${Object.keys(WILDLIFE).length} Discovered`, description: lines.join('\n'), color: 0x27ae60 })] });
    }

    if (sub === 'encounter') {
      const result = await encounterWildlife(player.id, player.currentArea as AreaType, world.currentSeason as any, world.currentWeather as any, world.timeOfDay as any, interaction.guildId!);
      if (!result) {
        return interaction.editReply({ embeds: [createEmbed({ title: '🌿 No Encounter', description: `No wildlife spotted in **${player.currentArea}** right now.\nTry a different area or time of day!`, color: 0x27ae60 })] });
      }
      const { wildlife, isNew } = result;
      const drops = await WildlifeService.collectDrops(player.id, wildlife.id);
      let dropMsg = '';
      if (drops.length) dropMsg = '\n\n**Drops:** ' + drops.map((d) => `${d.quantity}x ${d.itemId}`).join(', ');

      return interaction.editReply({ embeds: [createEmbed({
        title: `${wildlife.emoji} ${wildlife.name}${isNew ? ' — New Discovery! 🆕' : ''}`,
        description: `${wildlife.description}\n*Rarity: ${rarityEmoji[wildlife.rarity]} ${wildlife.rarity}*${dropMsg}`,
        color: 0x27ae60,
      })] });
    }

    if (sub === 'tame') {
      const creatureId = interaction.options.getString('creature', true);
      try {
        const result = await WildlifeService.tame(player.id, creatureId);
        const embed = result.success
          ? successEmbed(result.message)
          : createEmbed({ title: '💨 Taming Failed', description: result.message, color: 0xe74c3c });
        return interaction.editReply({ embeds: [embed] });
      } catch (err) {
        return interaction.editReply({ embeds: [errorEmbed(String(err instanceof Error ? err.message : err))] });
      }
    }
  },
};
