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
  name: 'nguoichoi',

  async execute(message: Message, args: string[]) {
    const sub = args[0]?.toLowerCase() ?? 'thongtin';
    await message.channel.sendTyping();

    const targetId = (sub === 'xem') ? parseMention(args[1]) : null;
    if (sub === 'xem' && !targetId) return void message.reply({ embeds: [errorEmbed('Cách dùng: `.nguoichoi xem @người`')] });

    const discordUserId = targetId ?? message.author.id;
    const discordUser = targetId
      ? await message.client.users.fetch(targetId).catch(() => null)
      : message.author;

    if (!discordUser) return void message.reply({ embeds: [errorEmbed('Không tìm thấy người dùng.')] });

    const player = await PlayerService.getOrCreate(discordUserId, message.guildId!, discordUser.username);
    if (!player) return void message.reply({ embeds: [errorEmbed('Không tìm thấy người chơi.')] });

    const stats = ((player as any).stats ?? {}) as Record<string, number>;
    const nextLevelXp = levelToXp(player.level + 1);
    const xpProgress = progressBar(player.xp - levelToXp(player.level), nextLevelXp - levelToXp(player.level));

    const embed = createEmbed({
      title: `🌙 ${player.username}`,
      description: `*Một người làm vườn đang khám phá thế giới hoàng hôn.*`,
      color: 0x9b59b6,
      thumbnail: discordUser.displayAvatarURL(),
      fields: [
        { name: '📊 Cấp độ', value: `**${player.level}** ${xpProgress}`, inline: false },
        { name: '🌙 Xu', value: formatCoins(player.coins), inline: true },
        { name: '💎 Đá quý', value: `${player.gems}`, inline: true },
        { name: '⭐ Danh tiếng', value: String(player.reputation), inline: true },
        { name: '📍 Vị trí', value: player.currentArea, inline: true },
        { name: '⚡ Năng lượng', value: `${player.energyCurrent}/${player.energyMax}`, inline: true },
        { name: '📅 Chơi từ', value: timeSince(new Date(player.createdAt)), inline: true },
        { name: '🌾 Mùa vụ đã thu', value: formatNumber(stats.cropsHarvested ?? 0), inline: true },
        { name: '🗺️ Lần khám phá', value: formatNumber(stats.explorationCount ?? 0), inline: true },
        { name: '📜 Nhiệm vụ xong', value: formatNumber(stats.questsCompleted ?? 0), inline: true },
      ],
      timestamp: true,
    });

    return void message.reply({ embeds: [embed] });
  },
};
