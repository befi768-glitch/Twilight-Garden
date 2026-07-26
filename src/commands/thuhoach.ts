import { Message, EmbedBuilder } from "discord.js";
import { layHoacTaoNguoiChoi, layVuon, thuHoach as thuHoachDB, congXuVaKinhNghiem, themVaoTuiDo, truXu, ban as banDB } from "../database/queries";
import { cayMap, layAnhCay } from "../data/plants";
import { formatXu, MAU_CHINH, MAU_DO, MAU_VANG } from "../utils/helpers";
import { taoSuKien, layLoiThoaiNgauNhien } from "../utils/events";

// Áp dụng sự kiện và trả về mô tả bonus/penalty thực tế
async function apDungSuKien(
  playerId: number,
  suKien: ReturnType<typeof taoSuKien>,
  soLuongThuHoach: number,
  cayId: string
): Promise<{ bonusText: string; xuBonus: number; xuPhat: number }> {
  let bonusText = "";
  let xuBonus = 0;
  let xuPhat = 0;

  if (suKien.loai === "binh_thuong") return { bonusText, xuBonus, xuPhat };

  // Có lợi
  if (suKien.bonusXu) {
    xuBonus += suKien.bonusXu;
    await congXuVaKinhNghiem(playerId, suKien.bonusXu, 0);
  }
  if (suKien.bonusCay) {
    await themVaoTuiDo(playerId, suKien.bonusCay.id, suKien.bonusCay.soLuong);
  }
  if (suKien.bonusSanLuong) {
    await themVaoTuiDo(playerId, cayId, suKien.bonusSanLuong);
  }

  // Bất lợi — mất xu
  if (suKien.matXu) {
    xuPhat += suKien.matXu;
    await truXu(playerId, suKien.matXu);
  }

  // Bất lợi — mất sản lượng
  if (suKien.matSanLuong !== undefined) {
    if (suKien.matSanLuong === -1) {
      // Mất 50% sản lượng (tối thiểu 1 cái bị mất, tối thiểu còn 0 — đã thu hoạch rồi nên xóa khỏi túi)
      const soMat = Math.max(1, Math.floor(soLuongThuHoach / 2));
      await banDB(playerId, cayId, soMat); // Xóa khỏi túi đồ
    } else if (suKien.matSanLuong > 0 && soLuongThuHoach > 0) {
      const soMat = Math.min(suKien.matSanLuong, soLuongThuHoach);
      await banDB(playerId, cayId, soMat);
    }
  }

  bonusText = `\n\n${suKien.moTa}`;
  return { bonusText, xuBonus, xuPhat };
}

