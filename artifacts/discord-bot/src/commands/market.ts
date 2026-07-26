import { Message } from "discord.js";
import { EmbedBuilder } from "discord.js";
import { getOrCreatePlayer, formatTime } from "../utils/helpers";
import { COLORS, goldEmbed, errorEmbed, successEmbed } from "../utils/embed";
import { db } from "@workspace/db";
import { auctionsTable, playersTable } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";
import { getSeedById } from "../data/seeds";
import { getItemById } from "../data/items";
import { removeFromInventory, addToInventory } from "../systems/garden";
import { addCoins, removeCoins } from "../systems/economy";

// Mystery merchant — resets every 6 hours
let mysteryStock: { itemId: string; price: number; qty: number } | null = null;
let mysteryReset = 0;

function refreshMystery() {
  const now = Date.now();
  if (now > mysteryReset) {
    const items = [
      { itemId: "seed_golden_flower", price: 30, qty: 1 },
      { itemId: "seed_snow_flower", price: 15, qty: 2 },
      { itemId: "super_fertilizer", price: 20, qty: 3 },
      { itemId: "lucky_charm", price: 50, qty: 1 },
      { itemId: "seed_watermelon", price: 18, qty: 3 },
      { itemId: "seed_cherry", price: 15, qty: 2 },
      { itemId: "trap", price: 40, qty: 1 },
    ];
    mysteryStock = items[Math.floor(Math.random() * items.length)]!;
    mysteryReset = now + 6 * 60 * 60 * 1000;
  }
}

export async function handleMarket(msg: Message, args: string[]) {
  const player = await getOrCreatePlayer(msg.author.id, msg.author.username);
  const sub = args[0]?.toLowerCase();

  if (!sub || sub === "view" || sub === "chợ") {
    refreshMystery();
    const timeLeft = mysteryReset - Date.now();

    let mysteryDesc = "Chợ đen trống!";
    if (mysteryStock) {
      const isSeed = mysteryStock.itemId.startsWith("seed_");
      const rawId = isSeed ? mysteryStock.itemId.replace("seed_", "") : mysteryStock.itemId;
      const data = isSeed ? getSeedById(rawId) : getItemById(rawId);
      if (data) {
        mysteryDesc = `${data.emoji} **${data.name}** × ${mysteryStock.qty} — **${mysteryStock.price}** 🪙\n(Hàng reset sau ${formatTime(timeLeft)})`;
      }
    }

    const auctions = await db.select().from(auctionsTable)
      .where(and(eq(auctionsTable.sold, false), gt(auctionsTable.endsAt, new Date())))
      .limit(5);

    const auctionLines = await Promise.all(auctions.map(async a => {
      const isSeed = a.itemId.startsWith("seed_");
      const rawId = isSeed ? a.itemId.replace("seed_", "") : a.itemId;
      const data = isSeed ? getSeedById(rawId) : getItemById(rawId);
      const seller = await db.select().from(playersTable).where(eq(playersTable.id, a.sellerId)).limit(1);
      const remaining = a.endsAt.getTime() - Date.now();
      return `${data?.emoji ?? "📦"} **${data?.name ?? a.itemId}** ×${a.quantity} — Giá: **${a.currentPrice}**🪙 | Còn: ${formatTime(remaining)} | By: ${seller[0]?.username ?? "?"}`;
    }));

    const embed = new EmbedBuilder()
      .setColor(COLORS.gold)
      .setTitle("🏪 Chợ Đen & Đấu Giá")
      .addFields(
        { name: "🕵️ Thương Nhân Bí Ẩn", value: mysteryDesc, inline: false },
        { name: "🔨 Phiên Đấu Giá", value: auctionLines.join("\n") || "Không có phiên nào!", inline: false },
      )
      .setFooter({ text: ".market buy — mua hàng bí ẩn | .auction <id> <giá> — đặt giá | .auction list — xem tất cả" })
      .setTimestamp();

    return msg.reply({ embeds: [embed] });
  }

  if (sub === "buy" || sub === "mua") {
    refreshMystery();
    if (!mysteryStock) return msg.reply({ embeds: [errorEmbed("Chợ đen đang trống!")] });

    const ok = await removeCoins(player.id, mysteryStock.price);
    if (!ok) return msg.reply({ embeds: [errorEmbed(`Không đủ tiền! Cần ${mysteryStock.price}🪙`)] });

    const boughtItem = { ...mysteryStock };
    await addToInventory(player.id, boughtItem.itemId, boughtItem.qty);
    const isSeed = boughtItem.itemId.startsWith("seed_");
    const rawId = isSeed ? boughtItem.itemId.replace("seed_", "") : boughtItem.itemId;
    const data = isSeed ? getSeedById(rawId) : getItemById(rawId);

    mysteryStock = null; // sold!
    return msg.reply({ embeds: [successEmbed("Mua Hàng Bí Ẩn!", `Đã mua **${data?.name ?? rawId}**! (-${boughtItem.price}🪙)`)] });
  }

  return msg.reply({ embeds: [errorEmbed("`.market` — xem chợ | `.market buy` — mua hàng bí ẩn")] });
}

