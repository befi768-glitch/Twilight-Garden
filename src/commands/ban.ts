import { Message, EmbedBuilder } from "discord.js";
import { layHoacTaoNguoiChoi, ban as banDB, congXuVaKinhNghiem, layTuiDo } from "../database/queries";
import { timCayTheoTen, cayMap } from "../data/plants";
import { formatXu, MAU_CHINH, MAU_DO, MAU_VANG } from "../utils/helpers";

export async function xuLyBan(message: Message, args: string[]) {
  const player = await layHoacTaoNguoiChoi(message.author.id, message.guildId!);

  // Bán tất cả nếu không có args
  if (!args.length || args[0] === "tat") {
    const tuiDo = await layTuiDo(player.id);
    if (!tuiDo.length) return message.reply("🧺 Túi đồ trống, không có gì để bán!");

    let tongTien = 0;
    const danhSachBan: string[] = [];

    for (const item of tuiDo) {
      const cay = cayMap.get(item.tenCay);
      if (!cay) continue;
      const tien = cay.giaBan * item.soLuong;
      tongTien += tien;
      await banDB(player.id, item.tenCay, item.soLuong);
      danhSachBan.push(`${cay.emoji} ${cay.ten} x${item.soLuong} → ${formatXu(tien)}`);
    }

    await congXuVaKinhNghiem(player.id, tongTien, 0);

    const embed = new EmbedBuilder()
      .setColor(MAU_VANG)
      .setTitle("💰 Đã bán tất cả!")
      .setDescription(danhSachBan.join("\n"))
      .addFields({ name: "🤑 Tổng thu", value: formatXu(tongTien) });
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
    return message.reply(`❌ Không tìm thấy **${tenCay}**! Dùng \`.tuidо\` để xem túi đồ của bạn.`);
  }

  const ok = await banDB(player.id, cay.id, soLuong);
  if (!ok) {
    const embedLoi = new EmbedBuilder()
      .setColor(MAU_DO)
      .setTitle("❌ Không đủ hàng")
      .setDescription(`Bạn không có đủ **${soLuong}x ${cay.ten}** trong túi đồ!\nDùng \`.tuidо\` để kiểm tra.`);
    return message.reply({ embeds: [embedLoi] });
  }

  const tongTien = cay.giaBan * soLuong;
  await congXuVaKinhNghiem(player.id, tongTien, 0);

  const embed = new EmbedBuilder()
    .setColor(MAU_CHINH)
    .setTitle(`💰 Đã bán!`)
    .setDescription(`${cay.emoji} **${cay.ten}** x${soLuong} → ${formatXu(tongTien)}`)
    .setFooter({ text: "💡 Dùng .ban tất để bán hết túi đồ!" });

  await message.reply({ embeds: [embed] });
}
