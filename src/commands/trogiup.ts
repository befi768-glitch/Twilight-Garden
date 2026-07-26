import { Message, EmbedBuilder } from "discord.js";
import { MAU_CHINH } from "../utils/helpers";

export async function xuLyTroGiup(message: Message, prefix: string) {
  const p = prefix;

  const embed = new EmbedBuilder()
    .setColor(MAU_CHINH)
    .setTitle("🌸 Twilight Garden — Trợ Giúp")
    .setDescription("Bot trồng cây Discord bằng tiếng Việt! Bắt đầu với `" + p + "vuon`")
    .addFields(
      {
        name: "🌿 Vườn tược",
        value: [
          `\`${p}vuon\` — Xem vườn và thông tin của bạn`,
          `\`${p}trong <tên cây>\` — Trồng cây vào ô trống`,
          `\`${p}tuoi [số ô]\` — Tưới nước (giảm 20% thời gian, thu hoạch x2)`,
          `\`${p}thuhoach [số ô]\` — Thu hoạch cây đã chín`,
        ].join("\n"),
      },
      {
        name: "🏪 Mua bán",
        value: [
          `\`${p}cuahang\` — Xem tất cả cây và giá cả`,
          `\`${p}mua <tên cây> [số]\` — Mua hạt giống`,
          `\`${p}ban <tên cây> [số]\` — Bán nông sản lấy xu`,
          `\`${p}ban tất\` — Bán toàn bộ túi đồ`,
        ].join("\n"),
      },
      {
        name: "🎒 Quản lý",
        value: [
          `\`${p}tuidо\` — Xem túi đồ`,
          `\`${p}bangxephang\` — Top 10 người chơi trong server`,
          `\`${p}tang @người <tên> [số]\` — Tặng đồ cho người khác`,
        ].join("\n"),
      },
      {
        name: "📖 Hệ thống cấp độ",
        value: [
          "Thu hoạch cây để nhận kinh nghiệm → lên cấp → mở thêm ô đất",
          "Tưới nước trước khi thu hoạch để nhận x2 sản phẩm!",
          "Cây huyền thoại **Hoa Twilight** cho nhiều KN nhất 🌸",
        ].join("\n"),
      }
    )
    .setFooter({ text: `Prefix: ${p} | Twilight Garden Bot` })
    .setTimestamp();

  await message.reply({ embeds: [embed] });
}
