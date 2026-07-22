import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../../client';
import { PlayerService } from '../../services/PlayerService';
import { createEmbed } from '../../utils/embed';
import { formatCoins, formatNumber } from '../../utils/helpers';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('View server leaderboards')
    .addSubcommand((sub) => sub.setName('richest').setDescription('Top players by mooncoins'))
    .addSubcommand((sub) => sub.setName('level').setDescription('Top players by level/XP'))
    .addSubcommand((sub) => sub.setName('reputation').setDescription('Top players by reputation')) as any,

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    const sub = interaction.options.getSubcommand();

    const field = sub === 'richest' ? 'coins' : sub === 'level' ? 'xp' : 'reputation';
    const players = await PlayerService.getLeaderboard(interaction.guildId!, field);

    const medals = ['🥇', '🥈', '🥉'];
    const lines = players.map((p, i) => {
      const medal = medals[i] ?? `**${i + 1}.**`;
      if (field === 'coins') return `${medal} **${p.username}** — ${formatCoins(p.coins)}`;
      if (field === 'xp') return `${medal} **${p.username}** — Lvl ${p.level} · ✨${formatNumber(p.xp)} XP`;
      return `${medal} **${p.username}** — ⭐${formatNumber(p.reputation)} reputation`;
    });

    const titles: Record<string, string> = {
      coins: '🌙 Richest Players',
      xp: '✨ Top Levels',
      reputation: '⭐ Best Reputation',
    };

    return interaction.editReply({ embeds: [createEmbed({ title: titles[field], description: lines.join('\n') || '*No players yet.*', color: 0xf39c12 })] });
  },
};
