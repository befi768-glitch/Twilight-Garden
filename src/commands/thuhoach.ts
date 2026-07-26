import { Message, EmbedBuilder } from "discord.js";
import { layHoacTaoNguoiChoi, layVuon, thuHoach as thuHoachDB, congXuVaKinhNghiem } from "../database/queries";
import { cayMap } from "../data/plants";
import { formatXu, MAU_CHINH, MAU_DO, MAU_VANG } from "../utils/helpers";

export async function xuLyThuHoach(message: Message, args: string[]) {
  const player = await layHoacTaoNguoiChoi(message.author.id, message.guildId!);
  const vuon = await layVuon(player.id);
  const bayGio = new Date();

  // Thu hoạch ô cụ thể
  if (args[0]) {
    const viTri = parseInt(args[0]);
    if (isNaN(viTri)) return message.reply("❌ Số ô không hợp lệ! VD: `.thuhoach 1`");

    const o = vuon.find((v) => v.viTri === viTri);
    if (!o || !o.tenCay) return message.reply(`❌ Ô ${viTri} trống!`);
    if (o.truongThanhLuc && o.truongThanhLuc > bayGio) {
      const { formatThoiGian } = await import("../utils/helpers");
      const conLai = o.truongThanhLuc.getTime() - bayGio.getTime();
      return message.reply(`⏰ Cây chưa chín! Còn **${formatThoiGian(conLai)}** nữa.`);
    }

    const ketQua = await thuHoachDB(player.id, viTri);
    if (!ketQua) return message.reply(`❌ Không thể thu hoạch ô ${viTri}!`);

    const cay = cayMap.get(ketQua.tenCay);
    if (!cay) return message.reply("❌ Lỗi không xác định!");

    const tongTien = cay.giaBan * ketQua.soLuong;
    const ke = cay.kinhNghiem * ketQua.soLuong;
    const capInfo = await congXuVaKinhNghiem(player.id, 0, ke); // Không cộng xu trực tiếp, cộng khi bán

    const embed = new EmbedBuilder()
      .setColor(MAU_VANG)
      .setTitle(`🧺 Thu hoạch thành công!`)
      .setDescription(
        `${cay.emoji} **${cay.ten}** x${ketQua.soLuong} đã vào túi đồ!\n\n+${ke} ✨ kinh nghiệm`
      )
      .addFields(
        { name: "📦 Thu hoạch", value: `${ketQua.soLuong} ${cay.ten}`, inline: true },
        { name: "💰 Giá bán", value: formatXu(cay.giaBan) + " / cái", inline: true }
      )
      .setFooter({ text: "💡 Dùng .ban để bán hoặc .tuidо để xem túi đồ" });

    if (capInfo && capInfo.capDoMoi > capInfo.capDoCu) {
      embed.addFields({ name: "🎉 LÊN CẤP!", value: `Chúc mừng! Bạn đã lên **Cấp ${capInfo.capDoMoi}**! 🌟` });
    }

    return message.reply({ embeds: [embed] });
  }

  // Thu hoạch tất cả cây đã chín
  const dayChin = vuon.filter((o) => o.tenCay && o.truongThanhLuc && o.truongThanhLuc <= bayGio);

  if (dayChin.length === 0) {
    const embed = new EmbedBuilder()
      .setColor(MAU_DO)
      .setTitle("🧺 Chưa có gì để thu hoạch")
      .setDescription("Không có cây nào đã chín!\n\nDùng `.vuon` để kiểm tra tiến trình cây trồng.");
    return message.reply({ embeds: [embed] });
  }

  let tongKe = 0;
  const danhSachThuHoach: string[] = [];

  for (const o of dayChin) {
    const ketQua = await thuHoachDB(player.id, o.viTri);
    if (!ketQua) continue;
    const cay = cayMap.get(ketQua.tenCay);
    if (!cay) continue;
    const ke = cay.kinhNghiem * ketQua.soLuong;
    tongKe += ke;
    danhSachThuHoach.push(`${cay.emoji} **${cay.ten}** x${ketQua.soLuong}`);
  }

  const capInfo = await congXuVaKinhNghiem(player.id, 0, tongKe);

  const embed = new EmbedBuilder()
    .setColor(MAU_VANG)
    .setTitle(`🧺 Thu hoạch ${dayChin.length} cây!`)
    .setDescription(danhSachThuHoach.join("\n"))
    .addFields({ name: "✨ Kinh nghiệm", value: `+${tongKe} KN`, inline: true })
    .setFooter({ text: "💡 Dùng .ban để bán nông sản lấy xu!" });

  if (capInfo && capInfo.capDoMoi > capInfo.capDoCu) {
    embed.addFields({ name: "🎉 LÊN CẤP!", value: `Chúc mừng! Bạn đã lên **Cấp ${capInfo.capDoMoi}**! 🌟` });
  }

  await message.reply({ embeds: [embed] });
}
