import { Message, EmbedBuilder } from "discord.js";
import { MAU_CHINH, TEN_TIEN, EMOJI_TIEN, TEN_KN, EMOJI_KN, TEN_DAT } from "../utils/helpers";

export async function xuLyTroGiup(message: Message, prefix: string) {
  const p = prefix;

  const embed = new EmbedBuilder()
    .setColor(MAU_CHINH)
    .setTitle("🌸 Twilight Garden — Bí Kíp Tu Luyện")
    .setDescription(
      `*"Chào mừng đến với Twilight Garden — vùng đất nơi linh thảo nở hoa dưới ánh hoàng hôn huyền bí..."*\n\n` +
      `**Tiền tệ:** ${TEN_TIEN} ${EMOJI_TIEN} • **Kinh nghiệm:** ${TEN_KN} ${EMOJI_KN} • **Đất:** ${TEN_DAT}\n` +
      `**Prefix:** \`${p}\``
    )
    .addFields(
      {
        name: "🌿 Linh Địa — Vườn Tu Luyện",
        value: [
          `\`${p}vuon\` — Xem Linh Địa và tu vi của bạn`,
          `\`${p}trong <tên linh thảo>\` — Gieo trồng vào Linh Địa`,
          `\`${p}tuoi [số ô]\` — Tưới sương nguyệt (-20% thời gian, thu x2)`,
          `\`${p}thuhoach [số ô]\` — Thu hái linh thảo đã trưởng thành`,
        ].join("\n"),
      },
      {
        name: "🏮 Linh Thảo Các — Mua Bán",
        value: [
          `\`${p}cuahang\` — Xem tất cả linh thảo và giá ${EMOJI_TIEN}`,
          `\`${p}mua <tên> [số]\` — Mua hạt linh thảo`,
          `\`${p}ban <tên> [số]\` — Bán linh thảo lấy ${TEN_TIEN}`,
          `\`${p}ban tất\` — Bán toàn bộ Bảo Nang`,
        ].join("\n"),
      },
      {
        name: "🎒 Bảo Nang — Quản Lý",
        value: [
          `\`${p}tuidо\` — Xem Bảo Nang (túi đồ)`,
          `\`${p}bangxephang\` — Bảng Anh Hùng top 10`,
          `\`${p}tang @người <tên> [số]\` — Tặng linh thảo`,
        ].join("\n"),
      },
      {
        name: "🌙 Nguyệt Lễ — Hàng Ngày",
        value: [
          `\`${p}diemdanh\` (hoặc \`${p}dd\`) — Nhận ${TEN_TIEN} ${EMOJI_TIEN} mỗi ngày`,
          `🔥 Duy trì chuỗi ngày để nhận thưởng cao hơn!`,
        ].join("\n"),
      },
      {
        name: "⚡ Thiên Cơ — Sự Kiện Ngẫu Nhiên",
        value: [
          "Khi thu hái có thể xuất hiện thiên cơ:",
          `🌕 **Nguyệt Mãn** — Thu thêm 1 linh thảo`,
          `🌱 **Hạt Giống Thiên Số** — Nhận linh thảo miễn phí`,
          `✨ **Phép Màu Twilight** — Bonus ${TEN_TIEN} bất ngờ`,
        ].join("\n"),
      },
      {
        name: "📖 Phẩm Cấp Linh Thảo",
        value: "⬜ Phàm Phẩm → 🟦 Linh Phẩm → 🟪 Tiên Phẩm → 🟨 Thần Phẩm",
      }
    )
    .setFooter({ text: "🌸 Twilight Garden — Nơi linh thảo nở hoa dưới ánh hoàng hôn" })
    .setTimestamp();

  await message.reply({ embeds: [embed] });
}
