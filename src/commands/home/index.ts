import { Message } from 'discord.js';
import { Command } from '../../client';
import { PlayerService } from '../../services/PlayerService';
import { HomeService } from '../../services/HomeService';
import { createEmbed, errorEmbed, successEmbed } from '../../utils/embed';
import { formatCoins } from '../../utils/helpers';

const HELP = [
  '**Lệnh Nhà:**',
  '`.home xem` — Xem nhà của bạn',
  '`.home nangcap` — Nâng cấp nhà',
  '`.home doi_ten <tên>` — Đổi tên nhà',
  '`.home mo_ta <mô tả>` — Đặt mô tả nhà',
].join('\n');

export const command: Command = {
  name: 'home',

  async execute(message: Message, args: string[]) {
    const sub = args[0]?.toLowerCase() ?? 'xem';
    await message.channel.sendTyping();
    const player = await PlayerService.getOrCreate(message.author.id, message.guildId!, message.author.username);
    const home = await HomeService.getHome(player.id);
    if (!home) return void message.reply({ embeds: [errorEmbed('Không tìm thấy nhà.')] });

    if (sub === 'xem') {
      const nextUpgrade = HomeService.getNextUpgrade(home.level);
      return void message.reply({ embeds: [createEmbed({
        title: `🏡 ${home.name}`,
        description: home.description,
        color: 0xe67e22,
        fields: [
          { name: '⭐ Cấp độ', value: String(home.level), inline: true },
          { name: '🌱 Ô vườn', value: String(home.gardenSlots), inline: true },
          { name: '📦 Kho', value: String(home.storageSlots), inline: true },
          { name: '⬆️ Nâng cấp tiếp', value: nextUpgrade ? `${nextUpgrade.name} — ${formatCoins(nextUpgrade.cost)}` : '✅ Đã đạt tối đa', inline: false },
        ],
      })] });
    }

    if (sub === 'nangcap') {
      try {
        const result = await HomeService.upgrade(player.id);
        return void message.reply({ embeds: [successEmbed(`🏡 Nâng cấp lên **Cấp ${result.newLevel}: ${result.tier.name}**!\n🌱 ${result.tier.gardenSlots} ô vườn · 📦 ${result.tier.storageSlots} kho`)] });
      } catch (err) {
        return void message.reply({ embeds: [errorEmbed(String(err instanceof Error ? err.message : err))] });
      }
    }

    if (sub === 'doi_ten') {
      const name = args.slice(1).join(' ').slice(0, 40);
      if (!name) return void message.reply({ embeds: [errorEmbed('Cách dùng: `.home doi_ten <tên>`')] });
      await HomeService.setName(player.id, name);
      return void message.reply({ embeds: [successEmbed('Đã đổi tên nhà!')] });
    }

    if (sub === 'mo_ta') {
      const desc = args.slice(1).join(' ').slice(0, 200);
      if (!desc) return void message.reply({ embeds: [errorEmbed('Cách dùng: `.home mo_ta <mô tả>`')] });
      await HomeService.setDescription(player.id, desc);
      return void message.reply({ embeds: [successEmbed('Đã cập nhật mô tả nhà!')] });
    }

    return void message.reply(HELP);
  },
};
