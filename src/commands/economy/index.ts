import { Message } from 'discord.js';
import { Command } from '../../client';
import { PlayerService } from '../../services/PlayerService';
import { EconomyService, ITEMS, SHOP_ITEMS } from '../../services/EconomyService';
import { InventoryService } from '../../services/InventoryService';
import { afterSell, afterBuy } from '../../systems/economy';
import { economyEmbed, errorEmbed, successEmbed } from '../../utils/embed';
import { formatCoins, formatNumber, rarityEmoji } from '../../utils/helpers';

function parseMention(str: string): string | null {
  const m = str?.match(/^<@!?(\d+)>$/);
  return m ? m[1] : null;
}

const HELP = [
  '**Lệnh Kinh Tế:**',
  '`.kinhte sodu` — Xem số dư xu',
  '`.kinhte shop` — Xem cửa hàng',
  '`.kinhte mua <mãVật> [sốLượng]` — Mua vật phẩm',
  '`.kinhte ban <mãVật> [sốLượng]` — Bán vật phẩm',
  '`.kinhte cho @người <sốXu>` — Cho xu',
  '`.kinhte daugia` — Xem đấu giá',
  '`.kinhte tao_dg <mãVật> <slg> <giáKĐ> [giờ]` — Tạo đấu giá',
  '`.kinhte dat_gia <mãDG> <sốXu>` — Đặt giá',
].join('\n');

export const command: Command = {
  name: 'kinhte',

  async execute(message: Message, args: string[]) {
    const sub = args[0]?.toLowerCase();
    if (!sub) return void message.reply(HELP);

    if ('sendTyping' in message.channel) await (message.channel as any).sendTyping();
    const player = await PlayerService.getOrCreate(message.author.id, message.guildId!, message.author.username);

    if (sub === 'sodu') {
      const embed = economyEmbed('Số Dư', `${formatCoins(player.coins)}\n💎 **${formatNumber(player.gems)}** đá quý`)
        .addFields({ name: '📊 Cấp độ', value: String(player.level), inline: true }, { name: '✨ Kinh nghiệm', value: formatNumber(player.xp), inline: true });
      return void message.reply({ embeds: [embed] });
    }

    if (sub === 'shop') {
      const lines = SHOP_ITEMS.map((s) => {
        const item = ITEMS[s.itemId];
        return `${rarityEmoji[item?.rarity ?? 'common']} **${item?.emoji} ${item?.name ?? s.itemId}** [\`${s.itemId}\`] — 🌙${s.price}\n> ${item?.description ?? ''}`;
      });
      return void message.reply({ embeds: [economyEmbed('Cửa Hàng Hoàng Hôn', lines.join('\n\n'))] });
    }

    if (sub === 'mua') {
      const itemId = args[1];
      const qty = parseInt(args[2] ?? '1') || 1;
      if (!itemId) return void message.reply({ embeds: [errorEmbed('Cách dùng: `.kinhte mua <mãVật> [sốLượng]`')] });
      try {
        await EconomyService.buyItem(player.id, itemId, qty);
        await afterBuy(player.id, itemId, qty);
        const item = ITEMS[itemId];
        return void message.reply({ embeds: [successEmbed(`Đã mua **${qty}x ${item?.emoji ?? ''} ${item?.name ?? itemId}**!`)] });
      } catch (err) {
        return void message.reply({ embeds: [errorEmbed(String(err instanceof Error ? err.message : err))] });
      }
    }

    if (sub === 'ban') {
      const itemId = args[1];
      const qty = parseInt(args[2] ?? '1') || 1;
      if (!itemId) return void message.reply({ embeds: [errorEmbed('Cách dùng: `.kinhte ban <mãVật> [sốLượng]`')] });
      try {
        const total = await EconomyService.sellItem(player.id, itemId, qty);
        await afterSell(player.id, itemId, qty, total);
        const item = ITEMS[itemId];
        return void message.reply({ embeds: [successEmbed(`Đã bán **${qty}x ${item?.emoji ?? ''} ${item?.name ?? itemId}** được ${formatCoins(total)}!`)] });
      } catch (err) {
        return void message.reply({ embeds: [errorEmbed(String(err instanceof Error ? err.message : err))] });
      }
    }

    if (sub === 'cho') {
      const userId = parseMention(args[1]);
      const amount = parseInt(args[2] ?? '');
      if (!userId || !amount) return void message.reply({ embeds: [errorEmbed('Cách dùng: `.kinhte cho @người <sốXu>`')] });
      const recipient = await PlayerService.getByDiscord(userId, message.guildId!);
      if (!recipient) return void message.reply({ embeds: [errorEmbed('Người chơi đó chưa bắt đầu chơi.')] });
      try {
        await EconomyService.transfer(player.id, recipient.id, amount);
        return void message.reply({ embeds: [successEmbed(`Đã cho **${formatCoins(amount)}** cho **${recipient.username}**!`)] });
      } catch (err) {
        return void message.reply({ embeds: [errorEmbed(String(err instanceof Error ? err.message : err))] });
      }
    }

    if (sub === 'daugia') {
      const auctions = await EconomyService.getActiveAuctions();
      if (!auctions.length) return void message.reply({ embeds: [economyEmbed('Sàn Đấu Giá', '*Không có phiên đấu giá nào đang diễn ra.*')] });
      const lines = auctions.slice(0, 10).map((a) => {
        const item = ITEMS[a.itemId];
        return `**Mã:** \`${a.id.slice(0, 8)}\` · ${item?.emoji ?? ''} **${item?.name ?? a.itemId}** x${a.quantity}\n🌙 Giá hiện tại: **${a.currentBid}** · Kết thúc: <t:${Math.floor(new Date(a.endsAt).getTime() / 1000)}:R>`;
      });
      return void message.reply({ embeds: [economyEmbed('Sàn Đấu Giá', lines.join('\n\n'))] });
    }

    if (sub === 'tao_dg') {
      const itemId = args[1];
      const qty = parseInt(args[2] ?? '');
      const startPrice = parseInt(args[3] ?? '');
      const hours = parseInt(args[4] ?? '12') || 12;
      if (!itemId || !qty || !startPrice) return void message.reply({ embeds: [errorEmbed('Cách dùng: `.kinhte tao_dg <mãVật> <slg> <giáKĐ> [giờ]`')] });
      try {
        const auctionId = await EconomyService.createAuction(player.id, itemId, qty, startPrice, hours);
        const item = ITEMS[itemId];
        return void message.reply({ embeds: [successEmbed(`Đã đăng đấu giá **${qty}x ${item?.name ?? itemId}**!\nMã: \`${auctionId.slice(0, 8)}\` · Giá khởi điểm: 🌙${startPrice} · Thời gian: ${hours} giờ`)] });
      } catch (err) {
        return void message.reply({ embeds: [errorEmbed(String(err instanceof Error ? err.message : err))] });
      }
    }

    if (sub === 'dat_gia') {
      const auctionId = args[1];
      const amount = parseInt(args[2] ?? '');
      if (!auctionId || !amount) return void message.reply({ embeds: [errorEmbed('Cách dùng: `.kinhte dat_gia <mãDG> <sốXu>`')] });
      try {
        await EconomyService.bid(auctionId, player.id, amount);
        return void message.reply({ embeds: [successEmbed(`Đã đặt giá 🌙${amount} cho phiên \`${auctionId.slice(0, 8)}\`!`)] });
      } catch (err) {
        return void message.reply({ embeds: [errorEmbed(String(err instanceof Error ? err.message : err))] });
      }
    }

    return void message.reply(HELP);
  },
};
