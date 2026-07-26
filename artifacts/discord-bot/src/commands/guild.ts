import { Message } from "discord.js";
import { EmbedBuilder } from "discord.js";
import { getOrCreatePlayer } from "../utils/helpers";
import { COLORS, errorEmbed, successEmbed } from "../utils/embed";
import { createGuild, joinGuild, donateToGuild, getPlayerGuild, getGuildMembers } from "../systems/guild";
import { db } from "@workspace/db";
import { guildsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export async function handleGuildCmd(msg: Message, args: string[]) {
  const player = await getOrCreatePlayer(msg.author.id, msg.author.username);
  const sub = args[0]?.toLowerCase();

  if (!sub || sub === "view" || sub === "info") {
    const guild = await getPlayerGuild(player.id);
    if (!guild) {
      return msg.reply({ embeds: [errorEmbed("Bạn chưa trong hội nào!\n`.guild create <tên>` — Tạo hội\n`.guild join <id>` — Gia nhập hội")] });
    }

    const members = await getGuildMembers(guild.id);
    const memberLines = members.map(m => {
      const roleIcon = m.role === "owner" ? "👑" : m.role === "officer" ? "⚔️" : "👤";
      return `${roleIcon} **${m.username}** Lv.${m.level} — Đóng góp: ${m.contribution}🪙`;
    });

    const embed = new EmbedBuilder()
      .setColor(COLORS.garden)
      .setTitle(`🏰 Hội: ${guild.name}`)
      .addFields(
        { name: "💎 Cấp Hội", value: `${guild.level}`, inline: true },
        { name: "🏦 Ngân Quỹ", value: `${guild.bank}🪙`, inline: true },
        { name: "👥 Thành Viên", value: `${members.length}`, inline: true },
        { name: "📋 Danh Sách", value: memberLines.join("\n") || "Trống", inline: false },
      )
      .setFooter({ text: `.guild donate <số> — Đóng góp | ID Hội: ${guild.id}` })
      .setTimestamp();

    return msg.reply({ embeds: [embed] });
  }

  if (sub === "create" || sub === "tạo") {
    const name = args.slice(1).join(" ");
    if (!name) return msg.reply({ embeds: [errorEmbed("Dùng: `.guild create <tên hội>`")] });
    const result = await createGuild(player.id, msg.guild?.id ?? "dm", name);
    const embed = result.success ? successEmbed("Tạo Hội", result.message) : errorEmbed(result.message);
    return msg.reply({ embeds: [embed] });
  }

  if (sub === "join" || sub === "gia_nhập") {
    const guildId = parseInt(args[1] ?? "");
    if (isNaN(guildId)) return msg.reply({ embeds: [errorEmbed("Dùng: `.guild join <ID hội>`")] });
    const result = await joinGuild(player.id, guildId);
    const embed = result.success ? successEmbed("Gia Nhập Hội", result.message) : errorEmbed(result.message);
    return msg.reply({ embeds: [embed] });
  }

  if (sub === "donate" || sub === "đóng_góp") {
    const amount = parseInt(args[1] ?? "");
    if (isNaN(amount) || amount < 1) return msg.reply({ embeds: [errorEmbed("Dùng: `.guild donate <số tiền>`")] });
    const result = await donateToGuild(player.id, amount);
    const embed = result.success ? successEmbed("Đóng Góp Hội", result.message) : errorEmbed(result.message);
    return msg.reply({ embeds: [embed] });
  }

  if (sub === "list" || sub === "danh_sách") {
    const guilds = await db.select().from(guildsTable).limit(10);
    const lines = guilds.map(g => `🏰 **${g.name}** — Lv.${g.level} | ID: \`${g.id}\``);
    const embed = new EmbedBuilder()
      .setColor(COLORS.info)
      .setTitle("🏰 Danh Sách Hội")
      .setDescription(lines.join("\n") || "Chưa có hội nào!")
      .setFooter({ text: ".guild join <ID> — Gia nhập" });
    return msg.reply({ embeds: [embed] });
  }

  return msg.reply({ embeds: [errorEmbed("`.guild` — xem hội | `.guild create <tên>` | `.guild join <id>` | `.guild donate <tiền>` | `.guild list`")] });
}
