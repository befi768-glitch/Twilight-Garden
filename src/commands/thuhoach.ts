import { Message, EmbedBuilder } from "discord.js";
import { layHoacTaoNguoiChoi, layVuon, thuHoach as thuHoachDB, congXuVaKinhNghiem, themVaoTuiDo } from "../database/queries";
import { cayMap, layAnhCay } from "../data/plants";
import { formatXu, MAU_CHINH, MAU_DO, MAU_VANG } from "../utils/helpers";
import { taoSuKien, layLoiThoaiNgauNhien } from "../utils/events";

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

    let bonusText = "";
    if (suKien.loai !== "binh_thuong") {
      bonusText = `\n\n${suKien.moTa}`;
      if (suKien.bonusXu) await congXuVaKinhNghiem(player.id, suKien.bonusXu, 0);
      if (suKien.bonusCay) await themVaoTuiDo(player.id, suKien.bonusCay.id, suKien.bonusCay.soLuong);
      if (suKien.bonusSanLuong) await themVaoTuiDo(player.id, cay.id, suKien.bonusSanLuong);
    }

    const loiThoai = layLoiThoaiNgauNhien("thuhoach");

    const embed = new EmbedBuilder()
      .setColor(MAU_VANG)
      .setTitle(`Thu hoạch thành công!`)
      .setDescription(`${loiThoai}\n\n**${cay.ten}** x${ketQua.soLuong} đã vào túi đồ! +${ke} ✨ KN${bonusText}`)
      .setThumbnail(`attachment://${cay.id}.png`)
      .addFields(
        { name: "📦 Thu hoạch", value: `${ketQua.soLuong}x ${cay.ten}`, inline: true },
        { name: "💰 Giá bán", value: formatXu(cay.giaBan) + " / cái", inline: true }
      )
      .setFooter({ text: "💡 Dùng .ban để bán • .tuido để xem túi đồ" });

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
  const danhSachThuHoach: string[] = [];
  const danhSachSuKien: string[] = [];

  for (const o of dayChin) {
    const ketQua = await thuHoachDB(player.id, o.viTri);
    if (!ketQua) continue;
    const cay = cayMap.get(ketQua.tenCay);
    if (!cay) continue;

    const ke = cay.kinhNghiem * ketQua.soLuong;
    tongKe += ke;
    danhSachThuHoach.push(`**${cay.ten}** x${ketQua.soLuong}`);

    const suKien = taoSuKien(cay);
    if (suKien.loai !== "binh_thuong") {
      danhSachSuKien.push(suKien.moTa);
      if (suKien.bonusXu) tongBonus += suKien.bonusXu;
      if (suKien.bonusCay) await themVaoTuiDo(player.id, suKien.bonusCay.id, suKien.bonusCay.soLuong);
      if (suKien.bonusSanLuong) await themVaoTuiDo(player.id, cay.id, suKien.bonusSanLuong);
    }
  }

  if (tongBonus > 0) await congXuVaKinhNghiem(player.id, tongBonus, 0);
  const capInfo = await congXuVaKinhNghiem(player.id, 0, tongKe);
  const loiThoai = layLoiThoaiNgauNhien("thuhoach");

  let moTa = `${loiThoai}\n\n${danhSachThuHoach.join("\n")}`;
  if (danhSachSuKien.length) moTa += `\n\n${danhSachSuKien.join("\n")}`;

  const embed = new EmbedBuilder()
    .setColor(MAU_VANG)
    .setTitle(`🧺 Thu hoạch ${dayChin.length} cây!`)
    .setDescription(moTa)
    .addFields({ name: "✨ Kinh nghiệm", value: `+${tongKe} KN`, inline: true })
    .setFooter({ text: "💡 Dùng .ban để bán nông sản lấy xu!" });

  if (capInfo && capInfo.capDoMoi > capInfo.capDoCu) {
    const { loi_thoai } = await import("../utils/events");
    const loiCap = loi_thoai.chuc_mung_cap[Math.floor(Math.random() * loi_thoai.chuc_mung_cap.length)];
    embed.addFields({ name: `🎉 LÊN CẤP ${capInfo.capDoMoi}!`, value: loiCap });
  }

  await message.reply({ embeds: [embed] });
}
