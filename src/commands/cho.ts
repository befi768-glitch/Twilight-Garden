import { Message, EmbedBuilder } from "discord.js";
import { layHoacTaoNguoiChoi, layTuiDo, themVaoTuiDo } from "../database/queries";
import { db } from "../database/db";
import { nguoiChoi } from "../database/schema";
import { eq } from "drizzle-orm";
import { timCayTheoTen, cayMap } from "../data/plants";
import { formatXu, MAU_CHINH, MAU_VANG, MAU_DO, MAU_XANH, MAU_XAM, EMOJI_TIEN } from "../utils/helpers";

const PHI_DANG_BAN = 5; // 5% phí đăng bán
const MAX_DON_MOI_NGUOI = 5;

interface ChoBuonRow {
  [key: string]: unknown;
  id: number;
  nguoi_ban_id: number;
  user_id: string;
  ten_cay: string;
  so_luong: number;
  gia_moi_cai: number;
  created_at: string;
}

export async function xuLyCho(message: Message, args: string[]) {
  if (!message.guildId) return;
  const player = await layHoacTaoNguoiChoi(message.author.id, message.guildId);
  const sub = args[0]?.toLowerCase();

  // ─── XEM CHỢ ───────────────────────────────────────────────
  if (!sub || sub === "xem" || sub === "list" || sub === "ds") {
    const rows = await db.execute<ChoBuonRow>(
      `SELECT c.id, c.nguoi_ban_id, n.user_id, c.ten_cay, c.so_luong, c.gia_moi_cai, c.created_at
       FROM cho_buon c
       JOIN nguoi_choi n ON n.id = c.nguoi_ban_id
       WHERE c.guild_id = '${message.guildId}'
       ORDER BY c.created_at DESC
       LIMIT 20`
    );

    if (!rows.rows.length) {
      const embed = new EmbedBuilder()
        .setColor(MAU_XAM)
        .setTitle("🏪 Linh Thảo Chợ — Hiện Đang Trống")
        .setDescription(
          "*Chợ vắng lặng như tờ... chưa có ai đăng bán linh thảo.*\n\n" +
          `Dùng \`.cho dang <tên cây> <số lượng> <giá>\` để đăng bán!\n` +
          `*(Phí đăng bán: ${PHI_DANG_BAN}%)*`
        );
      return message.reply({ embeds: [embed] });
    }

    const danhSach = rows.rows.map((r) => {
      const cay = cayMap.get(r.ten_cay);
      const tenNguoiBan = message.guild?.members.cache.get(r.user_id)?.displayName ?? `<@${r.user_id}>`;
      const tongGia = r.gia_moi_cai * r.so_luong;
      return (
        `**[#${r.id}]** ${cay?.emoji ?? "🌿"} **${cay?.ten ?? r.ten_cay}** x${r.so_luong}\n` +
        `┗ 💠 ${r.gia_moi_cai.toLocaleString("vi-VN")}/cái | Tổng: ${formatXu(tongGia)} | Bởi: *${tenNguoiBan}*`
      );
    });

    const embed = new EmbedBuilder()
      .setColor(MAU_VANG)
      .setTitle("🏪 Linh Thảo Chợ — Twilight Garden")
      .setDescription(
        `*"Những linh thảo quý giá được người trồng mang tới trao đổi..."*\n\n` +
        danhSach.join("\n\n")
      )
      .addFields({
        name: "💡 Hướng Dẫn",
        value: [
          "`.cho mua <id>` — Mua nguyên đơn hàng",
          "`.cho dang <tên> <số lượng> <giá>` — Đăng bán",
          "`.cho huy <id>` — Huỷ đơn của bạn",
        ].join("\n"),
      })
      .setFooter({ text: `Phí đăng bán: ${PHI_DANG_BAN}% • Tối đa ${MAX_DON_MOI_NGUOI} đơn/người` })
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  }

  // ─── ĐĂNG BÁN ──────────────────────────────────────────────
  if (sub === "dang" || sub === "đăng" || sub === "ban") {
    // .cho dang <tên cây> <số lượng> <giá>
    if (args.length < 4) {
      return message.reply(
        "❌ Dùng: `.cho dang <tên cây> <số lượng> <giá mỗi cái>`\n" +
        "Ví dụ: `.cho dang hoàng căn 5 20`"
      );
    }

    const gia = parseInt(args[args.length - 1]);
    const soLuong = parseInt(args[args.length - 2]);
    const tenCay = args.slice(1, args.length - 2).join(" ");

    if (isNaN(gia) || gia < 1) return message.reply("❌ Giá không hợp lệ! Phải là số nguyên dương.");
    if (isNaN(soLuong) || soLuong < 1 || soLuong > 99) return message.reply("❌ Số lượng phải từ 1 đến 99.");

    const cay = timCayTheoTen(tenCay);
    if (!cay) return message.reply(`❌ Không tìm thấy cây **${tenCay}**! Dùng \`.cuahang\` để xem danh sách.`);

    // Kiểm tra số đơn hiện tại
    const soHienTai = await db.execute<{ cnt: string }>(
      `SELECT COUNT(*) as cnt FROM cho_buon WHERE nguoi_ban_id = ${player.id}`
    );
    if (parseInt(soHienTai.rows[0]?.cnt ?? "0") >= MAX_DON_MOI_NGUOI) {
      return message.reply(`❌ Bạn đã có ${MAX_DON_MOI_NGUOI} đơn trên chợ! Dùng \`.cho huy <id>\` để huỷ bớt.`);
    }

    // Kiểm tra túi đồ
    const tuiDo = await layTuiDo(player.id);
    const vatPham = tuiDo.find((i) => i.tenCay === cay.id);
    if (!vatPham || vatPham.soLuong < soLuong) {
      return message.reply(
        `❌ Không đủ **${cay.ten}** trong túi!\n` +
        `Bạn có: ${vatPham?.soLuong ?? 0} | Cần: ${soLuong}`
      );
    }

    // Tính phí đăng bán (trừ từ xu người bán)
    const phiDang = Math.max(1, Math.floor((gia * soLuong * PHI_DANG_BAN) / 100));
    const playerInfo = await db.select().from(nguoiChoi).where(eq(nguoiChoi.id, player.id)).limit(1);
    if ((playerInfo[0]?.xu ?? 0) < phiDang) {
      return message.reply(
        `❌ Không đủ xu để đóng phí đăng bán!\n` +
        `Phí: ${formatXu(phiDang)} (${PHI_DANG_BAN}% tổng giá trị)\n` +
        `Bạn có: ${formatXu(playerInfo[0]?.xu ?? 0)}`
      );
    }

    // Trừ vật phẩm và phí
    await db.execute(
      `UPDATE tui_do SET so_luong = so_luong - ${soLuong}
       WHERE nguoi_choi_id = ${player.id} AND ten_cay = '${cay.id}'`
    );
    await db.execute(
      `DELETE FROM tui_do WHERE nguoi_choi_id = ${player.id} AND ten_cay = '${cay.id}' AND so_luong <= 0`
    );
    await db.execute(`UPDATE nguoi_choi SET xu = xu - ${phiDang} WHERE id = ${player.id}`);

    // Tạo đơn hàng
    const result = await db.execute<{ id: number }>(
      `INSERT INTO cho_buon (guild_id, nguoi_ban_id, ten_cay, so_luong, gia_moi_cai)
       VALUES ('${message.guildId}', ${player.id}, '${cay.id}', ${soLuong}, ${gia})
       RETURNING id`
    );
    const donId = result.rows[0]?.id;

    const embed = new EmbedBuilder()
      .setColor(MAU_XANH)
      .setTitle("🏪 Đã Đăng Bán Thành Công!")
      .setDescription(
        `${cay.emoji} **${cay.ten}** x${soLuong} đã lên kệ chợ!\n` +
        `Người mua dùng \`.cho mua ${donId}\` để mua hàng của bạn.`
      )
      .addFields(
        { name: "💠 Giá mỗi cái", value: formatXu(gia), inline: true },
        { name: "📦 Tổng giá trị", value: formatXu(gia * soLuong), inline: true },
        { name: "💸 Phí đăng bán", value: formatXu(phiDang), inline: true },
        { name: "🔖 Mã đơn", value: `#${donId}`, inline: true },
      )
      .setFooter({ text: `Dùng .cho huy ${donId} để huỷ đơn và lấy lại hàng` });

    return message.reply({ embeds: [embed] });
  }

  // ─── MUA ───────────────────────────────────────────────────
  if (sub === "mua") {
    const donId = parseInt(args[1]);
    if (isNaN(donId)) return message.reply("❌ Dùng: `.cho mua <id đơn hàng>` — VD: `.cho mua 5`");

    const rows = await db.execute<ChoBuonRow>(
      `SELECT c.id, c.nguoi_ban_id, n.user_id, c.ten_cay, c.so_luong, c.gia_moi_cai, c.created_at
       FROM cho_buon c
       JOIN nguoi_choi n ON n.id = c.nguoi_ban_id
       WHERE c.id = ${donId} AND c.guild_id = '${message.guildId}'`
    );
    const don = rows.rows[0];
    if (!don) return message.reply(`❌ Không tìm thấy đơn hàng **#${donId}**! Có thể đã bán hoặc bị huỷ.`);

    if (don.nguoi_ban_id === player.id) return message.reply("❌ Bạn không thể mua hàng của chính mình!");

    const cay = cayMap.get(don.ten_cay);
    const tongGia = don.gia_moi_cai * don.so_luong;

    const playerInfo = await db.select().from(nguoiChoi).where(eq(nguoiChoi.id, player.id)).limit(1);
    if ((playerInfo[0]?.xu ?? 0) < tongGia) {
      return message.reply(
        `❌ Không đủ Nguyệt Thạch!\n` +
        `Cần: ${formatXu(tongGia)} | Bạn có: ${formatXu(playerInfo[0]?.xu ?? 0)}`
      );
    }

    // Xoá đơn hàng + trừ xu người mua + cộng xu người bán + thêm vào túi người mua
    await db.execute(`DELETE FROM cho_buon WHERE id = ${donId}`);
    await db.execute(`UPDATE nguoi_choi SET xu = xu - ${tongGia} WHERE id = ${player.id}`);
    await db.execute(`UPDATE nguoi_choi SET xu = xu + ${tongGia} WHERE id = ${don.nguoi_ban_id}`);
    await themVaoTuiDo(player.id, don.ten_cay, don.so_luong);

    // Thông báo cho người bán
    const nguoiBan = message.guild?.members.cache.get(don.user_id);
    if (nguoiBan) {
      const embedBan = new EmbedBuilder()
        .setColor(MAU_VANG)
        .setTitle("💰 Đơn Hàng Của Bạn Đã Được Mua!")
        .setDescription(
          `**${message.author.displayName}** vừa mua **${cay?.ten ?? don.ten_cay}** x${don.so_luong} của bạn!\n` +
          `Bạn nhận được: ${formatXu(tongGia)}`
        );
      try { await nguoiBan.send({ embeds: [embedBan] }); } catch { /* DM tắt */ }
    }

    const embed = new EmbedBuilder()
      .setColor(MAU_VANG)
      .setTitle("🎉 Mua Thành Công!")
      .setDescription(
        `${cay?.emoji ?? "🌿"} **${cay?.ten ?? don.ten_cay}** x${don.so_luong} đã về Bảo Nang!`
      )
      .addFields(
        { name: "💠 Đã trả", value: formatXu(tongGia), inline: true },
        { name: "📦 Nhận được", value: `${don.so_luong} ${cay?.ten ?? don.ten_cay}`, inline: true },
      )
      .setFooter({ text: "Dùng .trong để gieo trồng hoặc .ban để bán lại!" });

    return message.reply({ embeds: [embed] });
  }

  // ─── HUỶ ───────────────────────────────────────────────────
  if (sub === "huy" || sub === "huỷ" || sub === "cancel") {
    const donId = parseInt(args[1]);
    if (isNaN(donId)) return message.reply("❌ Dùng: `.cho huy <id đơn hàng>`");

    const rows = await db.execute<{ id: number; nguoi_ban_id: number; ten_cay: string; so_luong: number }>(
      `SELECT id, nguoi_ban_id, ten_cay, so_luong FROM cho_buon WHERE id = ${donId} AND guild_id = '${message.guildId}'`
    );
    const don = rows.rows[0];
    if (!don) return message.reply(`❌ Không tìm thấy đơn hàng **#${donId}**.`);
    if (don.nguoi_ban_id !== player.id) return message.reply("❌ Đây không phải đơn hàng của bạn!");

    await db.execute(`DELETE FROM cho_buon WHERE id = ${donId}`);
    await themVaoTuiDo(player.id, don.ten_cay, don.so_luong);

    const cay = cayMap.get(don.ten_cay);
    const embed = new EmbedBuilder()
      .setColor(MAU_XAM)
      .setTitle("↩️ Đã Huỷ Đơn Hàng")
      .setDescription(
        `Đơn **#${donId}** đã bị huỷ.\n` +
        `${cay?.emoji ?? "🌿"} **${cay?.ten ?? don.ten_cay}** x${don.so_luong} đã trả về Bảo Nang.`
      );

    return message.reply({ embeds: [embed] });
  }

  // ─── ĐƠN CỦA TÔI ───────────────────────────────────────────
  if (sub === "cua_toi" || sub === "cuatoi" || sub === "of me" || sub === "mine") {
    const rows = await db.execute<{ id: number; ten_cay: string; so_luong: number; gia_moi_cai: number }>(
      `SELECT id, ten_cay, so_luong, gia_moi_cai FROM cho_buon WHERE nguoi_ban_id = ${player.id} ORDER BY id DESC`
    );
    if (!rows.rows.length) {
      return message.reply("📭 Bạn chưa có đơn hàng nào trên chợ. Dùng `.cho dang` để đăng bán!");
    }
    const ds = rows.rows.map((r) => {
      const cay = cayMap.get(r.ten_cay);
      return `**[#${r.id}]** ${cay?.emoji ?? "🌿"} ${cay?.ten ?? r.ten_cay} x${r.so_luong} — ${formatXu(r.gia_moi_cai)}/cái`;
    });
    const embed = new EmbedBuilder()
      .setColor(MAU_CHINH)
      .setTitle("📦 Đơn Hàng Của Bạn")
      .setDescription(ds.join("\n"))
      .setFooter({ text: "Dùng .cho huy <id> để huỷ đơn" });
    return message.reply({ embeds: [embed] });
  }

  // Lệnh không hợp lệ
  return message.reply(
    "❌ Lệnh không hợp lệ!\n" +
    "• `.cho` — Xem chợ\n" +
    "• `.cho dang <tên> <số lượng> <giá>` — Đăng bán\n" +
    "• `.cho mua <id>` — Mua hàng\n" +
    "• `.cho huy <id>` — Huỷ đơn của bạn\n" +
    "• `.cho cuatoi` — Xem đơn hàng của bạn"
  );
}
