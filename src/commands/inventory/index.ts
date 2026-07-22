import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../../client';
import { PlayerService } from '../../services/PlayerService';
import { InventoryService } from '../../services/InventoryService';
import { EconomyService, ITEMS } from '../../services/EconomyService';
import { createEmbed, errorEmbed } from '../../utils/embed';
import { rarityEmoji, formatNumber } from '../../utils/helpers';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('inventory')
    .setDescription('View and manage your inventory')
    .addSubcommand((sub) => sub.setName('view').setDescription('View your inventory'))
    .addSubcommand((sub) =>
      sub.setName('use')
        .setDescription('Use an item')
        .addStringOption((o) => o.setName('item').setDescription('Item ID to use').setRequired(true))
    ) as any,

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    const sub = interaction.options.getSubcommand();
    const player = await PlayerService.getOrCreate(interaction.user.id, interaction.guildId!, interaction.user.username);

    if (sub === 'view') {
      const inv = await InventoryService.getInventory(player.id);
      if (!inv.length) {
        const embed = createEmbed({ title: '🎒 Inventory', description: '*Your inventory is empty. Explore, harvest, and buy items to fill it up!*', color: 0x9b59b6 });
        return interaction.editReply({ embeds: [embed] });
      }

      // Group by category
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

      const embed = createEmbed({ title: '🎒 Inventory', color: 0x9b59b6, fields });
      return interaction.editReply({ embeds: [embed] });
    }

    if (sub === 'use') {
      const itemId = interaction.options.getString('item', true);
      const def = ITEMS[itemId];
      if (!def) return interaction.editReply({ embeds: [errorEmbed('Unknown item.')] });
      if (!def.usable) return interaction.editReply({ embeds: [errorEmbed(`**${def.name}** cannot be used directly.`)] });

      const has = await InventoryService.hasItem(player.id, itemId, 1);
      if (!has) return interaction.editReply({ embeds: [errorEmbed(`You don't have **${def.name}** in your inventory.`)] });

      // Handle usable items
      if (itemId === 'healing_herb') {
        await InventoryService.removeItem(player.id, itemId, 1);
        const newEnergy = Math.min(player.energyMax, player.energyCurrent + 30);
        const { db, schema } = await import('../../database');
        const { eq } = await import('drizzle-orm');
        await db.update(schema.players).set({ energyCurrent: newEnergy }).where(eq(schema.players.id, player.id));
        const embed = createEmbed({ title: '✅ Used Healing Herb', description: `Restored **30 energy**! Energy: ${newEnergy}/${player.energyMax}`, color: 0x2ecc71 });
        return interaction.editReply({ embeds: [embed] });
      }

      if (itemId === 'growth_potion') {
        const embed = createEmbed({ title: '💡 Growth Potion', description: 'Use this from the `/garden` command on a specific plant slot.', color: 0x3498db });
        return interaction.editReply({ embeds: [embed] });
      }

      return interaction.editReply({ embeds: [createEmbed({ title: '📦 Item Used', description: `Used **${def.emoji} ${def.name}**.`, color: 0x2ecc71 })] });
    }
  },
};
