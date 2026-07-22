import { Message } from 'discord.js';
import { Command } from '../../client';
import { PlayerService } from '../../services/PlayerService';
import { NewsService } from '../../services/NewsService';
import { createEmbed } from '../../utils/embed';

const NEWS_TYPE_EMOJIS: Record<string, string> = {
  world_event: '🌍', rare_spawn: '✨', market: '💰', player_achievement: '🏆', season_change: '🍂',
};

export const command: Command = {
  name: 'news',

  async execute(message: Message, args: string[]) {
    const sub = args[0]?.toLowerCase() ?? 'latest';
    await message.channel.sendTyping();
    const player = await PlayerService.getOrCreate(message.author.id, message.guildId!, message.author.username);

    if (sub === 'latest') {
      const newsItems = await NewsService.getLatestNews(message.guildId!);
      if (!newsItems.length) {
        return void message.reply({ embeds: [createEmbed({ title: '📰 World News', description: '*No news yet. The world is quiet... for now.*', color: 0x2980b9 })] });
      }
      const lines = newsItems.map((n) =>
        `${NEWS_TYPE_EMOJIS[n.type] ?? '📰'} **${n.title}**\n> ${n.content}\n> *<t:${Math.floor(new Date(n.createdAt).getTime() / 1000)}:R>*`
      );
      return void message.reply({ embeds: [createEmbed({ title: '📰 Latest World News', description: lines.join('\n\n'), color: 0x2980b9 })] });
    }

    if (sub === 'offline') {
      const lastSeen = new Date(player.lastSeen);
      const summary = await NewsService.getOfflineSummary(message.guildId!, lastSeen);
      if (!summary.length) {
        return void message.reply({ embeds: [createEmbed({ title: '📰 Offline Summary', description: '*Nothing major happened while you were away!*', color: 0x2980b9 })] });
      }
      const lines = summary.map((n) => `${NEWS_TYPE_EMOJIS[n.type] ?? '📰'} **${n.title}**\n> ${n.content}`);
      return void message.reply({ embeds: [createEmbed({
        title: '📰 While You Were Away...',
        description: lines.join('\n\n'),
        color: 0x2980b9,
        footer: `You were away since ${new Date(lastSeen).toLocaleString()}`,
      })] });
    }

    return void message.reply('Usage: `.news latest` or `.news offline`');
  },
};
