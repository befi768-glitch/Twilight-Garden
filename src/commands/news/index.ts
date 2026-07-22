import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../../client';
import { PlayerService } from '../../services/PlayerService';
import { NewsService } from '../../services/NewsService';
import { createEmbed } from '../../utils/embed';

const NEWS_TYPE_EMOJIS: Record<string, string> = {
  world_event: '🌍', rare_spawn: '✨', market: '💰', player_achievement: '🏆', season_change: '🍂',
};

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('news')
    .setDescription('Twilight Garden world news')
    .addSubcommand((sub) => sub.setName('latest').setDescription('View the latest world news'))
    .addSubcommand((sub) => sub.setName('offline').setDescription('See what happened while you were away')) as any,

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    const sub = interaction.options.getSubcommand();
    const player = await PlayerService.getOrCreate(interaction.user.id, interaction.guildId!, interaction.user.username);

    if (sub === 'latest') {
      const newsItems = await NewsService.getLatestNews(interaction.guildId!);
      if (!newsItems.length) {
        return interaction.editReply({ embeds: [createEmbed({ title: '📰 World News', description: '*No news yet. The world is quiet... for now.*', color: 0x2980b9 })] });
      }
      const lines = newsItems.map((n) =>
        `${NEWS_TYPE_EMOJIS[n.type] ?? '📰'} **${n.title}**\n> ${n.content}\n> *<t:${Math.floor(new Date(n.createdAt).getTime() / 1000)}:R>*`
      );
      return interaction.editReply({ embeds: [createEmbed({ title: '📰 Latest World News', description: lines.join('\n\n'), color: 0x2980b9 })] });
    }

    if (sub === 'offline') {
      const lastSeen = new Date(player.lastSeen);
      const summary = await NewsService.getOfflineSummary(interaction.guildId!, lastSeen);
      if (!summary.length) {
        return interaction.editReply({ embeds: [createEmbed({ title: '📰 Offline Summary', description: '*Nothing major happened while you were away!*', color: 0x2980b9 })] });
      }
      const lines = summary.map((n) => `${NEWS_TYPE_EMOJIS[n.type] ?? '📰'} **${n.title}**\n> ${n.content}`);
      const embed = createEmbed({
        title: '📰 While You Were Away...',
        description: lines.join('\n\n'),
        color: 0x2980b9,
        footer: `You were away since ${new Date(lastSeen).toLocaleString()}`,
      });
      return interaction.editReply({ embeds: [embed] });
    }
  },
};
