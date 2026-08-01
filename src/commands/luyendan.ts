import { Message, EmbedBuilder } from "discord.js";
import { layHoacTaoNguoiChoi, layTuiDo, congXuVaKinhNghiem } from "../database/queries";
import { db } from "../database/db";
import { nguoiChoi, oDat } from "../database/schema";
import { eq, sql } from "drizzle-orm";
import { congThucDanhSach, timCongThucTheoTen, mauDoKho } from "../data/crafting";
import { cayMap } from "../data/plants";
import { vatPhamMap } from "../data/vatPhamDacBiet";
import { formatXu, MAU_CHINH, MAU_VANG, MAU_DO, EMOJI_KN, EMOJI_TIEN } from "../utils/helpers";

const MAX_O_DAT = 10; // Giới hạn tối đa ô đất

export async function xuLyLuyenDan(message: Message, args: string[]) {
  if (!message.guildId) return;
  const player = await layHoacTaoNguoiChoi(message.author.id, message.guildId);
  const sub = args[0]?.toLowerCase();

  // ─── XEM DANH SÁCH CÔNG THỨC ───────────────────────────────
  if (!sub || sub === "ds" || sub === "danhsach" || sub === "list") {
    const tuiDo = await layTuiDo(player.id);
    const tuiDoMap = new Map(tuiDo.map((i) => [i.tenCay, i.soLuong]));

    const nhomTheoDoKho: Record<string, string[]> = { "Thường": [], "Khó": [], "Thần Phẩm": [], "Huyền Thoại": [] };

    for (const ct of congThucDanhSach) {
      const duNguyenLieu = ct.nguyenLieu.every(
        (nl) => (tuiDoMap.get(nl.cayId) ?? 0) >= nl.soLuong
      );
      const checkIcon = duNguyenLieu ? "✅" : "❌";
      const nguyenLieuText = ct.nguyenLieu
        .map((nl) => {
          const c = cayMap.get(nl.cayId) ?? vatPhamMap.get(nl.cayId);
          const coTrong = tuiDoMap.get(nl.cayId) ?? 0;
          const duRoi = coTrong >= nl.soLuong;
          return `${duRoi ? "✔️" : "☐"} ${c?.emoji ?? "🌿"} ${c?.ten ?? nl.cayId} x${nl.soLuong} *(có: ${coTrong})*`;
        })
        .join(", ");

      if (!nhomTheoDoKho[ct.doKho]) nhomTheoDoKho[ct.doKho] = [];
      nhomTheoDoKho[ct.doKho].push(
        `${checkIcon} **${ct.emoji} ${ct.ten}** — ${ct.hieuUngMoTa}\n┗ *${nguyenLieuText}*`
      );
    }

    const embed = new EmbedBuilder()
      .setColor(MAU_CHINH)
      .setTitle("⚗️ Đan Lò Twilight — Công Thức Luyện Đan")
      .setDescription("*Kết hợp linh thảo để tạo ra đan dược thần kỳ...*\n✅ = đủ nguyên liệu | ❌ = chưa đủ");

    if (nhomTheoDoKho["Thường"].length)
      embed.addFields({ name: "⬜ Công Thức Thường", value: nhomTheoDoKho["Thường"].join("\n\n") });
    if (nhomTheoDoKho["Khó"].length)
      embed.addFields({ name: "🟪 Công Thức Khó", value: nhomTheoDoKho["Khó"].join("\n\n") });
    if (nhomTheoDoKho["Thần Phẩm"].length)
      embed.addFields({ name: "🟨 Công Thức Thần Phẩm *(cần Linh Tinh từ Thám Hiểm)*", value: nhomTheoDoKho["Thần Phẩm"].join("\n\n") });
    if (nhomTheoDoKho["Huyền Thoại"].length)
      embed.addFields({ name: "🔴 Công Thức Huyền Thoại *(cần Boss Hạch từ Boss Event)*", value: nhomTheoDoKho["Huyền Thoại"].join("\n\n") });

    embed.setFooter({ text: "Dùng .luyendan <tên đan> để luyện • 🧬 Linh Tinh từ .thamhiem • 💎 Boss Hạch từ .boss" });

    return message.reply({ embeds: [embed] });
  }

  // ─── LUYỆN ĐAN CỤ THỂ ──────────────────────────────────────
  const tenDan = args.join(" ");
  const congThuc = timCongThucTheoTen(tenDan);

  if (!congThuc) {
    return message.reply(
      `❌ Không tìm thấy công thức **${tenDan}**!\n` +
      `Dùng \`.luyendan\` để xem danh sách công thức.`
    );
  }

  // Kiểm tra nguyên liệu
  const tuiDo = await layTuiDo(player.id);
  const tuiDoMap = new Map(tuiDo.map((i) => [i.tenCay, i.soLuong]));

  const thieu: string[] = [];
  for (const nl of congThuc.nguyenLieu) {
    const coTrong = tuiDoMap.get(nl.cayId) ?? 0;
    if (coTrong < nl.soLuong) {
      const c = cayMap.get(nl.cayId);
      thieu.push(`${c?.emoji ?? "🌿"} **${c?.ten ?? nl.cayId}**: cần ${nl.soLuong}, có ${coTrong}`);
    }
  }

  if (thieu.length) {
    const embed = new EmbedBuilder()
      .setColor(MAU_DO)
      .setTitle(`❌ Thiếu Nguyên Liệu — ${congThuc.ten}`)
      .setDescription(
        `*Đan lò rung nhẹ, linh hỏa tắt lịm... Không đủ nguyên liệu!*\n\n` +
        thieu.join("\n")
      );
    return message.reply({ embeds: [embed] });
  }

  // Kiểm tra đặc biệt: mở rộng vườn có tới giới hạn chưa?
  if (congThuc.hieuUng.loai === "moRongVuon") {
    if (player.soODat >= MAX_O_DAT) {
      return message.reply(
        `❌ Vườn của bạn đã đạt tối đa **${MAX_O_DAT} ô đất**! Không thể mở thêm.`
      );
    }
  }

  // ── Tiêu thụ nguyên liệu ──
  for (const nl of congThuc.nguyenLieu) {
    await db.execute(
      `UPDATE tui_do SET so_luong = so_luong - ${nl.soLuong}
       WHERE nguoi_choi_id = ${player.id} AND ten_cay = '${nl.cayId}'`
    );
    await db.execute(
      `DELETE FROM tui_do WHERE nguoi_choi_id = ${player.id} AND ten_cay = '${nl.cayId}' AND so_luong <= 0`
    );
  }

  // ── Áp dụng hiệu ứng ──
  const hieu = congThuc.hieuUng;
  let ketQua = "";

  if (hieu.loai === "kinhNghiem") {
    const capInfo = await congXuVaKinhNghiem(player.id, 0, hieu.soLuong);
    ketQua = `+${hieu.soLuong.toLocaleString("vi-VN")} ${EMOJI_KN} Linh Lực`;
    if (capInfo && capInfo.capDoMoi > capInfo.capDoCu) {
      const { layLoiLenCap } = await import("../utils/events");
      const { tenCap } = await import("../data/plants").then(m => m.layThongTinCap(capInfo.capDoMoi));
      const loiCap = layLoiLenCap(capInfo.capDoMoi);
      ketQua += `\n\n**${loiCap.tieuDe} — ${tenCap}**\n${loiCap.moTa}`;
    }
  } else if (hieu.loai === "xu") {
    await congXuVaKinhNghiem(player.id, hieu.soLuong, 0);
    ketQua = `+${formatXu(hieu.soLuong)}`;
  } else if (hieu.loai === "kinhNghiemVaXu") {
    const capInfo = await congXuVaKinhNghiem(player.id, hieu.xu, hieu.kinhNghiem);
    ketQua = `+${hieu.kinhNghiem.toLocaleString("vi-VN")} ${EMOJI_KN} Linh Lực\n+${formatXu(hieu.xu)}`;
    if (capInfo && capInfo.capDoMoi > capInfo.capDoCu) {
      const { layLoiLenCap } = await import("../utils/events");
      const { tenCap } = await import("../data/plants").then(m => m.layThongTinCap(capInfo.capDoMoi));
      const loiCap = layLoiLenCap(capInfo.capDoMoi);
      ketQua += `\n\n**${loiCap.tieuDe} — ${tenCap}**\n${loiCap.moTa}`;
    }
  } else if (hieu.loai === "moRongVuon") {
    const soODatMoi = player.soODat + hieu.soODat;
    await db.execute(
      `UPDATE nguoi_choi SET so_o_dat = ${soODatMoi} WHERE id = ${player.id}`
    );
    // Thêm ô đất mới
    await db.insert(oDat).values({
      nguoiChoiId: player.id,
      viTri: soODatMoi,
    });
    ketQua = `🌿 **Vườn mở rộng thêm 1 ô!** (Tổng: ${soODatMoi}/${MAX_O_DAT} ô)`;
  }

  // Hiển thị nguyên liệu đã dùng
  const nguyenLieuDung = congThuc.nguyenLieu
    .map((nl) => {
      const c = cayMap.get(nl.cayId);
      return `${c?.emoji ?? "🌿"} ${c?.ten ?? nl.cayId} x${nl.soLuong}`;
    })
    .join(", ");

  const embed = new EmbedBuilder()
    .setColor(mauDoKho[congThuc.doKho] ?? MAU_VANG)
    .setTitle(`⚗️ Luyện Đan Thành Công! — ${congThuc.emoji} ${congThuc.ten}`)
    .setDescription(`*${congThuc.moTa}*\n\n*Linh hỏa bừng sáng, đan dược hình thành...*`)
    .addFields(
      { name: "🌿 Nguyên Liệu Đã Dùng", value: nguyenLieuDung, inline: false },
      { name: "✨ Hiệu Quả", value: ketQua, inline: false },
    )
    .setFooter({ text: `Dùng .luyendan để xem thêm công thức` });

  return message.reply({ embeds: [embed] });
}
