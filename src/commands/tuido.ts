import { Message, EmbedBuilder } from "discord.js";
import { layHoacTaoNguoiChoi, layTuiDo } from "../database/queries";
import { cayMap } from "../data/plants";
import { formatXu, MAU_CHINH, TEN_TIEN, EMOJI_TIEN } from "../utils/helpers";

export async function xuLyTuiDo(message: Message) {
  const player = await layHoacTaoNguoiChoi(message.author.id, message.guildId!);
  const tuiDo = await layTuiDo(player.id);

  if (!tuiDo.length) {
    const embed = new EmbedBuilder()
      .setColor(MAU_CHINH)
      .setTitle(`🎒 Bảo Nang của ${message.author.displayName}`)
      .setDescription(
        `*"Bảo Nang còn trống — hãy ra Linh Địa thu hái linh thảo~"*`
      )
      .addFields({ name: `💠 ${TEN_TIEN}`, value: formatXu(player.xu) });
    return message.reply({ embeds: [embed] });
  }

  let tongGiaTri = 0;
  const danhSach = tuiDo.map((item) => {
    const cay = cayMap.get(item.tenCay);
    if (!cay) return `❓ ${item.tenCay} x${item.soLuong} *(linh thảo không xác định)*`;
    const giaTri = cay.giaBan * item.soLuong;
    tongGiaTri += giaTri;
    return `${cay.emoji} **${cay.ten}** [${cay.doHiem}] x${item.soLuong}\n┗ Trị giá: ${formatXu(giaTri)}`;
  });

  const embed = new EmbedBuilder()
    .setColor(MAU_CHINH)
    .setTitle(`🎒 Bảo Nang của ${message.author.displayName}`)
    .setDescription(
      `*"Mỗi linh thảo trong Bảo Nang đều mang linh khí của người trồng..."*\n\n` +
      danhSach.join("\n")
    )
    .addFields(
      { name: `💠 ${TEN_TIEN} Hiện Có`, value: formatXu(player.xu), inline: true },
      { name: `📦 Tổng Trị Giá`,        value: formatXu(tongGiaTri), inline: true }
    )
    .setFooter({ text: `💡 .ban <tên> [số] để bán lấy ${TEN_TIEN} ${EMOJI_TIEN} • .ban tất để bán hết` });

  await message.reply({ embeds: [embed] });
}
