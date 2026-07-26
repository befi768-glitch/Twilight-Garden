import { Message, EmbedBuilder } from "discord.js";
import { layHoacTaoNguoiChoi, congXuVaKinhNghiem } from "../database/queries";
import { db } from "../database/db";
import { nguoiChoi } from "../database/schema";
import { eq, and } from "drizzle-orm";
import { MAU_CHINH, MAU_VANG, MAU_DO, formatXu } from "../utils/helpers";

function tinhThuong(streak: number): { xu: number; moTa: string } {
  if (streak >= 30) return { xu: 300, moTa: "👑 Truyền nhân Twilight (30+ ngày)" };
  if (streak >= 14) return { xu: 200, moTa: "💎 Người Gác Vườn (14+ ngày)" };
  if (streak >= 7)  return { xu: 150, moTa: "🌟 Vườn Thủ Chăm Chỉ (7+ ngày)" };
  if (streak >= 3)  return { xu: 100, moTa: "🌿 Nông Dân Siêng Năng (3+ ngày)" };
  return { xu: 60, moTa: "🌱 Người Mới Bắt Đầu" };
}

export async function xuLyDiemDanh(message: Message) {
  const player = await layHoacTaoNguoiChoi(message.author.id, message.guildId!);

  // Kiểm tra last_check_in từ DB
  const now = new Date();
  const homNay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Lấy thông tin điểm danh từ cột extended
  const result = await db.execute<{ last_check_in: Date | null; streak: number | null }>(
    `SELECT last_check_in, streak FROM nguoi_choi WHERE id = ${player.id}`
  );
  const info = result.rows[0];

  const lastCheckIn: Date | null = info?.last_check_in ? new Date(info.last_check_in) : null;

  if (lastCheckIn) {
    const homQuaLast = new Date(
      lastCheckIn.getFullYear(),
      lastCheckIn.getMonth(),
      lastCheckIn.getDate()
    );

    // Đã điểm danh hôm nay
    if (homQuaLast.getTime() === homNay.getTime()) {
      const reset = new Date(homNay.getTime() + 24 * 60 * 60 * 1000);
      const giayConLai = Math.floor((reset.getTime() - now.getTime()) / 1000);
      const gio = Math.floor(giayConLai / 3600);
      const phut = Math.floor((giayConLai % 3600) / 60);

      const embed = new EmbedBuilder()
        .setColor(MAU_DO)
        .setTitle("📅 Đã điểm danh hôm nay!")
        .setDescription(
          `*Nàng tiên vườn nói: "Hãy quay lại vào ngày mai nhé~"*\n\nThời gian hồi chiêu: **${gio} giờ ${phut} phút**`
        );
      return message.reply({ embeds: [embed] });
    }

    // Kiểm tra streak - hôm qua có điểm danh không
    const kemHomQuaMs = homNay.getTime() - 24 * 60 * 60 * 1000;
    const isHomQua = homQuaLast.getTime() === kemHomQuaMs;
    const streakMoi = isHomQua ? (info?.streak ?? 0) + 1 : 1;

    return await thucHienDiemDanh(message, player.id, streakMoi);
  }

  // Lần đầu điểm danh
  return await thucHienDiemDanh(message, player.id, 1);
}

async function thucHienDiemDanh(message: Message, playerId: number, streak: number) {
  const { xu, moTa } = tinhThuong(streak);

  // Cập nhật streak và last_check_in
  await db.execute(
    `UPDATE nguoi_choi SET last_check_in = NOW(), streak = ${streak} WHERE id = ${playerId}`
  );

  await congXuVaKinhNghiem(playerId, xu, 0);

  const hinhAnh = streak >= 7 ? "🌕" : streak >= 3 ? "🌙" : "🌱";

  const loiThoai = [
    `*"Chào buổi sáng! Vườn Twilight đón chào bạn trở lại~"*`,
    `*"Mỗi ngày một chút, khu vườn ngày càng thêm rực rỡ..."*`,
    `*"Nàng tiên mỉm cười khi thấy bạn chăm chỉ điểm danh~"*`,
    `*"Ánh bình minh chiếu rọi, một ngày mới đầy phép màu bắt đầu!"*`,
  ];
  const loi = loiThoai[Math.floor(Math.random() * loiThoai.length)];

  const embed = new EmbedBuilder()
    .setColor(streak >= 7 ? MAU_VANG : MAU_CHINH)
    .setTitle(`${hinhAnh} Điểm Danh Thành Công!`)
    .setDescription(loi)
    .addFields(
      { name: "🎁 Phần thưởng", value: formatXu(xu), inline: true },
      { name: "🔥 Chuỗi ngày", value: `${streak} ngày liên tiếp`, inline: true },
      { name: "🏅 Danh hiệu", value: moTa, inline: false }
    )
    .setFooter({ text: "Quay lại ngày mai để duy trì chuỗi và nhận thưởng cao hơn!" })
    .setTimestamp();

  if (streak > 1 && streak % 7 === 0) {
    embed.addFields({
      name: "🎉 Cột mốc đặc biệt!",
      value: `Bạn đã điểm danh **${streak} ngày** liên tiếp! Vườn Twilight ghi nhận sự kiên trì của bạn! 🌸`,
    });
  }

  await message.reply({ embeds: [embed] });
}
