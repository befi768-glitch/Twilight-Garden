import { Message } from "discord.js";
import { EmbedBuilder } from "discord.js";
import { getOrCreatePlayer } from "../utils/helpers";
import { goldEmbed, errorEmbed, successEmbed, COLORS } from "../utils/embed";
import { buyItem, sellItems } from "../systems/economy";
import { getTodayWeather, getSeasonName, getSeasonEmoji } from "../systems/weather";
import { getSeedsByShopTier, SEEDS } from "../data/seeds";
import { ITEMS } from "../data/items";
import { PETS } from "../data/pets_data";
import { db } from "@workspace/db";
import { playersTable, petsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { addToInventory } from "../systems/garden";
import { removeCoins } from "../systems/economy";

export async function handleShop(msg: Message, args: string[]) {
  const player = await getOrCreatePlayer(msg.author.id, msg.author.username);
  const sub = args[0]?.toLowerCase();

  if (!sub || sub === "view" || sub === "xem") {
    const { season } = await getTodayWeather();
    const availableSeeds = getSeedsByShopTier(season);

    const seedLines = availableSeeds.map(s =>
      `${s.emoji} **${s.id}** — ${s.name} | Mua: ${s.buyPrice}🪙 | Bán: ${s.sellPrice}🪙/cái | ⏱️${Math.round(s.growTimeMs / 60000)}ph`
    );

    const itemLines = Object.values(ITEMS).filter(i => i.buyPrice > 0).slice(0, 8).map(i =>
      `${i.emoji} **${i.id}** — ${i.name} | ${i.buyPrice}🪙 | ${i.description}`
    );

    const embed = new EmbedBuilder()
      .setColor(COLORS.gold)
      .setTitle(`🏪 Cửa Hàng — ${getSeasonEmoji(season)} ${getSeasonName(season)}`)
      .addFields(
        { name: "🌱 Hạt Giống (mùa này)", value: seedLines.join("\n") || "Không có", inline: false },
        { name: "🛍️ Vật Phẩm", value: itemLines.join("\n") || "Không có", inline: false },
      )
      .setFooter({ text: ".buy <id> <số lượng> | .sell <id> <số lượng> | .shop pet" })
      .setTimestamp();

    return msg.reply({ embeds: [embed] });
  }

  if (sub === "pet") {
    const petLines = Object.values(PETS).map(p =>
      `${p.emoji} **${p.id}** — ${p.name} | ${p.buyPrice}🪙\n   └ ${p.ability}`
    );
    const embed = goldEmbed("🐾 Cửa Hàng Thú Cưng", petLines.join("\n\n"));
    embed.setFooter({ text: ".buy pet <id>" });
    return msg.reply({ embeds: [embed] });
  }

  return msg.reply({ embeds: [errorEmbed("`.shop` — xem cửa hàng | `.shop pet` — thú cưng")] });
}

export async function handleBuy(msg: Message, args: string[]) {
  const player = await getOrCreatePlayer(msg.author.id, msg.author.username);

  if (args[0]?.toLowerCase() === "pet") {
    const petId = args[1];
    if (!petId || !PETS[petId]) {
      return msg.reply({ embeds: [errorEmbed("Thú cưng không tồn tại! Xem `.shop pet`")] });
    }
    const pet = PETS[petId]!;
    const existing = await db.select().from(petsTable)
      .where(eq(petsTable.playerId, player.id));
    if (existing.find(p => p.type === petId)) {
      return msg.reply({ embeds: [errorEmbed("Bạn đã có thú cưng này rồi!")] });
    }
    const ok = await removeCoins(player.id, pet.buyPrice);
    if (!ok) return msg.reply({ embeds: [errorEmbed(`Không đủ tiền! Cần ${pet.buyPrice}🪙`)] });

    await db.insert(petsTable).values({
      playerId: player.id,
      type: petId,
      name: pet.name,
      happiness: 100,
    });
    return msg.reply({ embeds: [successEmbed("Mua thú cưng", `${pet.emoji} Đã mua **${pet.name}**! (-${pet.buyPrice}🪙)`)] });
  }

  const itemId = args[0];
  const qty = parseInt(args[1] ?? "1");
  if (!itemId || isNaN(qty) || qty < 1) {
    return msg.reply({ embeds: [errorEmbed("Dùng: `.buy <id> <số lượng>`\nVí dụ: `.buy carrot 5`")] });
  }

  const result = await buyItem(player.id, itemId, qty);
  const embed = result.success ? successEmbed("Mua hàng", result.message) : errorEmbed(result.message);
  return msg.reply({ embeds: [embed] });
}

export async function handleSell(msg: Message, args: string[]) {
  const player = await getOrCreatePlayer(msg.author.id, msg.author.username);
  const itemId = args[0];
  const qty = parseInt(args[1] ?? "1");

  if (!itemId || isNaN(qty) || qty < 1) {
    return msg.reply({ embeds: [errorEmbed("Dùng: `.sell <id> <số lượng>`\nVí dụ: `.sell carrot 10`")] });
  }

  const result = await sellItems(player.id, itemId, qty);
  if (!result.success) return msg.reply({ embeds: [errorEmbed(result.message)] });

  const embed = successEmbed("Bán hàng", `${result.message}\n💰 Nhận được **${result.earned}** 🪙!`);
  return msg.reply({ embeds: [embed] });
}
