import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../../client';
import { PlayerService } from '../../services/PlayerService';
import { HomeService, HOME_UPGRADES } from '../../services/HomeService';
import { createEmbed, errorEmbed, successEmbed } from '../../utils/embed';
import { formatCoins, formatNumber } from '../../utils/helpers';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('home')
    .setDescription('Manage your home')
    .addSubcommand((sub) => sub.setName('view').setDescription('View your home'))
    .addSubcommand((sub) => sub.setName('upgrade').setDescription('Upgrade your home'))
    .addSubcommand((sub) =>
      sub.setName('rename')
        .setDescription('Rename your home')
        .addStringOption((o) => o.setName('name').setDescription('New name').setRequired(true).setMaxLength(40))
    )
    .addSubcommand((sub) =>
      sub.setName('describe')
        .setDescription('Set your home description')
        .addStringOption((o) => o.setName('description').setDescription('New description').setRequired(true).setMaxLength(200))
    ) as any,

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    const sub = interaction.options.getSubcommand();
    const player = await PlayerService.getOrCreate(interaction.user.id, interaction.guildId!, interaction.user.username);

    const home = await HomeService.getHome(player.id);
    if (!home) return interaction.editReply({ embeds: [errorEmbed('Home not found.')] });

    if (sub === 'view') {
      const nextUpgrade = HomeService.getNextUpgrade(home.level);
      return interaction.editReply({ embeds: [createEmbed({
        title: `🏡 ${home.name}`,
        description: home.description,
        color: 0xe67e22,
        fields: [
          { name: '⭐ Level', value: String(home.level), inline: true },
          { name: '🌱 Garden Slots', value: String(home.gardenSlots), inline: true },
          { name: '📦 Storage', value: String(home.storageSlots), inline: true },
          { name: '⬆️ Next Upgrade', value: nextUpgrade ? `${nextUpgrade.name} — ${formatCoins(nextUpgrade.cost)}` : '✅ Max Level', inline: false },
        ],
      })] });
    }

    if (sub === 'upgrade') {
      try {
        const result = await HomeService.upgrade(player.id);
        return interaction.editReply({ embeds: [successEmbed(`🏡 Upgraded to **Level ${result.newLevel}: ${result.tier.name}**!\n🌱 ${result.tier.gardenSlots} garden slots · 📦 ${result.tier.storageSlots} storage slots`)] });
      } catch (err) {
        return interaction.editReply({ embeds: [errorEmbed(String(err instanceof Error ? err.message : err))] });
      }
    }

    if (sub === 'rename') {
      await HomeService.setName(player.id, interaction.options.getString('name', true));
      return interaction.editReply({ embeds: [successEmbed('Home name updated!')] });
    }

    if (sub === 'describe') {
      await HomeService.setDescription(player.id, interaction.options.getString('description', true));
      return interaction.editReply({ embeds: [successEmbed('Home description updated!')] });
    }
  },
};
