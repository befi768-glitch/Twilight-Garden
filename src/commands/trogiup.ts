import { Message, EmbedBuilder } from "discord.js";
import { MAU_CHINH } from "../utils/helpers";

export async function xuLyTroGiup(message: Message, prefix: string) {
  const p = prefix;

  const embed = new EmbedBuilder()
    .setColor(MAU_CHINH)
    .setTitle("🌸 Twilight Garden — Trợ Giúp")
    .setDescription(
      "*\"Chào mừng đến với Vườn Twilight huyền bí — nơi mỗi hạt giống ươm mầm phép màu...\"*\n\nPrefix: `" + p + "`"
    )
    .addFields(
      {
        name: "🌿 Vườn tược",
        value: [
          `\`${p}vuon\` — Xem vườn và thông tin nhân vật`,
          `\`${p}trong <tên cây>\` — Trồng cây vào ô trống`,
          `\`${p}tuoi [số ô]\` — Tưới nước (-20% thời gian, thu hoạch x2)`,
          `\`${p}thuhoach [số ô]\` — Thu hoạch cây đã chín`,
        ].join("\n"),
      },
      {
        name: "🏪 Mua bán",
        value: [
          `\`${p}cuahang\` — Xem tất cả cây và giá cả`,
          `\`${p}mua <tên cây> [số]\` — Mua hạt giống`,
          `\`${p}ban <tên cây> [số]\` — Bán nông sản`,
          `\`${p}ban tất\` — Bán toàn bộ túi đồ`,
        ].join("\n"),
      },
      {
        name: "🎒 Quản lý",
        value: [
          `\`${p}tuidо\` — Xem túi đồ`,
          `\`${p}bangxephang\` — Top 10 server`,
          `\`${p}tang @người <tên> [số]\` — Tặng đồ`,
        ].join("\n"),
      },
      {
        name: "🎁 Hàng ngày",
        value: [
          `\`${p}diemdanh\` — Điểm danh nhận xu mỗi ngày`,
          `Streak càng dài thưởng càng cao! 🔥`,
        ].join("\n"),
      },
      {
        name: "✨ Sự kiện ngẫu nhiên",
        value: [
          "Khi thu hoạch có thể xảy ra sự kiện đặc biệt:",
          "🌕 **Trăng Rằm** — Thu hoạch thêm 1 cái",
          "🌱 **Hạt giống bí ẩn** — Nhận hạt giống miễn phí",
          "✨ **Phép màu Twilight** — Bonus xu bất ngờ",
        ].join("\n"),
      }
    )
    .setFooter({ text: "🌸 Twilight Garden — Nơi mỗi hạt giống ươm mầm phép màu" })
    .setTimestamp();

  await message.reply({ embeds: [embed] });
}
