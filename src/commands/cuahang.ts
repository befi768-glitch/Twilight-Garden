import { Message, EmbedBuilder } from "discord.js";
import { danhSachCay, iconDoHiem } from "../data/plants";
import { formatXu, MAU_CHINH, TEN_TIEN, EMOJI_TIEN } from "../utils/helpers";

export async function xuLyCuaHang(message: Message) {
  const lines = danhSachCay.map((c) => {
    const thoiGian = c.thoiGianMoc < 60
      ? `${c.thoiGianMoc} phút`
      : `${Math.floor(c.thoiGianMoc / 60)} giờ`;
    return `${iconDoHiem[c.doHiem]} ${c.emoji} **${c.ten}** [${c.doHiem}]\n┗ ID: \`${c.id}\` • Hạt: \`hat_${c.id}\`\n┗ Mua: \`${c.giaMua} ${EMOJI_TIEN}\` • Bán: \`${c.giaBan} ${EMOJI_TIEN}\` • ⏳ ${thoiGian}\n┗ *${c.moTa}*`;
  });

  const embed = new EmbedBuilder()
    .setColor(MAU_CHINH)
    .setTitle("🏮 Linh Thảo Các — Cửa Hàng Twilight Garden")
    .setDescription(
      "*\"Mỗi gói hạt giống đều mang trong mình một câu chuyện riêng...\"*\n\n" +
      "🌱 *Cửa hàng bán **gói hạt giống** — mua về rồi dùng `.trong` để gieo, sau đó `.thuhoach` để thu hoạch!*\n\n" +
      lines.join("\n\n")
    )
    .addFields({
      name: "📖 Phẩm Cấp Linh Thảo",
      value: "⬜ Phàm Phẩm  🟦 Linh Phẩm  🟪 Tiên Phẩm  🟨 Thần Phẩm",
    })
    .setFooter({
      text: `💡 .mua <tên | id> • .trong <tên | id | hat_id> • .ban <tên | id> | Tiền tệ: ${TEN_TIEN} ${EMOJI_TIEN}`,
    })
    .setTimestamp();

  await message.reply({ embeds: [embed] });
}
