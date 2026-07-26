import { Message } from "discord.js";
import { EmbedBuilder } from "discord.js";
import { getOrCreatePlayer, formatTime } from "../utils/helpers";
import { raidEmbed, errorEmbed, successEmbed, COLORS } from "../utils/embed";
import { canRaid, performRaid, getDefenses, addDefense, canRevenge } from "../systems/pvp";
import { db } from "@workspace/db";
import { petsTable, inventoryTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { removeFromInventory } from "../systems/garden";

export async function handleRaid(msg: Message, args: string[]) {
  const attacker = await getOrCreatePlayer(msg.author.id, msg.author.username);
  const target = msg.mentions.users.first();

  if (!target) return msg.reply({ embeds: [errorEmbed("Dùng: `.raid @người`")] });
  if (target.id === msg.author.id) return msg.reply({ embeds: [errorEmbed("Không thể tự raid mình!")] });
  if (target.bot) return msg.reply({ embeds: [errorEmbed("Không thể raid bot!")] });

  const { canRaid: ok, cooldownMs } = await canRaid(attacker.id);
  if (!ok) {
    return msg.reply({ embeds: [errorEmbed(`Bạn cần chờ **${formatTime(cooldownMs!)}** nữa để raid!`)] });
  }

  const defender = await getOrCreatePlayer(target.id, target.username);

  // Check lucky charm
  const hasCharm = await removeFromInventory(attacker.id, "lucky_charm", 1);

  const pets = await db.select().from(petsTable).where(eq(petsTable.playerId, attacker.id));
  const passives = pets.map(p => p.type);

  const result = await performRaid(attacker.id, defender.id, passives, hasCharm);

  if (result.success) {
    const embed = raidEmbed(
      "Raid Thành Công!",
      `🗡️ **${msg.author.username}** đột kích vườn của **${target.username}**!\n\n${result.message}`
    );
    return msg.reply({ embeds: [embed] });
  } else {
    const embed = new EmbedBuilder()
      .setColor(COLORS.warning)
      .setTitle("⚔️ Raid Thất Bại!")
      .setDescription(`${msg.author.username} cố đột kích **${target.username}** nhưng thất bại!\n\n${result.message}`)
      .setTimestamp();
    return msg.reply({ embeds: [embed] });
  }
}

export async function handleRevenge(msg: Message, args: string[]) {
  const player = await getOrCreatePlayer(msg.author.id, msg.author.username);
  const target = msg.mentions.users.first();
  if (!target) return msg.reply({ embeds: [errorEmbed("Dùng: `.revenge @người`")] });

  const targetPlayer = await getOrCreatePlayer(target.id, target.username);
  const canRev = await canRevenge(player.id, targetPlayer.id);
  if (!canRev) return msg.reply({ embeds: [errorEmbed("Bạn không có quyền báo thù người này (chưa bị họ raid trong 24h)!")] });

  const { canRaid: ok, cooldownMs } = await canRaid(player.id);
  if (!ok) return msg.reply({ embeds: [errorEmbed(`Chờ **${formatTime(cooldownMs!)}** nữa!`)] });

  const pets = await db.select().from(petsTable).where(eq(petsTable.playerId, player.id));
  const passives = pets.map(p => p.type);

  // Revenge: +20% success bonus
  const result = await performRaid(player.id, targetPlayer.id, [...passives, "explore_boost"], false);

  const embed = result.success
    ? raidEmbed("Báo Thù Thành Công!", `💢 **${msg.author.username}** đã báo thù **${target.username}**!\n\n${result.message}`)
    : raidEmbed("Báo Thù Thất Bại", `${result.message}`);

  return msg.reply({ embeds: [embed] });
}

export async function handleDefense(msg: Message, args: string[]) {
  const player = await getOrCreatePlayer(msg.author.id, msg.author.username);
  const sub = args[0]?.toLowerCase();

  if (!sub || sub === "view") {
    const defenses = await getDefenses(player.id);
    const defenseEmojis: Record<string, string> = {
      fence: "🪜", scarecrow: "🎃", trap: "🪤", guard_dog: "🐕",
    };
    const defNames: Record<string, string> = {
      fence: "Hàng rào", scarecrow: "Bù nhìn", trap: "Bẫy", guard_dog: "Chó canh",
    };

    const lines = defenses.map(d =>
      `${defenseEmojis[d.type] ?? "🛡️"} **${defNames[d.type] ?? d.type}** — Lv.${d.level} | Độ bền: ${d.durability}%`
    );

    const embed = new EmbedBuilder()
      .setColor(COLORS.info)
      .setTitle(`🛡️ Phòng Thủ Vườn`)
      .setDescription(lines.length ? lines.join("\n") : "Chưa có phòng thủ!\nMua ở `.shop` và dùng `.defense add <loại>`")
      .setFooter({ text: "Loại: fence | scarecrow | trap" })
      .setTimestamp();

    return msg.reply({ embeds: [embed] });
  }

  if (sub === "add" || sub === "thêm") {
    const type = args[1]?.toLowerCase();
    const validTypes = ["fence", "scarecrow", "trap"];
    if (!type || !validTypes.includes(type)) {
      return msg.reply({ embeds: [errorEmbed(`Loại phòng thủ hợp lệ: ${validTypes.join(", ")}`)] });
    }

    // Check inventory
    const hasItem = await removeFromInventory(player.id, type, 1);
    if (!hasItem) {
      return msg.reply({ embeds: [errorEmbed(`Bạn không có **${type}**! Mua ở \`.shop\``)] });
    }

    await addDefense(player.id, type);
    return msg.reply({ embeds: [successEmbed("Phòng Thủ", `Đã đặt phòng thủ **${type}** vào vườn!`)] });
  }

  return msg.reply({ embeds: [errorEmbed("`.defense` — xem | `.defense add <loại>` — đặt bẫy")] });
}
