import { Message } from 'discord.js';
import { Command } from '../../client';
import { PlayerService } from '../../services/PlayerService';
import { EconomyService } from '../../services/EconomyService';
import { InventoryService } from '../../services/InventoryService';
import { HomeService } from '../../services/HomeService';
import { GardenService } from '../../services/GardenService';
import { createEmbed, errorEmbed, successEmbed } from '../../utils/embed';
import { formatCoins } from '../../utils/helpers';

function parseMention(str: string): string | null {
  const m = str?.match(/^<@!?(\d+)>$/);
  return m ? m[1] : null;
}

const HELP = [
  '**Lệnh Xã Hội:**',
  '`.social cho_xu @người <số>` — Cho xu',
  '`.social cho_do @người <mãVật> [slg]` — Cho vật phẩm',
  '`.social thamquan @người` — Thăm nhà người chơi',
].join('\n');

export const command: Command = {
  name: 'social',

  async execute(message: Message, args: string[]) {
    const sub = args[0]?.toLowerCase();
    if (!sub) return void message.reply(HELP);

    await message.channel.sendTyping();
    const player = await PlayerService.getOrCreate(message.author.id, message.guildId!, message.author.username);

    const targetId = parseMention(args[1]);
    if (!targetId) return void message.reply({ embeds: [errorEmbed('Vui lòng tag người chơi. Ví dụ: `.social cho_xu @người 100`')] });
    if (targetId === message.author.id) return void message.reply({ embeds: [errorEmbed('Bạn không thể tương tác với chính mình!')] });

    const targetPlayer = await PlayerService.getByDiscord(targetId, message.guildId!);
    if (!targetPlayer) return void message.reply({ embeds: [errorEmbed('Người chơi đó chưa bắt đầu chơi.')] });

    if (sub === 'cho_xu') {
      const amount = parseInt(args[2] ?? '');
      if (!amount) return void message.reply({ embeds: [errorEmbed('Cách dùng: `.social cho_xu @người <số>`')] });
      try {
        await EconomyService.transfer(player.id, targetPlayer.id, amount);
        return void message.reply({ embeds: [successEmbed(`Đã cho **${formatCoins(amount)}** cho **${targetPlayer.username}**! 🎁`)] });
      } catch (err) {
        return void message.reply({ embeds: [errorEmbed(String(err instanceof Error ? err.message : err))] });
      }
    }

    if (sub === 'cho_do') {
      const itemId = args[2];
      const qty = parseInt(args[3] ?? '1') || 1;
      if (!itemId) return void message.reply({ embeds: [errorEmbed('Cách dùng: `.social cho_do @người <mãVật> [slg]`')] });
      const has = await InventoryService.hasItem(player.id, itemId, qty);
      if (!has) return void message.reply({ embeds: [errorEmbed(`Bạn không có ${qty}x ${itemId} trong túi đồ.`)] });
      await InventoryService.removeItem(player.id, itemId, qty);
      await InventoryService.addItem(targetPlayer.id, itemId, qty);
      const { ITEMS } = await import('../../services/EconomyService');
      const def = ITEMS[itemId];
      return void message.reply({ embeds: [successEmbed(`Đã cho **${qty}x ${def?.emoji ?? ''} ${def?.name ?? itemId}** cho **${targetPlayer.username}**! 🎁`)] });
    }

    if (sub === 'thamquan') {
      const home = await HomeService.getHome(targetPlayer.id);
      if (!home) return void message.reply({ embeds: [errorEmbed(`${targetPlayer.username} chưa có nhà.`)] });
      const plants = await GardenService.getPlants(targetPlayer.id);
      const activePlants = plants.filter((p) => p.stage !== 'withered');
      const embed = createEmbed({
        title: `🏡 Thăm nhà của ${targetPlayer.username}`,
        description: `**${home.name}**\n${home.description}`,
        color: 0xe67e22,
        fields: [
          { name: '⭐ Cấp độ nhà', value: String(home.level), inline: true },
          { name: '🌱 Vườn', value: `${activePlants.length} cây đang trồng`, inline: true },
          { name: '📊 Cấp chủ nhà', value: String(targetPlayer.level), inline: true },
        ],
      });
      return void message.reply({ embeds: [embed] });
    }

    return void message.reply(HELP);
  },
};
