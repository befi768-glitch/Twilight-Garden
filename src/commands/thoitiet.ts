import { Message, EmbedBuilder } from "discord.js";
import { layThoiTietHomNay, layThoiTietNgay } from "../utils/weather";

export async function xuLyThoiTiet(message: Message) {
  if (!message.guildId) return;

  const thoiTiet = layThoiTietHomNay(message.guildId);

  // Lấy thời tiết 4 giờ tiếp theo
  const lichhThoiTiet: string[] = [];
  for (let i = 1; i <= 4; i++) {
    const gio = new Date();
    gio.setHours(gio.getHours() + i);
    const tt = layThoiTietNgay(message.guildId, gio);
    const tenGio = gio.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    lichhThoiTiet.push(`${tt.emoji} **${tenGio}** — ${tt.ten}`);
  }

  const embed = new EmbedBuilder()
    .setColor(thoiTiet.mauEmbed)
    .setTitle(`${thoiTiet.emoji} Thời Tiết Hôm Nay — ${thoiTiet.ten}`)
    .setDescription(
      `*"${thoiTiet.moTa}..."*\n\n` +
      `**Hiệu ứng hôm nay:**\n${thoiTiet.hieu_ung}`
    )
    .addFields(
      {
        name: "🕐 Dự Báo 4 Giờ Tới",
        value: lichhThoiTiet.join("\n"),
      }
    )
    .setFooter({ text: "🌸 Thời tiết thay đổi mỗi giờ — chuẩn bị kế hoạch gieo trồng hợp lý!" })
    .setTimestamp();

  await message.reply({ embeds: [embed] });
}
