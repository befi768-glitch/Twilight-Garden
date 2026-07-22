import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../../client';
import { PlayerService } from '../../services/PlayerService';
import { EconomyService, ITEMS, SHOP_ITEMS } from '../../services/EconomyService';
import { GuildService } from '../../services/GuildService';
import { InventoryService } from '../../services/InventoryService';
import { afterSell, afterBuy } from '../../systems/economy';
import { economyEmbed, errorEmbed, successEmbed } from '../../utils/embed';
import { formatCoins, formatNumber, rarityEmoji } from '../../utils/helpers';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('economy')
    .setDescription('Economy — shop, sell, balance, market')
    .addSubcommand((sub) => sub.setName('balance').setDescription('View your mooncoins balance'))
    .addSubcommand((sub) => sub.setName('shop').setDescription('Browse the twilight shop'))
    .addSubcommand((sub) =>
      sub.setName('buy')
        .setDescription('Buy an item from the shop')
        .addStringOption((o) => o.setName('item').setDescription('Item ID').setRequired(true))
        .addIntegerOption((o) => o.setName('quantity').setDescription('Quantity').setMinValue(1).setMaxValue(99))
    )
    .addSubcommand((sub) =>
      sub.setName('sell')
        .setDescription('Sell items from your inventory')
        .addStringOption((o) => o.setName('item').setDescription('Item ID').setRequired(true))
        .addIntegerOption((o) => o.setName('quantity').setDescription('Quantity').setMinValue(1).setMaxValue(999))
    )
    .addSubcommand((sub) =>
      sub.setName('give')
        .setDescription('Give mooncoins to another player')
        .addUserOption((o) => o.setName('player').setDescription('Recipient').setRequired(true))
        .addIntegerOption((o) => o.setName('amount').setDescription('Amount').setRequired(true).setMinValue(1))
    )
    .addSubcommand((sub) => sub.setName('auctions').setDescription('View active auctions'))
    .addSubcommand((sub) =>
      sub.setName('auction_create')
        .setDescription('Create an auction listing')
        .addStringOption((o) => o.setName('item').setDescription('Item ID').setRequired(true))
        .addIntegerOption((o) => o.setName('quantity').setDescription('Quantity').setRequired(true).setMinValue(1))
        .addIntegerOption((o) => o.setName('start_price').setDescription('Starting bid').setRequired(true).setMinValue(1))
        .addIntegerOption((o) => o.setName('hours').setDescription('Duration in hours (1–48)').setMinValue(1).setMaxValue(48))
    )
    .addSubcommand((sub) =>
      sub.setName('bid')
        .setDescription('Bid on an auction')
        .addStringOption((o) => o.setName('auction_id').setDescription('Auction ID').setRequired(true))
        .addIntegerOption((o) => o.setName('amount').setDescription('Bid amount').setRequired(true).setMinValue(1))
    ) as any,

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    const sub = interaction.options.getSubcommand();
    const player = await PlayerService.getOrCreate(interaction.user.id, interaction.guildId!, interaction.user.username);

    if (sub === 'balance') {
      const embed = economyEmbed('Mooncoins Balance', `${formatCoins(player.coins)}\n💎 **${formatNumber(player.gems)}** gems`)
        .addFields({ name: '📊 Level', value: String(player.level), inline: true }, { name: '✨ XP', value: formatNumber(player.xp), inline: true });
      return interaction.editReply({ embeds: [embed] });
    }

    if (sub === 'shop') {
      const lines = SHOP_ITEMS.map((s) => {
        const item = ITEMS[s.itemId];
        return `${rarityEmoji[item?.rarity ?? 'common']} **${item?.emoji} ${item?.name ?? s.itemId}** — 🌙${s.price}\n> ${item?.description ?? ''}`;
      });
      const embed = economyEmbed('Twilight Shop', lines.join('\n\n'))
        .setFooter({ text: 'Use /economy buy <item_id> to purchase' });
      return interaction.editReply({ embeds: [embed] });
    }

    if (sub === 'buy') {
      const itemId = interaction.options.getString('item', true);
      const qty = interaction.options.getInteger('quantity') ?? 1;
      try {
        const result = await EconomyService.buyFromShop(player.id, itemId, qty);
        await afterBuy(player.id, result.spent);
        const item = ITEMS[itemId];
        return interaction.editReply({ embeds: [successEmbed(`Bought **${qty}x ${item?.emoji ?? ''} ${item?.name ?? itemId}** for 🌙${result.spent}!\nBalance: 🌙${formatNumber(result.newBalance)}`)] });
      } catch (err) {
        return interaction.editReply({ embeds: [errorEmbed(String(err instanceof Error ? err.message : err))] });
      }
    }

    if (sub === 'sell') {
      const itemId = interaction.options.getString('item', true);
      const qty = interaction.options.getInteger('quantity') ?? 1;
      try {
        const result = await EconomyService.sellItem(player.id, itemId, qty);
        await afterSell(player.id, result.earned);
        const item = ITEMS[itemId];
        return interaction.editReply({ embeds: [successEmbed(`Sold **${qty}x ${item?.emoji ?? ''} ${item?.name ?? itemId}** for 🌙${result.earned}!\nBalance: 🌙${formatNumber(result.newBalance)}`)] });
      } catch (err) {
        return interaction.editReply({ embeds: [errorEmbed(String(err instanceof Error ? err.message : err))] });
      }
    }

    if (sub === 'give') {
      const target = interaction.options.getUser('player', true);
      const amount = interaction.options.getInteger('amount', true);
      const recipient = await PlayerService.getByDiscord(target.id, interaction.guildId!);
      if (!recipient) return interaction.editReply({ embeds: [errorEmbed('That player has not started playing yet.')] });
      try {
        await EconomyService.transfer(player.id, recipient.id, amount);
        return interaction.editReply({ embeds: [successEmbed(`Gave **${formatCoins(amount)}** to **${target.username}**!`)] });
      } catch (err) {
        return interaction.editReply({ embeds: [errorEmbed(String(err instanceof Error ? err.message : err))] });
      }
    }

    if (sub === 'auctions') {
      const auctions = await EconomyService.getActiveAuctions();
      if (!auctions.length) return interaction.editReply({ embeds: [economyEmbed('Auction House', '*No active auctions right now.*')] });
      const lines = auctions.slice(0, 10).map((a) => {
        const item = ITEMS[a.itemId];
        return `**ID:** \`${a.id.slice(0, 8)}\` · ${item?.emoji ?? ''} **${item?.name ?? a.itemId}** x${a.quantity}\n🌙 Current: **${a.currentBid}** · Ends: <t:${Math.floor(new Date(a.endsAt).getTime() / 1000)}:R>`;
      });
      return interaction.editReply({ embeds: [economyEmbed('Auction House', lines.join('\n\n'))] });
    }

    if (sub === 'auction_create') {
      const itemId = interaction.options.getString('item', true);
      const qty = interaction.options.getInteger('quantity', true);
      const startPrice = interaction.options.getInteger('start_price', true);
      const hours = interaction.options.getInteger('hours') ?? 12;
      try {
        const auctionId = await EconomyService.createAuction(player.id, itemId, qty, startPrice, hours);
        const item = ITEMS[itemId];
        return interaction.editReply({ embeds: [successEmbed(`Listed **${qty}x ${item?.name ?? itemId}** for auction!\nID: \`${auctionId.slice(0, 8)}\` · Starting bid: 🌙${startPrice} · Duration: ${hours}h`)] });
      } catch (err) {
        return interaction.editReply({ embeds: [errorEmbed(String(err instanceof Error ? err.message : err))] });
      }
    }

    if (sub === 'bid') {
      const auctionId = interaction.options.getString('auction_id', true);
      const amount = interaction.options.getInteger('amount', true);
      try {
        await EconomyService.bid(auctionId, player.id, amount);
        return interaction.editReply({ embeds: [successEmbed(`Bid 🌙${amount} on auction \`${auctionId.slice(0, 8)}\`!`)] });
      } catch (err) {
        return interaction.editReply({ embeds: [errorEmbed(String(err instanceof Error ? err.message : err))] });
      }
    }
  },
};
