import { Message } from "discord.js";
import { EmbedBuilder } from "discord.js";
import { getOrCreatePlayer, calcLevelExp, progressBar } from "../utils/helpers";
import { COLORS } from "../utils/embed";
import { db } from "@workspace/db";
import { inventoryTable, petsTable, playersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { getSeedById } from "../data/seeds";
import { getItemById } from "../data/items";
import { PETS } from "../data/pets_data";

export async function handleProfile(msg: Message, args: string[]) {
  const target = msg.mentions.users.first() ?? msg.author;
  const player = await getOrCreatePlayer(target.id, target.username);

  const expForNext = calcLevelExp(player.level);
  const expProgress = player.exp % expForNext;
  const bar = progressBar(expProgress, expForNext, 12);

  const pets = await db.select().from(petsTable).where(eq(petsTable.playerId, player.id));
  const petList = pets.length > 0
    ? pets.map(p => `${PETS[p.type]?.emoji ?? "🐾"} ${p.name} (Lv.${p.level})`).join(", ")
    : "Chưa có thú cưng";

  const embed = new EmbedBuilder()
    .setColor(COLORS.garden)
    .setTitle(`🌱 Hồ Sơ — ${target.username}`)
    .setThumbnail(target.displayAvatarURL())
    .addFields(
      { name: "💰 Tiền", value: `${player.coins} 🪙`, inline: true },
      { name: "⭐ Level", value: `${player.level}`, inline: true },
      { name: "✨ EXP", value: `${bar} ${expProgress}/${expForNext}`, inline: false },
      { name: "🐾 Thú Cưng", value: petList, inline: false },
    )
    .setTimestamp();

  return msg.reply({ embeds: [embed] });
}

export async function handleInventory(msg: Message) {
  const player = await getOrCreatePlayer(msg.author.id, msg.author.username);
  const inv = await db.select().from(inventoryTable)
    .where(eq(inventoryTable.playerId, player.id))
    .orderBy(inventoryTable.itemId);

  if (!inv.length) {
    const embed = new EmbedBuilder()
      .setColor(COLORS.info)
      .setTitle("🎒 Kho Đồ")
      .setDescription("Kho đồ trống! Trồng cây và thu hoạch để có vật phẩm.");
    return msg.reply({ embeds: [embed] });
  }

  const lines = inv.map(i => {
    const isSeed = i.itemId.startsWith("seed_");
    const rawId = isSeed ? i.itemId.replace("seed_", "") : i.itemId;
    const seedData = isSeed ? getSeedById(rawId) : null;
    const itemData = !isSeed ? getItemById(rawId) : null;
    const name = seedData?.name ?? itemData?.name ?? i.itemId;
    const emoji = seedData?.emoji ?? itemData?.emoji ?? "📦";
    return `${emoji} **${name}** × ${i.quantity}`;
  });

  const embed = new EmbedBuilder()
    .setColor(COLORS.gold)
    .setTitle(`🎒 Kho Đồ — ${msg.author.username}`)
    .setDescription(lines.join("\n"))
    .setFooter({ text: `.sell <id> <số lượng> — Bán vật phẩm` })
    .setTimestamp();

  return msg.reply({ embeds: [embed] });
}

export async function handleLeaderboard(msg: Message) {
  const top = await db.select().from(playersTable)
    .orderBy(desc(playersTable.coins))
    .limit(10);

  const lines = top.map((p, i) => {
    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
    return `${medal} **${p.username}** — ${p.coins}🪙 | Lv.${p.level}`;
  });

  const embed = new EmbedBuilder()
    .setColor(COLORS.gold)
    .setTitle("🏆 Bảng Xếp Hạng")
    .setDescription(lines.join("\n") || "Chưa có ai!")
    .setTimestamp();

  return msg.reply({ embeds: [embed] });
}
