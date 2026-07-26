import { Message, EmbedBuilder } from "discord.js";
import { danhSachCay, mauDoHiem } from "../data/plants";
import { formatXu, MAU_CHINH } from "../utils/helpers";

const NHAN_DO_HIEM: Record<string, string> = {
  thường: "⬜",
  hiếm: "🟦",
  "cực hiếm": "🟪",
  "huyền thoại": "🟨",
};

export async function xuLyCuaHang(message: Message) {
  const lines = danhSachCay.map(
    (c) =>
      `${NHAN_DO_HIEM[c.doHiem]} ${c.emoji} **${c.ten}** — Mua: ${formatXu(c.giaMua)} | Bán: ${formatXu(c.giaBan)} | ⏰ ${c.thoiGianMoc < 60 ? c.thoiGianMoc + " phút" : Math.floor(c.thoiGianMoc / 60) + " giờ"}`
  );

  const embed = new EmbedBuilder()
    .setColor(MAU_CHINH)
    .setTitle("🏪 Cửa Hàng Twilight Garden")
    .setDescription(lines.join("\n"))
    .addFields({
      name: "📖 Chú thích độ hiếm",
      value: "⬜ Thường  🟦 Hiếm  🟪 Cực Hiếm  🟨 Huyền Thoại",
    })
    .setFooter({
      text: "💡 Dùng .mua <tên cây> để mua hạt giống | .trong <tên cây> để trồng ngay",
    })
    .setTimestamp();

  await message.reply({ embeds: [embed] });
}
