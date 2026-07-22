import { Message } from 'discord.js';
import { Command } from '../../client';
import { PlayerService } from '../../services/PlayerService';
import { NewsService } from '../../services/NewsService';
import { createEmbed } from '../../utils/embed';

const NEWS_TYPE_EMOJIS: Record<string, string> = {
  world_event: '🌍', rare_spawn: '✨', market: '💰', player_achievement: '🏆', season_change: '🍂',
};

export const command: Command = {
  name: 'tin_tuc',

  async execute(message: Message, args: string[]) {
    const sub = args[0]?.toLowerCase() ?? 'moinhat';
    await message.channel.sendTyping();
    const player = await PlayerService.getOrCreate(message.author.id, message.guildId!, message.author.username);

    if (sub === 'moinhat') {
      const newsItems = await NewsService.getLatestNews(message.guildId!);
      if (!newsItems.length) {
        return void message.reply({ embeds: [createEmbed({ title: '📰 Tin Tức Thế Giới', description: '*Chưa có tin tức gì. Thế giới đang yên tĩnh... tạm thời thôi.*', color: 0x2980b9 })] });
      }
      const lines = newsItems.map((n) =>
        `${NEWS_TYPE_EMOJIS[n.type] ?? '📰'} **${n.title}**\n> ${n.content}\n> *<t:${Math.floor(new Date(n.createdAt).getTime() / 1000)}:R>*`
      );
      return void message.reply({ embeds: [createEmbed({ title: '📰 Tin Tức Mới Nhất', description: lines.join('\n\n'), color: 0x2980b9 })] });
    }

    if (sub === 'vangmat') {
      const lastSeen = new Date(player.lastSeen);
      const summary = await NewsService.getOfflineSummary(message.guildId!, lastSeen);
      if (!summary.length) {
        return void message.reply({ embeds: [createEmbed({ title: '📰 Tóm Tắt Khi Offline', description: '*Không có gì quan trọng xảy ra khi bạn vắng mặt!*', color: 0x2980b9 })] });
      }
      const lines = summary.map((n) => `${NEWS_TYPE_EMOJIS[n.type] ?? '📰'} **${n.title}**\n> ${n.content}`);
      return void message.reply({ embeds: [createEmbed({
        title: '📰 Trong Lúc Bạn Vắng Mặt...',
        description: lines.join('\n\n'),
        color: 0x2980b9,
        footer: `Bạn offline từ ${new Date(lastSeen).toLocaleString()}`,
      })] });
    }

    return void message.reply('Cách dùng: `.tin_tuc moinhat` hoặc `.tin_tuc vangmat`');
  },
};
