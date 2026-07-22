import { Message } from 'discord.js';
import { Command } from '../../client';
import { PlayerService } from '../../services/PlayerService';
import { createEmbed } from '../../utils/embed';
import { formatCoins, formatNumber } from '../../utils/helpers';

export const command: Command = {
  name: 'leaderboard',

  async execute(message: Message, args: string[]) {
    const sub = args[0]?.toLowerCase() ?? 'giau';
    await message.channel.sendTyping();

    const field = sub === 'giau' ? 'coins' : sub === 'capdo' ? 'xp' : 'reputation';
    const players = await PlayerService.getLeaderboard(message.guildId!, field);

    const medals = ['🥇', '🥈', '🥉'];
    const lines = players.map((p, i) => {
      const medal = medals[i] ?? `**${i + 1}.**`;
      if (field === 'coins') return `${medal} **${p.username}** — ${formatCoins(p.coins)}`;
      if (field === 'xp') return `${medal} **${p.username}** — Cấp ${p.level} · ✨${formatNumber(p.xp)} XP`;
      return `${medal} **${p.username}** — ⭐${formatNumber(p.reputation)} danh tiếng`;
    });

    const titles: Record<string, string> = {
      coins: '🌙 Người Giàu Nhất',
      xp: '✨ Cấp Độ Cao Nhất',
      reputation: '⭐ Danh Tiếng Cao Nhất',
    };

    return void message.reply({ embeds: [createEmbed({ title: titles[field], description: lines.join('\n') || '*Chưa có người chơi nào.*', color: 0xf39c12 })] });
  },
};
