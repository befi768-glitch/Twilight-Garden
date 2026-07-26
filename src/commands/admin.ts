import { Message, EmbedBuilder, Client, TextChannel } from "discord.js";
import { db } from "../database/db";
import { sql } from "drizzle-orm";
import { nguoiChoi, oDat, tuiDo } from "../database/schema";
import { eq, and } from "drizzle-orm";
import { MAU_CHINH, MAU_DO, MAU_VANG, MAU_XANH, formatXu, EMOJI_TIEN } from "../utils/helpers";

// ── Kiểm tra chủ bot ──────────────────────────────────────────────────────────
function laOwnerId(userId: string): boolean {
  const ownerId = process.env.OWNER_ID;
  if (!ownerId) return false;
  return userId === ownerId;
}

function tuChoiOwner(message: Message) {
  return message.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(MAU_DO)
        .setTitle("🔐 Lệnh Bị Cấm")
        .setDescription("*Nàng Tiên nghiêng đầu nhìn bạn lạnh lùng...*\n\nLệnh này chỉ dành cho **chủ nhân Twilight Garden**!")
        .setFooter({ text: "Admin only" }),
    ],
  });
}

// ── Entry point ───────────────────────────────────────────────────────────────
export async function xuLyAdmin(message: Message, args: string[], client: Client) {
  if (!laOwnerId(message.author.id)) {
    await tuChoiOwner(message);
    return;
  }

  const lenh = args[0]?.toLowerCase();

  switch (lenh) {
    case "xu":
      await adminXu(message, args.slice(1));
      break;
    case "capdo":
    case "cấpđộ":
      await adminCapDo(message, args.slice(1));
      break;
    case "reset":
      await adminReset(message, args.slice(1));
      break;
    case "thongke":
    case "thốngkê":
      await adminThongKe(message, client);
      break;
    case "thongbao":
    case "thôngbáo":
      await adminThongBao(message, args.slice(1), client);
      break;
    default:
      await adminTroGiup(message);
  }
}

// ── .admin xu @user <số> ─────────────────────────────────────────────────────
// Số dương → cộng xu | số âm → trừ xu
async function adminXu(message: Message, args: string[]) {
  const mucTieu = message.mentions.users.first();
  const soXu = parseInt(args[1] ?? "");

  if (!mucTieu || isNaN(soXu)) {
    return message.reply("⚠️ Dùng: `.admin xu @người <số>` (số âm để trừ xu)");
  }
  if (!message.guild) return;

  const rows = await db
    .select()
    .from(nguoiChoi)
    .where(and(eq(nguoiChoi.userId, mucTieu.id), eq(nguoiChoi.guildId, message.guild.id)))
    .limit(1);

  if (!rows[0]) {
    return message.reply(`❌ **${mucTieu.username}** chưa có dữ liệu trong server này!`);
  }

  const player = rows[0];
  const xuMoi = Math.max(0, player.xu + soXu);

  await db.update(nguoiChoi).set({ xu: xuMoi }).where(eq(nguoiChoi.id, player.id));

  const embed = new EmbedBuilder()
    .setColor(soXu >= 0 ? MAU_XANH : MAU_DO)
    .setTitle(soXu >= 0 ? "💠 Đã Cộng Xu" : "💸 Đã Trừ Xu")
    .addFields(
      { name: "Người chơi", value: `<@${mucTieu.id}>`, inline: true },
      { name: soXu >= 0 ? "Cộng" : "Trừ", value: `${Math.abs(soXu).toLocaleString("vi-VN")} ${EMOJI_TIEN}`, inline: true },
      { name: "Số dư mới", value: formatXu(xuMoi), inline: true }
    )
    .setTimestamp();

  return message.reply({ embeds: [embed] });
}

