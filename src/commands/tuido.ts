import { Message, EmbedBuilder } from "discord.js";
import { layHoacTaoNguoiChoi, layTuiDo } from "../database/queries";
import { cayMap } from "../data/plants";
import { formatXu, MAU_CHINH } from "../utils/helpers";

export async function xuLyTuiDo(message: Message) {
  const player = await layHoacTaoNguoiChoi(message.author.id, message.guildId!);
  const tuiDo = await layTuiDo(player.id);

  if (!tuiDo.length) {
    const embed = new EmbedBuilder()
      .setColor(MAU_CHINH)
      .setTitle(`🎒 Túi đồ của ${message.author.displayName}`)
      .setDescription("*Túi đồ trống! Hãy thu hoạch gì đó.*")
      .addFields({ name: "💰 Xu", value: formatXu(player.xu) });
    return message.reply({ embeds: [embed] });
  }

  let tongGiaTri = 0;
  const danhSach = tuiDo.map((item) => {
    const cay = cayMap.get(item.tenCay);
    if (!cay) return `❓ ${item.tenCay} x${item.soLuong}`;
    const giaTri = cay.giaBan * item.soLuong;
    tongGiaTri += giaTri;
    return `${cay.emoji} **${cay.ten}** x${item.soLuong} — Trị giá: ${formatXu(giaTri)}`;
  });

  const embed = new EmbedBuilder()
    .setColor(MAU_CHINH)
    .setTitle(`🎒 Túi đồ của ${message.author.displayName}`)
    .setDescription(danhSach.join("\n"))
    .addFields(
      { name: "💰 Xu hiện có", value: formatXu(player.xu), inline: true },
      { name: "📦 Tổng trị giá", value: formatXu(tongGiaTri), inline: true }
    )
    .setFooter({ text: "💡 Dùng .ban <tên> [số lượng] để bán • .ban tất để bán hết" });

  await message.reply({ embeds: [embed] });
}
