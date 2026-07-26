import { Message, EmbedBuilder } from "discord.js";
import { layHoacTaoNguoiChoi, congXuVaKinhNghiem } from "../database/queries";
import { db } from "../database/db";
import { MAU_CHINH, MAU_VANG, MAU_DO, formatXu, TEN_TIEN, EMOJI_TIEN } from "../utils/helpers";

function tinhThuong(streak: number): { xu: number; danhHieu: string; moTa: string } {
  if (streak >= 30) return { xu: 300, danhHieu: "👑 Thần Nông Giác Ngộ",    moTa: "30+ ngày chăm chỉ tu luyện" };
  if (streak >= 14) return { xu: 200, danhHieu: "💎 Linh Sư Chuyên Cần",    moTa: "14+ ngày không gián đoạn" };
  if (streak >= 7)  return { xu: 150, danhHieu: "🌟 Đạo Nông Siêng Năng",   moTa: "7+ ngày liên tục" };
  if (streak >= 3)  return { xu: 100, danhHieu: "🌿 Tu Sĩ Cần Mẫn",         moTa: "3+ ngày liên tục" };
  return               { xu: 60,  danhHieu: "🌱 Tiểu Đồng Mới Nhập Môn", moTa: "Ngày đầu tu luyện" };
}

export async function xuLyDiemDanh(message: Message) {
  const player = await layHoacTaoNguoiChoi(message.author.id, message.guildId!);

  const now = new Date();
  const homNay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const result = await db.execute<{ last_check_in: Date | null; streak: number | null }>(
    `SELECT last_check_in, streak FROM nguoi_choi WHERE id = ${player.id}`
  );
  const info = result.rows[0];
  const lastCheckIn: Date | null = info?.last_check_in ? new Date(info.last_check_in) : null;

  if (lastCheckIn) {
    const ngayLast = new Date(lastCheckIn.getFullYear(), lastCheckIn.getMonth(), lastCheckIn.getDate());

    // Đã điểm danh hôm nay rồi
    if (ngayLast.getTime() === homNay.getTime()) {
      const reset = new Date(homNay.getTime() + 24 * 60 * 60 * 1000);
      const giayConLai = Math.floor((reset.getTime() - now.getTime()) / 1000);
      const gio = Math.floor(giayConLai / 3600);
      const phut = Math.floor((giayConLai % 3600) / 60);

      const embed = new EmbedBuilder()
        .setColor(MAU_DO)
        .setTitle("🌙 Nguyệt Lễ Đã Thực Hiện!")
        .setDescription(
          `*"Nàng Tiên thì thầm: Linh khí hôm nay đã cạn, hãy quay lại vào ngày mai~"*\n\n` +
          `⏳ Hồi chiêu: **${gio} giờ ${phut} phút**`
        );
      return message.reply({ embeds: [embed] });
    }

    // Kiểm tra streak có liên tục không
    const kemHomQuaMs = homNay.getTime() - 24 * 60 * 60 * 1000;
    const isHomQua = ngayLast.getTime() === kemHomQuaMs;
    const streakMoi = isHomQua ? (info?.streak ?? 0) + 1 : 1;
    return await thucHienDiemDanh(message, player.id, streakMoi);
  }

  // Lần đầu tiên điểm danh
  return await thucHienDiemDanh(message, player.id, 1);
}

async function thucHienDiemDanh(message: Message, playerId: number, streak: number) {
  const { xu, danhHieu, moTa } = tinhThuong(streak);

  await db.execute(
    `UPDATE nguoi_choi SET last_check_in = NOW(), streak = ${streak} WHERE id = ${playerId}`
  );
  await congXuVaKinhNghiem(playerId, xu, 0);

  const hinhAnh = streak >= 7 ? "🌕" : streak >= 3 ? "🌙" : "🌱";
  const loiChao = [
    `*"Linh khí buổi sáng thanh tịnh nhất — hãy tận dụng tốt ngày hôm nay~"*`,
    `*"Mỗi ngày tu luyện, khu vườn thêm phần linh thiêng..."*`,
    `*"Nàng Tiên Twilight gật đầu hài lòng trước sự kiên trì của bạn~"*`,
    `*"Ánh hoàng hôn buông xuống, một ngày mới đầy linh khí bắt đầu!"*`,
  ];
  const loi = loiChao[Math.floor(Math.random() * loiChao.length)];

  const embed = new EmbedBuilder()
    .setColor(streak >= 7 ? MAU_VANG : MAU_CHINH)
    .setTitle(`${hinhAnh} Nguyệt Lễ Thành Công!`)
    .setDescription(loi)
    .addFields(
      { name: `🎁 ${TEN_TIEN} Nhận Được`, value: formatXu(xu), inline: true },
      { name: "🔥 Liên Tiếp",             value: `${streak} ngày`,  inline: true },
      { name: "🏅 Danh Hiệu",             value: `${danhHieu}\n*${moTa}*`, inline: false }
    )
    .setFooter({ text: `Duy trì chuỗi ngày để nhận nhiều ${TEN_TIEN} ${EMOJI_TIEN} hơn!` })
    .setTimestamp();

  if (streak > 1 && streak % 7 === 0) {
    embed.addFields({
      name: "🎉 Cột Mốc Tu Luyện!",
      value: `Bạn đã tu luyện **${streak} ngày** liên tiếp! Linh khí trong vườn dâng trào! 🌸`,
    });
  }

  await message.reply({ embeds: [embed] });
}
