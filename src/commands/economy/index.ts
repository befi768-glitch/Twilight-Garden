import { Message } from 'discord.js';
import { Command } from '../../client';
import { PlayerService } from '../../services/PlayerService';
import { EconomyService, ITEMS, SHOP_ITEMS } from '../../services/EconomyService';
import { GuildService } from '../../services/GuildService';
import { InventoryService } from '../../services/InventoryService';
import { afterSell, afterBuy } from '../../systems/economy';
import { economyEmbed, errorEmbed, successEmbed } from '../../utils/embed';
import { formatCoins, formatNumber, rarityEmoji } from '../../utils/helpers';

function parseMention(str: string): string | null {
  const m = str?.match(/^<@!?(\d+)>$/);
  return m ? m[1] : null;
}

const HELP = [
  '**Economy Commands:**',
  '`.economy balance` — View your balance',
  '`.economy shop` — Browse the shop',
  '`.economy buy <itemId> [qty]` — Buy an item',
  '`.economy sell <itemId> [qty]` — Sell an item',
  '`.economy give @user <amount>` — Give coins',
  '`.economy auctions` — View auctions',
  '`.economy auction_create <itemId> <qty> <startPrice> [hours]` — Create auction',
  '`.economy bid <auctionId> <amount>` — Bid on auction',
].join('\n');

export const command: Command = {
  name: 'economy',

  async execute(message: Message, args: string[]) {
    const sub = args[0]?.toLowerCase();
    if (!sub) return void message.reply(HELP);

    await message.channel.sendTyping();
    const player = await PlayerService.getOrCreate(message.author.id, message.guildId!, message.author.username);

    if (sub === 'balance') {
      const embed = economyEmbed('Mooncoins Balance', `${formatCoins(player.coins)}\n💎 **${formatNumber(player.gems)}** gems`)
        .addFields({ name: '📊 Level', value: String(player.level), inline: true }, { name: '✨ XP', value: formatNumber(player.xp), inline: true });
      return void message.reply({ embeds: [embed] });
    }

    if (sub === 'shop') {
      const lines = SHOP_ITEMS.map((s) => {
        const item = ITEMS[s.itemId];
        return `${rarityEmoji[item?.rarity ?? 'common']} **${item?.emoji} ${item?.name ?? s.itemId}** [\`${s.itemId}\`] — 🌙${s.price}\n> ${item?.description ?? ''}`;
      });
      const embed = economyEmbed('Twilight Shop', lines.join('\n\n'));
      return void message.reply({ embeds: [embed] });
    }

    if (sub === 'buy') {
      const itemId = args[1];
      const qty = parseInt(args[2] ?? '1') || 1;
      if (!itemId) return void message.reply({ embeds: [errorEmbed('Usage: `.economy buy <itemId> [qty]`')] });
      try {
        await EconomyService.buyItem(player.id, itemId, qty);
        await afterBuy(player.id, itemId, qty);
        const item = ITEMS[itemId];
        return void message.reply({ embeds: [successEmbed(`Bought **${qty}x ${item?.emoji ?? ''} ${item?.name ?? itemId}**!`)] });
      } catch (err) {
        return void message.reply({ embeds: [errorEmbed(String(err instanceof Error ? err.message : err))] });
      }
    }

    if (sub === 'sell') {
      const itemId = args[1];
      const qty = parseInt(args[2] ?? '1') || 1;
      if (!itemId) return void message.reply({ embeds: [errorEmbed('Usage: `.economy sell <itemId> [qty]`')] });
      try {
        const total = await EconomyService.sellItem(player.id, itemId, qty);
        await afterSell(player.id, itemId, qty, total);
        const item = ITEMS[itemId];
        return void message.reply({ embeds: [successEmbed(`Sold **${qty}x ${item?.emoji ?? ''} ${item?.name ?? itemId}** for ${formatCoins(total)}!`)] });
      } catch (err) {
        return void message.reply({ embeds: [errorEmbed(String(err instanceof Error ? err.message : err))] });
      }
    }

    if (sub === 'give') {
      const userId = parseMention(args[1]);
      const amount = parseInt(args[2] ?? '');
      if (!userId || !amount) return void message.reply({ embeds: [errorEmbed('Usage: `.economy give @user <amount>`')] });
      const recipient = await PlayerService.getByDiscord(userId, message.guildId!);
      if (!recipient) return void message.reply({ embeds: [errorEmbed('That player has not started playing yet.')] });
      try {
        await EconomyService.transfer(player.id, recipient.id, amount);
        return void message.reply({ embeds: [successEmbed(`Gave **${formatCoins(amount)}** to **${recipient.username}**!`)] });
      } catch (err) {
        return void message.reply({ embeds: [errorEmbed(String(err instanceof Error ? err.message : err))] });
      }
    }

    if (sub === 'auctions') {
      const auctions = await EconomyService.getActiveAuctions();
      if (!auctions.length) return void message.reply({ embeds: [economyEmbed('Auction House', '*No active auctions right now.*')] });
      const lines = auctions.slice(0, 10).map((a) => {
        const item = ITEMS[a.itemId];
        return `**ID:** \`${a.id.slice(0, 8)}\` · ${item?.emoji ?? ''} **${item?.name ?? a.itemId}** x${a.quantity}\n🌙 Current: **${a.currentBid}** · Ends: <t:${Math.floor(new Date(a.endsAt).getTime() / 1000)}:R>`;
      });
      return void message.reply({ embeds: [economyEmbed('Auction House', lines.join('\n\n'))] });
    }

    if (sub === 'auction_create') {
      const itemId = args[1];
      const qty = parseInt(args[2] ?? '');
      const startPrice = parseInt(args[3] ?? '');
      const hours = parseInt(args[4] ?? '12') || 12;
      if (!itemId || !qty || !startPrice) return void message.reply({ embeds: [errorEmbed('Usage: `.economy auction_create <itemId> <qty> <startPrice> [hours]`')] });
      try {
        const auctionId = await EconomyService.createAuction(player.id, itemId, qty, startPrice, hours);
        const item = ITEMS[itemId];
        return void message.reply({ embeds: [successEmbed(`Listed **${qty}x ${item?.name ?? itemId}** for auction!\nID: \`${auctionId.slice(0, 8)}\` · Starting bid: 🌙${startPrice} · Duration: ${hours}h`)] });
      } catch (err) {
        return void message.reply({ embeds: [errorEmbed(String(err instanceof Error ? err.message : err))] });
      }
    }

    if (sub === 'bid') {
      const auctionId = args[1];
      const amount = parseInt(args[2] ?? '');
      if (!auctionId || !amount) return void message.reply({ embeds: [errorEmbed('Usage: `.economy bid <auctionId> <amount>`')] });
      try {
        await EconomyService.bid(auctionId, player.id, amount);
        return void message.reply({ embeds: [successEmbed(`Bid 🌙${amount} on auction \`${auctionId.slice(0, 8)}\`!`)] });
      } catch (err) {
        return void message.reply({ embeds: [errorEmbed(String(err instanceof Error ? err.message : err))] });
      }
    }

    return void message.reply(HELP);
  },
};
