import { Message, EmbedBuilder } from "discord.js";
import { layHoacTaoNguoiChoi, truXu, themVaoTuiDo } from "../database/queries";
import { timCayTheoTen } from "../data/plants";
import { formatXu, MAU_CHINH, MAU_DO } from "../utils/helpers";

export async function xuLyMua(message: Message, args: string[]) {
  if (!args.length) {
    return message.reply("❌ Bạn muốn mua gì? Dùng `.mua <tên cây> [số lượng]` — VD: `.mua cà rốt 5`");
  }

  // Tách tên cây và số lượng
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
    return message.reply(`❌ Không tìm thấy **${tenCay}**! Dùng \`.cuahang\` để xem danh sách.`);
  }

  if (soLuong > 99) return message.reply("❌ Mua tối đa 99 cái một lần!");

  const tongTien = cay.giaMua * soLuong;
  const player = await layHoacTaoNguoiChoi(message.author.id, message.guildId!);

  if (player.xu < tongTien) {
    const embed = new EmbedBuilder()
      .setColor(MAU_DO)
      .setTitle("💸 Không đủ xu!")
      .setDescription(
        `Bạn cần **${formatXu(tongTien)}** để mua ${soLuong}x ${cay.emoji} ${cay.ten}\nBạn đang có: **${formatXu(player.xu)}**`
      );
    return message.reply({ embeds: [embed] });
  }

  await truXu(player.id, tongTien);
  await themVaoTuiDo(player.id, cay.id, soLuong);

  const embed = new EmbedBuilder()
    .setColor(MAU_CHINH)
    .setTitle(`✅ Mua thành công!`)
    .setDescription(`Đã mua **${soLuong}x ${cay.emoji} ${cay.ten}** vào túi đồ!`)
    .addFields(
      { name: "💰 Đã trả", value: formatXu(tongTien), inline: true },
      { name: "💼 Còn lại", value: formatXu(player.xu - tongTien), inline: true }
    )
    .setFooter({ text: "💡 Dùng .trong <tên cây> để trồng ngay!" });

  await message.reply({ embeds: [embed] });
}
