import { Message, EmbedBuilder } from "discord.js";
import { layHoacTaoNguoiChoi, layTuiDo } from "../database/queries";
import { cayMap, layCayTuHatGiong, laHatGiong } from "../data/plants";
import { vatPhamMap, laVatPhamDacBiet } from "../data/vatPhamDacBiet";
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
  const danhSachDacBiet: string[] = [];

  for (const item of tuiDo) {
    if (laVatPhamDacBiet(item.tenCay)) {
      // Vật phẩm đặc biệt: Linh Tinh, Boss Hạch — không bán được
      const vp = vatPhamMap.get(item.tenCay)!;
      danhSachDacBiet.push(
        `${vp.emoji} **${vp.ten}** x${item.soLuong}\n┗ *${vp.moTa}*\n┗ 📍 ${vp.nguonGoc} • dùng \`.luyendan\` để xem công thức`
      );
    } else if (laHatGiong(item.tenCay)) {
      const cay = layCayTuHatGiong(item.tenCay);
      if (cay) {
        danhSachHat.push(`🌱 **Hạt ${cay.ten}** x${item.soLuong}\n┗ ID: \`${item.tenCay}\` • dùng \`.trong ${cay.id}\` để gieo`);
      } else {
        danhSachHat.push(`🌱 \`${item.tenCay}\` x${item.soLuong}`);
      }
    } else {
      const cay = cayMap.get(item.tenCay);
      if (!cay) {
        danhSachCay.push(`❓ \`${item.tenCay}\` x${item.soLuong}`);
        continue;
      }
      const giaTri = cay.giaBan * item.soLuong;
      tongGiaTri += giaTri;
      danhSachCay.push(`${cay.emoji} **${cay.ten}** [${cay.doHiem}] x${item.soLuong}\n┗ Trị giá: ${formatXu(giaTri)} • \`.ban ${cay.id}\``);
    }
  }

  const moTa: string[] = ["*\"Mỗi linh thảo trong Bảo Nang đều mang linh khí của người trồng...\"*"];
  if (danhSachDacBiet.length) {
    moTa.push("\n🧬 **Vật Phẩm Đặc Biệt (Linh Tinh & Boss Hạch — dùng Luyện Đan):**\n" + danhSachDacBiet.join("\n"));
  }
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
