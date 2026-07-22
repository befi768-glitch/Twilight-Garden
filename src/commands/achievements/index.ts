import { Message } from 'discord.js';
import { Command } from '../../client';
import { PlayerService } from '../../services/PlayerService';
import { AchievementService, ACHIEVEMENTS } from '../../services/AchievementService';
import { achievementEmbed } from '../../utils/embed';
import { rarityEmoji } from '../../utils/helpers';

export const command: Command = {
  name: 'achievements',

  async execute(message: Message, args: string[]) {
    const sub = args[0]?.toLowerCase() ?? 'mine';
    await message.channel.sendTyping();
    const player = await PlayerService.getOrCreate(message.author.id, message.guildId!, message.author.username);

    const playerAchs = await AchievementService.getPlayerAchievements(player.id);
    const unlockedIds = new Set(playerAchs.map((a) => a.achievementId));

    if (sub === 'mine') {
      if (!playerAchs.length) return void message.reply({ embeds: [achievementEmbed('Your Achievements', '*No achievements unlocked yet. Keep playing!*')] });
      const lines = playerAchs.map((pa) => {
        const a = ACHIEVEMENTS[pa.achievementId];
        return `${a?.emoji ?? '🏆'} **${a?.name ?? pa.achievementId}** ${rarityEmoji[a?.rarity ?? 'common']}\n> ${a?.description ?? ''} — *<t:${Math.floor(new Date(pa.unlockedAt).getTime() / 1000)}:R>*`;
      });
      return void message.reply({ embeds: [achievementEmbed(`Achievements (${playerAchs.length}/${Object.keys(ACHIEVEMENTS).length})`, lines.join('\n\n'))] });
    }

    if (sub === 'all') {
      const lines = Object.values(ACHIEVEMENTS).map((a) => {
        const unlocked = unlockedIds.has(a.id);
        if (a.secret && !unlocked) return `🔒 **???** ${rarityEmoji[a.rarity]}\n> *Secret achievement — keep exploring to discover it.*`;
        return `${unlocked ? '✅' : '⬜'} ${a.emoji} **${a.name}** ${rarityEmoji[a.rarity]}\n> ${a.description} — 🌙${a.reward.coins} · ✨${a.reward.xp} XP`;
      });
      return void message.reply({ embeds: [achievementEmbed(`All Achievements (${unlockedIds.size}/${Object.keys(ACHIEVEMENTS).length})`, lines.join('\n\n'))] });
    }

    return void message.reply('Usage: `.achievements mine` or `.achievements all`');
  },
};
