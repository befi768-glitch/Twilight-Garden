import { Message, EmbedBuilder } from "discord.js";
import { layThoiTietHomNay, layThoiTietNgay } from "../utils/weather";

export async function xuLyThoiTiet(message: Message) {
  if (!message.guildId) return;

  const thoiTiet = layThoiTietHomNay(message.guildId);

  // Lấy thời tiết 4 ngày tiếp theo
  const lichhThoiTiet: string[] = [];
  for (let i = 1; i <= 4; i++) {
    const ngay = new Date();
    ngay.setDate(ngay.getDate() + i);
    const tt = layThoiTietNgay(message.guildId, ngay);
    const tenNgay = ngay.toLocaleDateString("vi-VN", { weekday: "short", day: "numeric", month: "numeric" });
    lichhThoiTiet.push(`${tt.emoji} **${tenNgay}** — ${tt.ten}`);
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
        name: "📅 Dự Báo 4 Ngày Tới",
        value: lichhThoiTiet.join("\n"),
      }
    )
    .setFooter({ text: "🌸 Thời tiết thay đổi mỗi ngày — chuẩn bị kế hoạch gieo trồng hợp lý!" })
    .setTimestamp();

  await message.reply({ embeds: [embed] });
}
