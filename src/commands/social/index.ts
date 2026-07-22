import { Message } from 'discord.js';
import { Command } from '../../client';
import { PlayerService } from '../../services/PlayerService';
import { EconomyService } from '../../services/EconomyService';
import { InventoryService } from '../../services/InventoryService';
import { HomeService } from '../../services/HomeService';
import { GardenService } from '../../services/GardenService';
import { createEmbed, errorEmbed, successEmbed } from '../../utils/embed';
import { formatCoins, progressBar } from '../../utils/helpers';

function parseMention(str: string): string | null {
  const m = str?.match(/^<@!?(\d+)>$/);
  return m ? m[1] : null;
}

const HELP = [
  '**Social Commands:**',
  '`.social give_coins @user <amount>` — Give coins',
  '`.social give_item @user <itemId> [qty]` — Give an item',
  '`.social visit @user` — Visit a player\'s home',
].join('\n');

export const command: Command = {
  name: 'social',

  async execute(message: Message, args: string[]) {
    const sub = args[0]?.toLowerCase();
    if (!sub) return void message.reply(HELP);

    await message.channel.sendTyping();
    const player = await PlayerService.getOrCreate(message.author.id, message.guildId!, message.author.username);

    const targetId = parseMention(args[1]);
    if (!targetId) return void message.reply({ embeds: [errorEmbed('Please mention a player. Example: `.social give_coins @user 100`')] });
    if (targetId === message.author.id) return void message.reply({ embeds: [errorEmbed('You cannot interact with yourself!')] });

    const targetPlayer = await PlayerService.getByDiscord(targetId, message.guildId!);
    if (!targetPlayer) return void message.reply({ embeds: [errorEmbed('That player has not started playing yet.')] });

    if (sub === 'give_coins') {
      const amount = parseInt(args[2] ?? '');
      if (!amount) return void message.reply({ embeds: [errorEmbed('Usage: `.social give_coins @user <amount>`')] });
      try {
        await EconomyService.transfer(player.id, targetPlayer.id, amount);
        return void message.reply({ embeds: [successEmbed(`Gave **${formatCoins(amount)}** to **${targetPlayer.username}**! 🎁`)] });
      } catch (err) {
        return void message.reply({ embeds: [errorEmbed(String(err instanceof Error ? err.message : err))] });
      }
    }

    if (sub === 'give_item') {
      const itemId = args[2];
      const qty = parseInt(args[3] ?? '1') || 1;
      if (!itemId) return void message.reply({ embeds: [errorEmbed('Usage: `.social give_item @user <itemId> [qty]`')] });
      const has = await InventoryService.hasItem(player.id, itemId, qty);
      if (!has) return void message.reply({ embeds: [errorEmbed(`You don't have ${qty}x ${itemId} in your inventory.`)] });
      await InventoryService.removeItem(player.id, itemId, qty);
      await InventoryService.addItem(targetPlayer.id, itemId, qty);
      const { ITEMS } = await import('../../services/EconomyService');
      const def = ITEMS[itemId];
      return void message.reply({ embeds: [successEmbed(`Gave **${qty}x ${def?.emoji ?? ''} ${def?.name ?? itemId}** to **${targetPlayer.username}**! 🎁`)] });
    }

    if (sub === 'visit') {
      const home = await HomeService.getHome(targetPlayer.id);
      if (!home) return void message.reply({ embeds: [errorEmbed(`${targetPlayer.username} doesn't have a home yet.`)] });
      const plants = await GardenService.getPlants(targetPlayer.id);
      const activePlants = plants.filter((p) => p.stage !== 'withered');
      const embed = createEmbed({
        title: `🏡 Visiting ${targetPlayer.username}'s Home`,
        description: `**${home.name}**\n${home.description}`,
        color: 0xe67e22,
        fields: [
          { name: '⭐ Level', value: String(home.level), inline: true },
          { name: '🌱 Garden', value: `${activePlants.length} active plants`, inline: true },
          { name: '📊 Owner Level', value: String(targetPlayer.level), inline: true },
        ],
      });
      return void message.reply({ embeds: [embed] });
    }

    return void message.reply(HELP);
  },
};
