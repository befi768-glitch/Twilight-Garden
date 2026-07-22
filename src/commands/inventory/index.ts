import { Message } from 'discord.js';
import { Command } from '../../client';
import { PlayerService } from '../../services/PlayerService';
import { InventoryService } from '../../services/InventoryService';
import { ITEMS } from '../../services/EconomyService';
import { createEmbed, errorEmbed } from '../../utils/embed';
import { rarityEmoji } from '../../utils/helpers';

export const command: Command = {
  name: 'tuido',

  async execute(message: Message, args: string[]) {
    const sub = args[0]?.toLowerCase() ?? 'xem';
    await message.channel.sendTyping();
    const player = await PlayerService.getOrCreate(message.author.id, message.guildId!, message.author.username);

    if (sub === 'xem') {
      const inv = await InventoryService.getInventory(player.id);
      if (!inv.length) {
        return void message.reply({ embeds: [createEmbed({ title: '🎒 Túi Đồ', description: '*Túi đồ trống. Hãy khám phá, thu hoạch và mua sắm để có vật phẩm!*', color: 0x9b59b6 })] });
      }
      const byCategory: Record<string, string[]> = {};
      for (const inv_item of inv) {
        const def = ITEMS[inv_item.itemId];
        const cat = def?.category ?? 'khác';
        if (!byCategory[cat]) byCategory[cat] = [];
        byCategory[cat].push(`${rarityEmoji[def?.rarity ?? 'common']} ${def?.emoji ?? '📦'} **${def?.name ?? inv_item.itemId}** x${inv_item.quantity}`);
      }
      const fields = Object.entries(byCategory).map(([cat, items]) => ({
        name: `📁 ${cat.charAt(0).toUpperCase() + cat.slice(1)}`,
        value: items.join('\n'),
        inline: false,
      }));
      return void message.reply({ embeds: [createEmbed({ title: '🎒 Túi Đồ', color: 0x9b59b6, fields })] });
    }

    if (sub === 'dung') {
      const itemId = args[1];
      if (!itemId) return void message.reply({ embeds: [errorEmbed('Cách dùng: `.tuido dung <mãVật>`')] });
      const def = ITEMS[itemId];
      if (!def) return void message.reply({ embeds: [errorEmbed('Không tìm thấy vật phẩm.')] });
      if (!def.usable) return void message.reply({ embeds: [errorEmbed(`**${def.name}** không thể dùng trực tiếp.`)] });
      const has = await InventoryService.hasItem(player.id, itemId, 1);
      if (!has) return void message.reply({ embeds: [errorEmbed(`Bạn không có **${def.name}** trong túi đồ.`)] });

      if (itemId === 'healing_herb') {
        await InventoryService.removeItem(player.id, itemId, 1);
        const newEnergy = Math.min(player.energyMax, player.energyCurrent + 30);
        const { db, schema } = await import('../../database');
        const { eq } = await import('drizzle-orm');
        await db.update(schema.players).set({ energyCurrent: newEnergy }).where(eq(schema.players.id, player.id));
        return void message.reply({ embeds: [createEmbed({ title: '✅ Đã dùng Thảo Dược Chữa Lành', description: `Hồi phục **30 năng lượng**! Năng lượng: ${newEnergy}/${player.energyMax}`, color: 0x2ecc71 })] });
      }

      if (itemId === 'growth_potion') {
        return void message.reply({ embeds: [createEmbed({ title: '💡 Thuốc Tăng Trưởng', description: 'Dùng vật phẩm này từ lệnh `.vuon` trên một ô cây cụ thể.', color: 0x3498db })] });
      }

      return void message.reply({ embeds: [createEmbed({ title: '📦 Đã Dùng Vật Phẩm', description: `Đã dùng **${def.emoji} ${def.name}**.`, color: 0x2ecc71 })] });
    }

    return void message.reply('Cách dùng: `.tuido xem` hoặc `.tuido dung <mãVật>`');
  },
};