export async function handleAuction(msg: Message, args: string[]) {
  const player = await getOrCreatePlayer(msg.author.id, msg.author.username);
  const sub = args[0]?.toLowerCase();

  if (sub === "list" || sub === "xem") {
    const auctions = await db.select().from(auctionsTable)
      .where(and(eq(auctionsTable.sold, false), gt(auctionsTable.endsAt, new Date())))
      .limit(10);

    const lines = await Promise.all(auctions.map(async (a, i) => {
      const isSeed = a.itemId.startsWith("seed_");
      const rawId = isSeed ? a.itemId.replace("seed_", "") : a.itemId;
      const data = isSeed ? getSeedById(rawId) : getItemById(rawId);
      const remaining = a.endsAt.getTime() - Date.now();
      return `**#${a.id}** ${data?.emoji ?? "📦"} ${data?.name ?? a.itemId} ×${a.quantity} — **${a.currentPrice}**🪙 | Còn ${formatTime(remaining)}`;
    }));

    const embed = goldEmbed("🔨 Danh Sách Đấu Giá", lines.join("\n") || "Không có phiên đấu giá nào!");
    embed.setFooter({ text: ".auction bid <id> <giá> — Đặt giá | .auction sell <item> <qty> <giá_khởi_điểm>" });
    return msg.reply({ embeds: [embed] });
  }

  if (sub === "sell" || sub === "bán") {
    const itemId = args[1];
    const qty = parseInt(args[2] ?? "1");
    const startPrice = parseInt(args[3] ?? "0");
    if (!itemId || isNaN(qty) || isNaN(startPrice) || startPrice < 1) {
      return msg.reply({ embeds: [errorEmbed("Dùng: `.auction sell <item_id> <số lượng> <giá khởi điểm>`")] });
    }

    const has = await removeFromInventory(player.id, itemId, qty);
    if (!has) return msg.reply({ embeds: [errorEmbed("Không đủ vật phẩm!")] });

    const endsAt = new Date(Date.now() + 12 * 60 * 60 * 1000); // 12 hours
    await db.insert(auctionsTable).values({
      sellerId: player.id,
      itemId, quantity: qty,
      startPrice, currentPrice: startPrice,
      endsAt, sold: false,
    });

    return msg.reply({ embeds: [successEmbed("Đăng Đấu Giá", `Đã đăng **${qty}x ${itemId}** với giá khởi điểm **${startPrice}**🪙 (kết thúc sau 12h)!`)] });
  }

  if (sub === "bid" || sub === "đặt_giá") {
    const auctionId = parseInt(args[1] ?? "");
    const bid = parseInt(args[2] ?? "");
    if (isNaN(auctionId) || isNaN(bid)) return msg.reply({ embeds: [errorEmbed("Dùng: `.auction bid <id> <giá>`")] });

    const auction = await db.select().from(auctionsTable)
      .where(and(eq(auctionsTable.id, auctionId), eq(auctionsTable.sold, false), gt(auctionsTable.endsAt, new Date())))
      .limit(1);

    if (!auction.length) return msg.reply({ embeds: [errorEmbed("Phiên đấu giá không tồn tại hoặc đã kết thúc!")] });
    if (bid <= auction[0]!.currentPrice) return msg.reply({ embeds: [errorEmbed(`Giá phải cao hơn **${auction[0]!.currentPrice}**🪙!`)] });
    if (auction[0]!.sellerId === player.id) return msg.reply({ embeds: [errorEmbed("Không thể đặt giá đồ của chính mình!")] });

    const ok = await removeCoins(player.id, bid);
    if (!ok) return msg.reply({ embeds: [errorEmbed(`Không đủ tiền! Cần ${bid}🪙`)] });

    // Refund previous bidder
    if (auction[0]!.buyerId) {
      await addCoins(auction[0]!.buyerId, auction[0]!.currentPrice);
    }

    await db.update(auctionsTable)
      .set({ currentPrice: bid, buyerId: player.id })
      .where(eq(auctionsTable.id, auctionId));

    return msg.reply({ embeds: [successEmbed("Đặt Giá Thành Công!", `Đặt **${bid}**🪙 cho phiên #${auctionId}!`)] });
  }

  return msg.reply({ embeds: [errorEmbed("`.auction list` | `.auction sell <item> <qty> <giá>` | `.auction bid <id> <giá>`")] });
}