// ── .admin capdo @user <level> ────────────────────────────────────────────────
async function adminCapDo(message: Message, args: string[]) {
  const mucTieu = message.mentions.users.first();
  const capMoi = parseInt(args[1] ?? "");

  if (!mucTieu || isNaN(capMoi) || capMoi < 1 || capMoi > 20) {
    return message.reply("⚠️ Dùng: `.admin capdo @người <1-20>`");
  }
  if (!message.guild) return;

  const rows = await db
    .select()
    .from(nguoiChoi)
    .where(and(eq(nguoiChoi.userId, mucTieu.id), eq(nguoiChoi.guildId, message.guild.id)))
    .limit(1);

  if (!rows[0]) {
    return message.reply(`❌ **${mucTieu.username}** chưa có dữ liệu trong server này!`);
  }

  await db
    .update(nguoiChoi)
    .set({ capDo: capMoi })
    .where(eq(nguoiChoi.id, rows[0].id));

  const embed = new EmbedBuilder()
    .setColor(MAU_VANG)
    .setTitle("⬆️ Đã Cập Nhật Cấp Độ")
    .addFields(
      { name: "Người chơi", value: `<@${mucTieu.id}>`, inline: true },
      { name: "Cấp độ mới", value: `Cấp ${capMoi}`, inline: true }
    )
    .setTimestamp();

  return message.reply({ embeds: [embed] });
}

// ── .admin reset @user ────────────────────────────────────────────────────────
async function adminReset(message: Message, args: string[]) {
  const mucTieu = message.mentions.users.first();
  if (!mucTieu) {
    return message.reply("⚠️ Dùng: `.admin reset @người`");
  }
  if (!message.guild) return;

  const rows = await db
    .select()
    .from(nguoiChoi)
    .where(and(eq(nguoiChoi.userId, mucTieu.id), eq(nguoiChoi.guildId, message.guild.id)))
    .limit(1);

  if (!rows[0]) {
    return message.reply(`❌ **${mucTieu.username}** chưa có dữ liệu trong server này!`);
  }

  const id = rows[0].id;

  // Xoá dữ liệu liên quan rồi reset
  await db.delete(tuiDo).where(eq(tuiDo.nguoiChoiId, id));
  await db.delete(oDat).where(eq(oDat.nguoiChoiId, id));
  await db.update(nguoiChoi).set({
    xu: 100,
    kinhNghiem: 0,
    capDo: 1,
    soODat: 3,
  }).where(eq(nguoiChoi.id, id));

  // Tạo lại 3 ô đất ban đầu
  await db.insert(oDat).values([
    { nguoiChoiId: id, viTri: 1 },
    { nguoiChoiId: id, viTri: 2 },
    { nguoiChoiId: id, viTri: 3 },
  ]);

  const embed = new EmbedBuilder()
    .setColor(MAU_DO)
    .setTitle("🔄 Đã Reset Người Chơi")
    .setDescription(`Dữ liệu của <@${mucTieu.id}> đã được khôi phục về trạng thái ban đầu.`)
    .addFields(
      { name: "Xu", value: "100 💠", inline: true },
      { name: "Cấp độ", value: "1", inline: true },
      { name: "Ô đất", value: "3", inline: true }
    )
    .setFooter({ text: "Túi đồ và vườn đã bị xoá sạch" })
    .setTimestamp();

  return message.reply({ embeds: [embed] });
}

// ── .admin thongke ────────────────────────────────────────────────────────────
async function adminThongKe(message: Message, client: Client) {
  const [tongNguoiChoi, tongXu, tongServer, tongKenh] = await Promise.all([
    db.execute(sql`SELECT COUNT(*) as cnt FROM nguoi_choi`),
    db.execute(sql`SELECT COALESCE(SUM(xu), 0) as tong FROM nguoi_choi`),
    db.execute(sql`SELECT COUNT(DISTINCT guild_id) as cnt FROM nguoi_choi`),
    db.execute(sql`SELECT COUNT(*) as cnt FROM kenh_bot`),
  ]);

  const nc  = Number((tongNguoiChoi.rows[0] as { cnt: string }).cnt);
  const tx  = Number((tongXu.rows[0] as { tong: string }).tong);
  const ts  = Number((tongServer.rows[0] as { cnt: string }).cnt);
  const tk  = Number((tongKenh.rows[0] as { cnt: string }).cnt);

  const embed = new EmbedBuilder()
    .setColor(MAU_CHINH)
    .setTitle("📊 Thống Kê Twilight Garden")
    .addFields(
      { name: "🌐 Server đang phục vụ", value: `${client.guilds.cache.size} server`, inline: true },
      { name: "👥 Server có người chơi", value: `${ts} server`, inline: true },
      { name: "🧑‍🌾 Tổng người chơi", value: `${nc.toLocaleString("vi-VN")} người`, inline: true },
      { name: "💠 Tổng Nguyệt Thạch", value: `${tx.toLocaleString("vi-VN")} ${EMOJI_TIEN}`, inline: true },
      { name: "⚙️ Kênh đã setup", value: `${tk} kênh`, inline: true },
      { name: "🤖 Ping", value: `${client.ws.ping}ms`, inline: true },
    )
    .setFooter({ text: `Bot: ${client.user?.tag ?? "Unknown"}` })
    .setTimestamp();

  return message.reply({ embeds: [embed] });
}

