import { Message, EmbedBuilder } from "discord.js";
import { bangXepHang } from "../database/queries";
import { layThongTinCap } from "../data/plants";
import { MAU_VANG, TEN_TIEN, EMOJI_TIEN, TEN_KN, EMOJI_KN } from "../utils/helpers";

const HIEU = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];

export async function xuLyBangXepHang(message: Message) {
  const top10 = await bangXepHang(message.guildId!);

  if (!top10.length) {
    return message.reply(
      `*"Bảng Anh Hùng còn trống — hãy là người đầu tiên tu luyện trong Twilight Garden!"*`
    );
  }

  const danhSach = top10.map((p, i) => {
    const member = message.guild?.members.cache.get(p.userId);
    const tenHienThi = member?.displayName ?? `<@${p.userId}>`;
    const thongTinCap = layThongTinCap(p.capDo);

    return (
      `${HIEU[i]} **${tenHienThi}** — Cấp ${p.capDo} *${thongTinCap.tenCap}*\n` +
      `┗ ${EMOJI_KN} ${p.kinhNghiem.toLocaleString("vi-VN")} ${TEN_KN} • ${EMOJI_TIEN} ${p.xu.toLocaleString("vi-VN")} ${TEN_TIEN}`
    );
  });

  const embed = new EmbedBuilder()
    .setColor(MAU_VANG)
    .setTitle("🏆 Bảng Anh Hùng — Twilight Garden")
    .setDescription(
      `*"Những tu sĩ kiệt xuất nhất của Vườn Twilight..."*\n\n` +
      danhSach.join("\n\n")
    )
    .setFooter({ text: `Xếp hạng theo ${TEN_KN} • Thu hái nhiều linh thảo để leo hạng!` })
    .setTimestamp();

  await message.reply({ embeds: [embed] });
}
