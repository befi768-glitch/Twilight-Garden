import { Message, EmbedBuilder } from "discord.js";
import { layHoacTaoNguoiChoi, ban as banDB, congXuVaKinhNghiem, layTuiDo } from "../database/queries";
import { timCayTheoTen, cayMap, laHatGiong, layCayTuHatGiong } from "../data/plants";
import { formatXu, MAU_CHINH, MAU_DO, MAU_VANG } from "../utils/helpers";
import { tinhThue, THUE_CO_BAN } from "../data/pets";
import { db } from "../database/db";
import { layThoiTietHomNay } from "../utils/weather";

async function layPetId(playerId: number): Promise<string | null> {
  const row = await db.execute<{ pet_id: string | null }>(
    `SELECT pet_id FROM nguoi_choi WHERE id = ${playerId}`
  );
  return row.rows[0]?.pet_id ?? null;
}

export async function xuLyBan(message: Message, args: string[]) {
  const player = await layHoacTaoNguoiChoi(message.author.id, message.guildId!);
  const petId = await layPetId(player.id);
  const tyLeThue = tinhThue(petId); // % thuế hiện tại

  // Tính hệ số giá theo thời tiết
  const thoiTiet = layThoiTietHomNay(message.guildId!);
  const heSoGia = 1 + (thoiTiet.bonusGiaBan - thoiTiet.giamGiaBan) / 100;
  const coThoiTietAnhHuong = thoiTiet.bonusGiaBan > 0 || thoiTiet.giamGiaBan > 0;
  const thoiTietNote = coThoiTietAnhHuong
    ? ` *(${thoiTiet.emoji} ${thoiTiet.bonusGiaBan > 0 ? `+${thoiTiet.bonusGiaBan}%` : `-${thoiTiet.giamGiaBan}%`} giá)*`
    : "";

  // Bán tất cả nếu không có args
  if (!args.length || args[0] === "tat" || args[0] === "tất") {
    const tuiDo = await layTuiDo(player.id);
    if (!tuiDo.length) return message.reply("🧺 Túi đồ trống, không có gì để bán!");

    let tongTienTruocThue = 0;
    let tongThue = 0;
    const danhSachBan: string[] = [];
    let soHatBiBoQua = 0;

    for (const item of tuiDo) {
      // Hạt giống không thể bán — chỉ dùng để trồng
      if (laHatGiong(item.tenCay)) {
        const cay = layCayTuHatGiong(item.tenCay);
        soHatBiBoQua += item.soLuong;
        if (cay) danhSachBan.push(`🌱 *(Bỏ qua: Hạt ${cay.ten} x${item.soLuong} — dùng .trong để gieo)*`);
        continue;
      }
      const cay = cayMap.get(item.tenCay);
      if (!cay) continue;
      const tienGoc = Math.round(cay.giaBan * item.soLuong * heSoGia);
      const thue = Math.floor(tienGoc * tyLeThue / 100);
      const tienNhan = tienGoc - thue;
      tongTienTruocThue += tienGoc;
      tongThue += thue;
      await banDB(player.id, item.tenCay, item.soLuong);
      danhSachBan.push(`${cay.emoji} ${cay.ten} x${item.soLuong} → ${formatXu(tienNhan)}${thue > 0 ? ` *(thuế: ${formatXu(thue)})*` : ""}${coThoiTietAnhHuong ? thoiTietNote : ""}`);
    }

    const tongNhan = tongTienTruocThue - tongThue;

    if (tongTienTruocThue === 0 && soHatBiBoQua === 0) {
      return message.reply("🧺 Không có linh thảo nào để bán!");
    }

    if (tongNhan > 0) {
      await congXuVaKinhNghiem(player.id, tongNhan, 0);
    }

    const embed = new EmbedBuilder()
      .setColor(MAU_VANG)
      .setTitle(tongNhan > 0 ? "💰 Đã bán tất cả linh thảo!" : "🌱 Chỉ có hạt giống trong túi!")
      .setDescription(danhSachBan.join("\n") || "*(không có gì để bán)*");

    if (tongNhan > 0) {
      embed.addFields(
        { name: "🤑 Tổng thu (sau thuế)", value: formatXu(tongNhan), inline: true },
      );
      if (tongThue > 0) {
        embed.addFields(
          { name: `💸 Thuế ${tyLeThue}%`, value: formatXu(tongThue), inline: true },
        );
      } else {
        embed.addFields(
          { name: "✅ Miễn Thuế", value: "Pet Phụng Hoàng buff!", inline: true },
        );
      }
      if (coThoiTietAnhHuong) {
        embed.addFields({ name: `${thoiTiet.emoji} Thời Tiết`, value: thoiTiet.hieu_ung.split("\n")[0], inline: false });
      }
    }

    return message.reply({ embeds: [embed] });
  }

  // Bán cụ thể
  let soLuong = 1;
  let tenArgs = [...args];
  const cuoi = parseInt(args[args.length - 1]);
  if (!isNaN(cuoi) && cuoi > 0) {
    soLuong = cuoi;
    tenArgs = args.slice(0, -1);
  }

  const tenCay = tenArgs.join(" ");
  const cay = timCayTheoTen(tenCay);

  if (!cay) {
    return message.reply(`❌ Không tìm thấy **${tenCay}**! Dùng \`.tuido\` để xem túi đồ của bạn.`);
  }

  // Kiểm tra xem có hạt giống của loại này không
  const tuiDo = await layTuiDo(player.id);
  const coHatGiong = tuiDo.some((item) => item.tenCay === "hat_" + cay.id);

  const ok = await banDB(player.id, cay.id, soLuong);
  if (!ok) {
    const embedLoi = new EmbedBuilder()
      .setColor(MAU_DO)
      .setTitle("❌ Không đủ hàng")
      .setDescription(
        `Bạn không có đủ **${soLuong}x ${cay.ten}** (đã thu hoạch) trong túi đồ!\n` +
        (coHatGiong
          ? `💡 Bạn có hạt giống — dùng \`.trong ${cay.ten}\` để gieo trồng và thu hoạch trước.`
          : `Dùng \`.tuido\` để kiểm tra.`)
      );
    return message.reply({ embeds: [embedLoi] });
  }

  const tienGoc = Math.round(cay.giaBan * soLuong * heSoGia);
  const thue = Math.floor(tienGoc * tyLeThue / 100);
  const tongTien = tienGoc - thue;
  await congXuVaKinhNghiem(player.id, tongTien, 0);

  const embed = new EmbedBuilder()
    .setColor(MAU_CHINH)
    .setTitle(`💰 Đã bán!`)
    .setDescription(`${cay.emoji} **${cay.ten}** x${soLuong}${coThoiTietAnhHuong ? thoiTietNote : ""}`)
    .addFields(
      { name: "💵 Giá gốc", value: formatXu(tienGoc), inline: true },
    );

  if (thue > 0) {
    embed.addFields(
      { name: `💸 Thuế ${tyLeThue}%`, value: formatXu(thue), inline: true },
      { name: "🤑 Nhận được", value: formatXu(tongTien), inline: true },
    );
  } else {
    embed.addFields(
      { name: "✅ Miễn Thuế", value: "Pet Phụng Hoàng!", inline: true },
      { name: "🤑 Nhận được", value: formatXu(tongTien), inline: true },
    );
  }

  embed.setFooter({ text: `Thuế ${tyLeThue}% • ${thoiTiet.emoji} ${thoiTiet.ten} • .ban tất để bán hết túi` });

  await message.reply({ embeds: [embed] });
}
