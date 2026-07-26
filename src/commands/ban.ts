import { Message, EmbedBuilder } from "discord.js";
import { layHoacTaoNguoiChoi, ban as banDB, congXuVaKinhNghiem, layTuiDo } from "../database/queries";
import { timCayTheoTen, cayMap, laHatGiong, layCayTuHatGiong } from "../data/plants";
import { formatXu, MAU_CHINH, MAU_DO, MAU_VANG } from "../utils/helpers";

export async function xuLyBan(message: Message, args: string[]) {
  const player = await layHoacTaoNguoiChoi(message.author.id, message.guildId!);

  // Bán tất cả nếu không có args
  if (!args.length || args[0] === "tat") {
    const tuiDo = await layTuiDo(player.id);
    if (!tuiDo.length) return message.reply("🧺 Túi đồ trống, không có gì để bán!");

    let tongTien = 0;
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
      const tien = cay.giaBan * item.soLuong;
      tongTien += tien;
      await banDB(player.id, item.tenCay, item.soLuong);
      danhSachBan.push(`${cay.emoji} ${cay.ten} x${item.soLuong} → ${formatXu(tien)}`);
    }

    if (tongTien === 0 && soHatBiBoQua === 0) {
      return message.reply("🧺 Không có linh thảo nào để bán!");
    }

    if (tongTien > 0) {
      await congXuVaKinhNghiem(player.id, tongTien, 0);
    }

    const embed = new EmbedBuilder()
      .setColor(MAU_VANG)
      .setTitle(tongTien > 0 ? "💰 Đã bán tất cả linh thảo!" : "🌱 Chỉ có hạt giống trong túi!")
      .setDescription(danhSachBan.join("\n") || "*(không có gì để bán)*");

    if (tongTien > 0) {
      embed.addFields({ name: "🤑 Tổng thu", value: formatXu(tongTien) });
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

  // Kiểm tra xem có hạt giống của loại này không (để đưa ra gợi ý hữu ích)
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

  const tongTien = cay.giaBan * soLuong;
  await congXuVaKinhNghiem(player.id, tongTien, 0);

  const embed = new EmbedBuilder()
    .setColor(MAU_CHINH)
    .setTitle(`💰 Đã bán!`)
    .setDescription(`${cay.emoji} **${cay.ten}** x${soLuong} → ${formatXu(tongTien)}`)
    .setFooter({ text: "💡 Dùng .ban tất để bán hết túi đồ!" });

  await message.reply({ embeds: [embed] });
}
