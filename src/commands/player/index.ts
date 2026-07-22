import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../../client';
import { PlayerService } from '../../services/PlayerService';
import { createEmbed, errorEmbed } from '../../utils/embed';
import { formatCoins, formatNumber, progressBar, xpToLevel, levelToXp, timeSince } from '../../utils/helpers';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('player')
    .setDescription('View player profile and stats')
    .addSubcommand((sub) => sub.setName('profile').setDescription('View your profile'))
    .addSubcommand((sub) =>
      sub.setName('view')
        .setDescription('View another player\'s profile')
        .addUserOption((o) => o.setName('user').setDescription('Player to view').setRequired(true))
    ) as any,

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    const sub = interaction.options.getSubcommand();

    const discordUser = sub === 'view' ? interaction.options.getUser('user', true) : interaction.user;
    const player = await PlayerService.getOrCreate(discordUser.id, interaction.guildId!, discordUser.username);
    if (!player) return interaction.editReply({ embeds: [errorEmbed('Player not found.')] });

    const stats = ((player as any).stats ?? {}) as Record<string, number>;
    const nextLevelXp = levelToXp(player.level + 1);
    const xpProgress = progressBar(player.xp - levelToXp(player.level), nextLevelXp - levelToXp(player.level));

    const embed = createEmbed({
      title: `🌙 ${player.username}`,
      description: `*A twilight gardener exploring the enchanted world.*`,
      color: 0x9b59b6,
      thumbnail: discordUser.displayAvatarURL(),
      fields: [
        { name: '📊 Level', value: `**${player.level}** ${xpProgress}`, inline: false },
        { name: '🌙 Coins', value: formatCoins(player.coins), inline: true },
        { name: '💎 Gems', value: `${player.gems}`, inline: true },
        { name: '⭐ Reputation', value: String(player.reputation), inline: true },
        { name: '📍 Location', value: player.currentArea, inline: true },
        { name: '⚡ Energy', value: `${player.energyCurrent}/${player.energyMax}`, inline: true },
        { name: '📅 Playing Since', value: timeSince(new Date(player.createdAt)), inline: true },
        { name: '🌾 Crops Harvested', value: formatNumber(stats.cropsHarvested ?? 0), inline: true },
        { name: '🗺️ Explorations', value: formatNumber(stats.explorationCount ?? 0), inline: true },
        { name: '📜 Quests Done', value: formatNumber(stats.questsCompleted ?? 0), inline: true },
      ],
      timestamp: true,
    });

    return interaction.editReply({ embeds: [embed] });
  },
};
