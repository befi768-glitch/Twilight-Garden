import { Message, EmbedBuilder } from "discord.js";
import { bangXepHang } from "../database/queries";
import { layThongTinCap } from "../data/plants";
import { formatXu, MAU_VANG } from "../utils/helpers";

const HIEU = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];

export async function xuLyBangXepHang(message: Message) {
  const top10 = await bangXepHang(message.guildId!);

  if (!top10.length) {
    return message.reply("📊 Chưa có ai trong bảng xếp hạng! Hãy là người đầu tiên trồng cây.");
  }

  const danhSach = await Promise.all(
    top10.map(async (p, i) => {
      let tenHienThi: string;
      try {
        const member = await message.guild?.members.fetch(p.userId);
        tenHienThi = member?.displayName ?? `Người chơi #${p.userId.slice(-4)}`;
      } catch {
        tenHienThi = `Người chơi #${p.userId.slice(-4)}`;
      }

      const thongTinCap = layThongTinCap(p.capDo);
      return `${HIEU[i]} **${tenHienThi}** — Cấp ${p.capDo} ${thongTinCap.tenCap}\n┗ ✨ ${p.kinhNghiem.toLocaleString("vi-VN")} KN • 🪙 ${p.xu.toLocaleString("vi-VN")} xu`;
    })
  );

  const embed = new EmbedBuilder()
    .setColor(MAU_VANG)
    .setTitle("🏆 Bảng Xếp Hạng — Twilight Garden")
    .setDescription(danhSach.join("\n\n"))
    .setFooter({ text: "Xếp hạng theo kinh nghiệm • Thu hoạch nhiều để leo hạng!" })
    .setTimestamp();

  await message.reply({ embeds: [embed] });
}
