import { Message, EmbedBuilder } from "discord.js";
import { danhSachCay, iconDoHiem } from "../data/plants";
import { formatXu, MAU_CHINH, TEN_TIEN, EMOJI_TIEN } from "../utils/helpers";

export async function xuLyCuaHang(message: Message) {
  const lines = danhSachCay.map((c) => {
    const thoiGian = c.thoiGianMoc < 60
      ? `${c.thoiGianMoc} phút`
      : `${Math.floor(c.thoiGianMoc / 60)} giờ`;
    return `${iconDoHiem[c.doHiem]} ${c.emoji} **${c.ten}** [${c.doHiem}]\n┗ Mua: \`${c.giaMua} ${EMOJI_TIEN}\` • Bán: \`${c.giaBan} ${EMOJI_TIEN}\` • ⏳ ${thoiGian}\n┗ *${c.moTa}*`;
  });

  const embed = new EmbedBuilder()
    .setColor(MAU_CHINH)
    .setTitle("🏮 Linh Thảo Các — Cửa Hàng Twilight Garden")
    .setDescription(
      "*\"Mỗi linh thảo đều mang trong mình một câu chuyện riêng...\"*\n\n" +
      lines.join("\n\n")
    )
    .addFields({
      name: "📖 Phẩm Cấp Linh Thảo",
      value: "⬜ Phàm Phẩm  🟦 Linh Phẩm  🟪 Tiên Phẩm  🟨 Thần Phẩm",
    })
    .setFooter({
      text: `💡 Dùng .mua <tên thảo> để mua • .trong <tên thảo> để gieo trồng | Tiền tệ: ${TEN_TIEN} ${EMOJI_TIEN}`,
    })
    .setTimestamp();

  await message.reply({ embeds: [embed] });
}
