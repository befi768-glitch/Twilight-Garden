import { Message } from 'discord.js';
import { Command } from '../../client';
import { PlayerService } from '../../services/PlayerService';
import { createEmbed } from '../../utils/embed';
import { formatCoins, formatNumber } from '../../utils/helpers';

export const command: Command = {
  name: 'leaderboard',

  async execute(message: Message, args: string[]) {
    const sub = args[0]?.toLowerCase() ?? 'richest';
    await message.channel.sendTyping();

    const field = sub === 'richest' ? 'coins' : sub === 'level' ? 'xp' : 'reputation';
    const players = await PlayerService.getLeaderboard(message.guildId!, field);

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

    return void message.reply({ embeds: [createEmbed({ title: titles[field], description: lines.join('\n') || '*No players yet.*', color: 0xf39c12 })] });
  },
};
