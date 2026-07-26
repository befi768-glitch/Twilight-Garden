import { Message, EmbedBuilder, PermissionFlagsBits, ChannelType } from "discord.js";
import { db } from "../database/db";
import { sql } from "drizzle-orm";
import { MAU_CHINH } from "../utils/helpers";

const MAU_DO = 0xe74c3c;
const MAU_XANH = 0x2ecc71;

export async function xuLySetup(message: Message, args: string[]) {
  if (!message.guild) return;

  // Kiểm tra quyền admin
  const thanhVien = message.member;
  if (!thanhVien || !thanhVien.permissions.has(PermissionFlagsBits.ManageGuild)) {
    await message.reply("🔒 *Chỉ quản trị viên mới có thể dùng lệnh này!*");
    return;
  }

  const guildId = message.guild.id;
  const lenh = args[0]?.toLowerCase();

  // Không có subcommand → xem danh sách kênh đang được phép
  if (!lenh) {
    const rows = await db.execute(
      sql`SELECT channel_id FROM kenh_bot WHERE guild_id = ${guildId} ORDER BY id ASC`
    );
    const ds = rows.rows as { channel_id: string }[];

    if (ds.length === 0) {
      const embed = new EmbedBuilder()
        .setColor(MAU_CHINH)
        .setTitle("⚙️ Cài Đặt Kênh Bot")
        .setDescription(
          "✅ **Bot đang hoạt động ở tất cả kênh** (chưa giới hạn)\n\n" +
          "Dùng lệnh bên dưới để giới hạn kênh hoạt động:"
        )
        .addFields({
          name: "📖 Hướng dẫn",
          value: [
            `\`.setup them #kênh\` — Thêm kênh được phép dùng bot`,
            `\`.setup xoa #kênh\` — Xoá kênh khỏi danh sách`,
            `\`.setup xoahet\` — Bỏ giới hạn, bot hoạt động mọi nơi`,
          ].join("\n"),
        })
        .setFooter({ text: "Khi chưa setup: bot hoạt động ở mọi kênh" });
      await message.reply({ embeds: [embed] });
      return;
    }

    const danhSachKenh = ds.map((r) => `<#${r.channel_id}>`).join("\n");
    const embed = new EmbedBuilder()
      .setColor(MAU_CHINH)
      .setTitle("⚙️ Cài Đặt Kênh Bot")
      .setDescription("🔒 **Bot chỉ hoạt động trong các kênh sau:**")
      .addFields(
        { name: "📋 Danh Sách Kênh", value: danhSachKenh },
        {
          name: "📖 Quản lý",
          value: [
            `\`.setup them #kênh\` — Thêm kênh`,
            `\`.setup xoa #kênh\` — Xoá kênh`,
            `\`.setup xoahet\` — Bỏ giới hạn kênh`,
          ].join("\n"),
        }
      )
      .setFooter({ text: `Tổng: ${ds.length} kênh được phép` });
    await message.reply({ embeds: [embed] });
    return;
  }

  // .setup them #kênh
  if (lenh === "them" || lenh === "thêm") {
    const kenh = message.mentions.channels.first();
    if (!kenh || kenh.type !== ChannelType.GuildText) {
      await message.reply("⚠️ Vui lòng mention đúng kênh văn bản! Ví dụ: `.setup them #bot-garden`");
      return;
    }

    await db.execute(
      sql`INSERT INTO kenh_bot (guild_id, channel_id) VALUES (${guildId}, ${kenh.id}) ON CONFLICT DO NOTHING`
    );

    const embed = new EmbedBuilder()
      .setColor(MAU_XANH)
      .setTitle("✅ Đã Thêm Kênh")
      .setDescription(`<#${kenh.id}> đã được thêm vào danh sách kênh bot.\nBot sẽ chỉ phản hồi lệnh trong các kênh được phép.`)
      .setTimestamp();
    await message.reply({ embeds: [embed] });
    return;
  }

  // .setup xoa #kênh
  if (lenh === "xoa" || lenh === "xoá" || lenh === "xóa") {
    const kenh = message.mentions.channels.first();
    if (!kenh) {
      await message.reply("⚠️ Vui lòng mention kênh cần xoá! Ví dụ: `.setup xoa #bot-garden`");
      return;
    }

    const result = await db.execute(
      sql`DELETE FROM kenh_bot WHERE guild_id = ${guildId} AND channel_id = ${kenh.id}`
    );

    if ((result.rowCount ?? 0) === 0) {
      await message.reply(`⚠️ <#${kenh.id}> không có trong danh sách!`);
      return;
    }

    // Kiểm tra còn bao nhiêu kênh
    const remaining = await db.execute(
      sql`SELECT COUNT(*) as cnt FROM kenh_bot WHERE guild_id = ${guildId}`
    );
    const cnt = Number((remaining.rows[0] as { cnt: string }).cnt);

    const embed = new EmbedBuilder()
      .setColor(MAU_DO)
      .setTitle("🗑️ Đã Xoá Kênh")
      .setDescription(
        `<#${kenh.id}> đã bị xoá khỏi danh sách.\n` +
        (cnt === 0
          ? "⚠️ Danh sách trống — bot sẽ hoạt động ở **tất cả kênh**."
          : `Còn ${cnt} kênh được phép.`)
      )
      .setTimestamp();
    await message.reply({ embeds: [embed] });
    return;
  }

  // .setup xoahet — xóa toàn bộ giới hạn
  if (lenh === "xoahet" || lenh === "xoáhết" || lenh === "xóahết") {
    await db.execute(sql`DELETE FROM kenh_bot WHERE guild_id = ${guildId}`);

    const embed = new EmbedBuilder()
      .setColor(MAU_XANH)
      .setTitle("♻️ Đã Bỏ Giới Hạn Kênh")
      .setDescription("Bot sẽ hoạt động ở **tất cả kênh** trong server này.")
      .setTimestamp();
    await message.reply({ embeds: [embed] });
    return;
  }

  // Lệnh không hợp lệ
  await message.reply(
    "⚠️ Lệnh không hợp lệ!\n" +
    "Dùng: `.setup` | `.setup them #kênh` | `.setup xoa #kênh` | `.setup xoahet`"
  );
}
