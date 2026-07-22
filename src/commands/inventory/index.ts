import { Message } from 'discord.js';
import { Command } from '../../client';
import { PlayerService } from '../../services/PlayerService';
import { InventoryService } from '../../services/InventoryService';
import { EconomyService, ITEMS } from '../../services/EconomyService';
import { createEmbed, errorEmbed } from '../../utils/embed';
import { rarityEmoji } from '../../utils/helpers';

export const command: Command = {
  name: 'inventory',

  async execute(message: Message, args: string[]) {
    const sub = args[0]?.toLowerCase() ?? 'view';
    await message.channel.sendTyping();
    const player = await PlayerService.getOrCreate(message.author.id, message.guildId!, message.author.username);

    if (sub === 'view') {
      const inv = await InventoryService.getInventory(player.id);
      if (!inv.length) {
        return void message.reply({ embeds: [createEmbed({ title: '🎒 Inventory', description: '*Your inventory is empty. Explore, harvest, and buy items to fill it up!*', color: 0x9b59b6 })] });
      }
      const byCategory: Record<string, string[]> = {};
      for (const inv_item of inv) {
        const def = ITEMS[inv_item.itemId];
        const cat = def?.category ?? 'misc';
        if (!byCategory[cat]) byCategory[cat] = [];
        byCategory[cat].push(`${rarityEmoji[def?.rarity ?? 'common']} ${def?.emoji ?? '📦'} **${def?.name ?? inv_item.itemId}** x${inv_item.quantity}`);
      }
      const fields = Object.entries(byCategory).map(([cat, items]) => ({
        name: `📁 ${cat.charAt(0).toUpperCase() + cat.slice(1)}`,
        value: items.join('\n'),
        inline: false,
      }));
      return void message.reply({ embeds: [createEmbed({ title: '🎒 Inventory', color: 0x9b59b6, fields })] });
    }

    if (sub === 'use') {
      const itemId = args[1];
      if (!itemId) return void message.reply({ embeds: [errorEmbed('Usage: `.inventory use <itemId>`')] });
      const def = ITEMS[itemId];
      if (!def) return void message.reply({ embeds: [errorEmbed('Unknown item.')] });
      if (!def.usable) return void message.reply({ embeds: [errorEmbed(`**${def.name}** cannot be used directly.`)] });
      const has = await InventoryService.hasItem(player.id, itemId, 1);
      if (!has) return void message.reply({ embeds: [errorEmbed(`You don't have **${def.name}** in your inventory.`)] });

      if (itemId === 'healing_herb') {
        await InventoryService.removeItem(player.id, itemId, 1);
        const newEnergy = Math.min(player.energyMax, player.energyCurrent + 30);
        const { db, schema } = await import('../../database');
        const { eq } = await import('drizzle-orm');
        await db.update(schema.players).set({ energyCurrent: newEnergy }).where(eq(schema.players.id, player.id));
        return void message.reply({ embeds: [createEmbed({ title: '✅ Used Healing Herb', description: `Restored **30 energy**! Energy: ${newEnergy}/${player.energyMax}`, color: 0x2ecc71 })] });
      }

      if (itemId === 'growth_potion') {
        return void message.reply({ embeds: [createEmbed({ title: '💡 Growth Potion', description: 'Use this from the `.garden` command on a specific plant slot.', color: 0x3498db })] });
      }

      return void message.reply({ embeds: [createEmbed({ title: '📦 Item Used', description: `Used **${def.emoji} ${def.name}**.`, color: 0x2ecc71 })] });
    }

    return void message.reply('Usage: `.inventory view` or `.inventory use <itemId>`');
  },
};
