import { Message } from 'discord.js';
import { Command } from '../../client';
import { PlayerService } from '../../services/PlayerService';
import { AchievementService, ACHIEVEMENTS } from '../../services/AchievementService';
import { achievementEmbed } from '../../utils/embed';
import { rarityEmoji } from '../../utils/helpers';

export const command: Command = {
  name: 'thanhtich',

  async execute(message: Message, args: string[]) {
    const sub = args[0]?.toLowerCase() ?? 'cuatoi';
    if ('sendTyping' in message.channel) await (message.channel as any).sendTyping();
    const player = await PlayerService.getOrCreate(message.author.id, message.guildId!, message.author.username);

    const playerAchs = await AchievementService.getPlayerAchievements(player.id);
    const unlockedIds = new Set(playerAchs.map((a) => a.achievementId));

    if (sub === 'cuatoi') {
      if (!playerAchs.length) return void message.reply({ embeds: [achievementEmbed('Thành Tích Của Bạn', '*Chưa có thành tích nào. Tiếp tục chơi nhé!*')] });
      const lines = playerAchs.map((pa) => {
        const a = ACHIEVEMENTS[pa.achievementId];
        return `${a?.emoji ?? '🏆'} **${a?.name ?? pa.achievementId}** ${rarityEmoji[a?.rarity ?? 'common']}\n> ${a?.description ?? ''} — *<t:${Math.floor(new Date(pa.unlockedAt).getTime() / 1000)}:R>*`;
      });
      return void message.reply({ embeds: [achievementEmbed(`Thành Tích Của Bạn (${playerAchs.length}/${Object.keys(ACHIEVEMENTS).length})`, lines.join('\n\n'))] });
    }

    if (sub === 'tatca') {
      const lines = Object.values(ACHIEVEMENTS).map((a) => {
        const unlocked = unlockedIds.has(a.id);
        if (a.secret && !unlocked) return `🔒 **???** ${rarityEmoji[a.rarity]}\n> *Thành tích bí ẩn — tiếp tục khám phá để mở.*`;
        return `${unlocked ? '✅' : '⬜'} ${a.emoji} **${a.name}** ${rarityEmoji[a.rarity]}\n> ${a.description} — 🌙${a.reward.coins} · ✨${a.reward.xp} XP`;
      });
      return void message.reply({ embeds: [achievementEmbed(`Tất Cả Thành Tích (${unlockedIds.size}/${Object.keys(ACHIEVEMENTS).length})`, lines.join('\n\n'))] });
    }

    return void message.reply('Cách dùng: `.thanhtich cuatoi` hoặc `.thanhtich tatca`');
  },
};
