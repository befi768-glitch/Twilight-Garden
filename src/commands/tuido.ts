import { Message, EmbedBuilder } from "discord.js";
import { layHoacTaoNguoiChoi, layTuiDo } from "../database/queries";
import { cayMap, layCayTuHatGiong, laHatGiong } from "../data/plants";
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
  const danhSachCay: string[] = [];
  const danhSachHat: string[] = [];

  for (const item of tuiDo) {
    if (laHatGiong(item.tenCay)) {
      // Hạt giống — không bán được, chỉ dùng để trồng
      const cay = layCayTuHatGiong(item.tenCay);
      if (cay) {
        danhSachHat.push(`🌱 **Hạt ${cay.ten}** x${item.soLuong}\n┗ ID: \`${item.tenCay}\` • dùng \`.trong ${cay.id}\` hoặc \`.trong ${item.tenCay}\` để gieo`);
      } else {
        danhSachHat.push(`🌱 \`${item.tenCay}\` x${item.soLuong} *(hạt giống không xác định)*`);
      }
    } else {
      // Cây đã thu hoạch — có thể bán
      const cay = cayMap.get(item.tenCay);
      if (!cay) {
        danhSachCay.push(`❓ \`${item.tenCay}\` x${item.soLuong} *(không xác định)*`);
        continue;
      }
      const giaTri = cay.giaBan * item.soLuong;
      tongGiaTri += giaTri;
      danhSachCay.push(`${cay.emoji} **${cay.ten}** [${cay.doHiem}] x${item.soLuong}\n┗ ID: \`${cay.id}\` • Trị giá: ${formatXu(giaTri)} • \`.ban ${cay.id}\``);
    }
  }

  const moTa: string[] = ["*\"Mỗi linh thảo trong Bảo Nang đều mang linh khí của người trồng...\"*"];
  if (danhSachCay.length) {
    moTa.push("\n🧺 **Linh Thảo (có thể bán):**\n" + danhSachCay.join("\n"));
  }
  if (danhSachHat.length) {
    moTa.push("\n🌱 **Hạt Giống (dùng .trong để gieo):**\n" + danhSachHat.join("\n"));
  }

  const embed = new EmbedBuilder()
    .setColor(MAU_CHINH)
    .setTitle(`🎒 Bảo Nang của ${message.author.displayName}`)
    .setDescription(moTa.join("\n"))
    .addFields(
      { name: `💠 ${TEN_TIEN} Hiện Có`, value: formatXu(player.xu), inline: true },
      { name: `📦 Tổng Trị Giá Linh Thảo`, value: formatXu(tongGiaTri), inline: true }
    )
    .setFooter({ text: `💡 .ban <tên> [số] để bán linh thảo • .ban tất để bán hết (hạt giống không bán được)` });

  await message.reply({ embeds: [embed] });
}
