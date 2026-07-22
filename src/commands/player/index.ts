import { Message } from 'discord.js';
import { Command } from '../../client';
import { PlayerService } from '../../services/PlayerService';
import { createEmbed, errorEmbed } from '../../utils/embed';
import { formatCoins, formatNumber, progressBar, levelToXp, timeSince } from '../../utils/helpers';

function parseMention(str: string): string | null {
  const m = str?.match(/^<@!?(\d+)>$/);
  return m ? m[1] : null;
}

export const command: Command = {
  name: 'player',

  async execute(message: Message, args: string[]) {
    const sub = args[0]?.toLowerCase() ?? 'profile';
    await message.channel.sendTyping();

    const targetId = sub === 'view' ? parseMention(args[1]) : null;
    if (sub === 'view' && !targetId) return void message.reply({ embeds: [errorEmbed('Usage: `.player view @user`')] });

    const discordUserId = targetId ?? message.author.id;
    const discordUser = targetId
      ? await message.client.users.fetch(targetId).catch(() => null)
      : message.author;

    if (!discordUser) return void message.reply({ embeds: [errorEmbed('User not found.')] });

    const player = await PlayerService.getOrCreate(discordUserId, message.guildId!, discordUser.username);
    if (!player) return void message.reply({ embeds: [errorEmbed('Player not found.')] });

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

    return void message.reply({ embeds: [embed] });
  },
};