// ── .admin thongbao <nội dung> ────────────────────────────────────────────────
// Gửi embed thông báo tới kênh đầu tiên có thể gửi tin nhắn của mỗi server
async function adminThongBao(message: Message, args: string[], client: Client) {
  const noiDung = args.join(" ").trim();
  if (!noiDung) {
    return message.reply("⚠️ Dùng: `.admin thongbao <nội dung thông báo>`");
  }

  const embed = new EmbedBuilder()
    .setColor(MAU_VANG)
    .setTitle("📢 Thông Báo Từ Twilight Garden")
    .setDescription(noiDung)
    .setFooter({ text: `Gửi bởi chủ nhân Twilight Garden • ${new Date().toLocaleString("vi-VN")}` })
    .setTimestamp();

  let thanhCong = 0;
  let thatBai = 0;

  for (const guild of client.guilds.cache.values()) {
    try {
      // Ưu tiên kênh đã setup
      const kenhSetup = await db.execute(
        sql`SELECT channel_id FROM kenh_bot WHERE guild_id = ${guild.id} LIMIT 1`
      );

      let kenhGui: TextChannel | null = null;

      if (kenhSetup.rows.length > 0) {
        const id = (kenhSetup.rows[0] as { channel_id: string }).channel_id;
        const ch = guild.channels.cache.get(id);
        if (ch?.isTextBased() && ch instanceof TextChannel) kenhGui = ch;
      }

      // Fallback: kênh đầu tiên bot có thể gửi
      if (!kenhGui) {
        kenhGui = guild.channels.cache
          .filter((c): c is TextChannel => c instanceof TextChannel && c.permissionsFor(guild.members.me!)?.has("SendMessages") === true)
          .first() ?? null;
      }

      if (kenhGui) {
        await kenhGui.send({ embeds: [embed] });
        thanhCong++;
      } else {
        thatBai++;
      }
    } catch {
      thatBai++;
    }
  }

  const ketQua = new EmbedBuilder()
    .setColor(MAU_XANH)
    .setTitle("✅ Đã Gửi Thông Báo")
    .addFields(
      { name: "✅ Thành công", value: `${thanhCong} server`, inline: true },
      { name: "❌ Thất bại", value: `${thatBai} server`, inline: true }
    )
    .setTimestamp();

  return message.reply({ embeds: [ketQua] });
}

// ── Hướng dẫn ─────────────────────────────────────────────────────────────────
async function adminTroGiup(message: Message) {
  const embed = new EmbedBuilder()
    .setColor(MAU_CHINH)
    .setTitle("🔐 Lệnh Quản Trị — Chủ Bot")
    .setDescription("*Chỉ chủ nhân Twilight Garden mới có thể sử dụng các lệnh sau:*")
    .addFields({
      name: "📋 Danh Sách Lệnh",
      value: [
        "`.admin xu @người <số>` — Cộng/trừ xu (số âm để trừ)",
        "`.admin capdo @người <1-20>` — Đặt cấp độ",
        "`.admin reset @người` — Reset toàn bộ dữ liệu người chơi",
        "`.admin thongke` — Xem thống kê toàn bộ bot",
        "`.admin thongbao <tin>` — Broadcast tới tất cả server",
      ].join("\n"),
    })
    .setFooter({ text: "Twilight Garden Admin Panel" });

  return message.reply({ embeds: [embed] });
}