export async function xuLyThuHoach(message: Message, args: string[]) {
  const player = await layHoacTaoNguoiChoi(message.author.id, message.guildId!);
  const vuon = await layVuon(player.id);
  const bayGio = new Date();

  if (args[0]) {
    const viTri = parseInt(args[0]);
    if (isNaN(viTri)) return message.reply("❌ Số ô không hợp lệ! VD: `.thuhoach 1`");

    const o = vuon.find((v) => v.viTri === viTri);
    if (!o || !o.tenCay) return message.reply(`❌ Ô ${viTri} trống!`);
    if (o.truongThanhLuc && o.truongThanhLuc > bayGio) {
      const conLai = o.truongThanhLuc.getTime() - bayGio.getTime();
      const { formatThoiGian } = await import("../utils/helpers");
      return message.reply(`⏰ *Nàng tiên vườn thủ thỉ: "Hãy kiên nhẫn thêm **${formatThoiGian(conLai)}** nữa nhé~"*`);
    }

    const ketQua = await thuHoachDB(player.id, viTri);
    if (!ketQua) return message.reply(`❌ Không thể thu hoạch ô ${viTri}!`);

    const cay = cayMap.get(ketQua.tenCay);
    if (!cay) return message.reply("❌ Lỗi không xác định!");

    const suKien = taoSuKien(cay);
    const ke = cay.kinhNghiem * ketQua.soLuong;
    const capInfo = await congXuVaKinhNghiem(player.id, 0, ke);

    const { bonusText, xuPhat } = await apDungSuKien(player.id, suKien, ketQua.soLuong, cay.id);
    const loiThoai = layLoiThoaiNgauNhien("thuhoach");

    const laBatLoi = ["sau_linh", "loi_kiep", "nu_tiep_ruong"].includes(suKien.loai);
    const mauEmbed = laBatLoi ? MAU_DO : MAU_VANG;

    const embed = new EmbedBuilder()
      .setColor(mauEmbed)
      .setTitle(`Thu hoạch thành công!`)
      .setDescription(`${loiThoai}\n\n**${cay.ten}** x${ketQua.soLuong} đã vào túi đồ! +${ke} ✨ KN${bonusText}`)
      .setThumbnail(`attachment://${cay.id}.png`)
      .addFields(
        { name: "📦 Thu hoạch", value: `${ketQua.soLuong}x ${cay.ten}`, inline: true },
        { name: "💰 Giá bán", value: formatXu(cay.giaBan) + " / cái", inline: true }
      )
      .setFooter({ text: "💡 Dùng .ban để bán • .tuido để xem túi đồ" });

    if (xuPhat > 0) {
      embed.addFields({ name: "💸 Tổn Thất", value: `-${formatXu(xuPhat)}`, inline: true });
    }

    if (capInfo && capInfo.capDoMoi > capInfo.capDoCu) {
      const { loi_thoai } = await import("../utils/events");
      const loiCap = loi_thoai.chuc_mung_cap[Math.floor(Math.random() * loi_thoai.chuc_mung_cap.length)];
      embed.addFields({ name: `🎉 LÊN CẤP ${capInfo.capDoMoi}!`, value: loiCap });
    }

    return message.reply({
      files: [{ attachment: layAnhCay(cay.id), name: `${cay.id}.png` }],
      embeds: [embed],
    });
  }

  // Thu hoạch tất cả
  const dayChin = vuon.filter((o) => o.tenCay && o.truongThanhLuc && o.truongThanhLuc <= bayGio);

  if (dayChin.length === 0) {
    const embed = new EmbedBuilder()
      .setColor(MAU_DO)
      .setTitle("🧺 Chưa có gì để thu hoạch")
      .setDescription("*Nàng tiên vườn nhẹ nhàng nói: \"Cây cần thêm thời gian để lớn~\"*\n\nDùng `.vuon` để kiểm tra tiến trình.");
    return message.reply({ embeds: [embed] });
  }

  let tongKe = 0;
  let tongBonus = 0;
  let tongPhat = 0;
  const danhSachThuHoach: string[] = [];
  const danhSachSuKienTot: string[] = [];
  const danhSachSuKienXau: string[] = [];

  for (const o of dayChin) {
    const ketQua = await thuHoachDB(player.id, o.viTri);
    if (!ketQua) continue;
    const cay = cayMap.get(ketQua.tenCay);
    if (!cay) continue;

    const ke = cay.kinhNghiem * ketQua.soLuong;
    tongKe += ke;
    danhSachThuHoach.push(`${cay.emoji} **${cay.ten}** x${ketQua.soLuong}`);

    const suKien = taoSuKien(cay);
    if (suKien.loai !== "binh_thuong") {
      const laBatLoi = ["sau_linh", "loi_kiep", "nu_tiep_ruong"].includes(suKien.loai);
      const { xuBonus, xuPhat } = await apDungSuKien(player.id, suKien, ketQua.soLuong, cay.id);
      tongBonus += xuBonus;
      tongPhat += xuPhat;
      if (laBatLoi) {
        danhSachSuKienXau.push(suKien.moTa);
      } else {
        danhSachSuKienTot.push(suKien.moTa);
      }
    }
  }

  const capInfo = await congXuVaKinhNghiem(player.id, 0, tongKe);
  const loiThoai = layLoiThoaiNgauNhien("thuhoach");

  let moTa = `${loiThoai}\n\n${danhSachThuHoach.join("\n")}`;
  if (danhSachSuKienTot.length) moTa += `\n\n${danhSachSuKienTot.join("\n")}`;
  if (danhSachSuKienXau.length) moTa += `\n\n${danhSachSuKienXau.join("\n")}`;

  const embed = new EmbedBuilder()
    .setColor(MAU_VANG)
    .setTitle(`🧺 Thu hoạch ${dayChin.length} cây!`)
    .setDescription(moTa)
    .addFields({ name: "✨ Kinh nghiệm", value: `+${tongKe} KN`, inline: true });

  if (tongBonus > 0) {
    embed.addFields({ name: "🎁 Bonus Nguyệt Thạch", value: `+${formatXu(tongBonus)}`, inline: true });
  }
  if (tongPhat > 0) {
    embed.addFields({ name: "💸 Tổn Thất", value: `-${formatXu(tongPhat)}`, inline: true });
  }

  embed.setFooter({ text: "💡 Dùng .ban để bán nông sản lấy xu!" });

  if (capInfo && capInfo.capDoMoi > capInfo.capDoCu) {
    const { loi_thoai } = await import("../utils/events");
    const loiCap = loi_thoai.chuc_mung_cap[Math.floor(Math.random() * loi_thoai.chuc_mung_cap.length)];
    embed.addFields({ name: `🎉 LÊN CẤP ${capInfo.capDoMoi}!`, value: loiCap });
  }

  await message.reply({ embeds: [embed] });
}
