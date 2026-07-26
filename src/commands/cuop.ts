import { Message, EmbedBuilder } from "discord.js";
import { layHoacTaoNguoiChoi, truXu, congXuVaKinhNghiem } from "../database/queries";
import { db } from "../database/db";
import { nguoiChoi } from "../database/schema";
import { eq } from "drizzle-orm";
import { MAU_DO, MAU_VANG, MAU_XANH, formatXu } from "../utils/helpers";

const COOLDOWN_MS = 4 * 60 * 60 * 1000; // 4 tiếng
const TY_LE_THANH_CONG = 0.4;           // 40%
const PHAN_TRAM_CUOP = 0.15;            // Cướp 15% xu nạn nhân
const PHAT_PHAN_TRAM = 0.1;             // Mất 10% xu của mình nếu thất bại
const XU_TROL_THIEU_NHAT = 200;         // Nạn nhân phải có ít nhất 200 xu

export async function xuLyCuop(message: Message, args: string[]) {
  const mucTieu = message.mentions.users.first();
  if (!mucTieu) {
    return message.reply("❌ Dùng: `.cuop @người` để cướp xu của họ!");
  }
  if (mucTieu.id === message.author.id) {
    return message.reply("🤦 Bạn không thể tự cướp của chính mình!");
  }
  if (mucTieu.bot) {
    return message.reply("🤖 Không thể cướp của bot!");
  }

  const keKhuyen = await layHoacTaoNguoiChoi(message.author.id, message.guildId!);
  const nanNhan = await layHoacTaoNguoiChoi(mucTieu.id, message.guildId!);

  // Kiểm tra cooldown
  const cooldownRow = await db.execute<{ cuop_cooldown: Date | null }>(
    `SELECT cuop_cooldown FROM nguoi_choi WHERE id = ${keKhuyen.id}`
  );
  const lastCuop: Date | null = cooldownRow.rows[0]?.cuop_cooldown
    ? new Date(cooldownRow.rows[0].cuop_cooldown)
    : null;

  if (lastCuop) {
    const diff = Date.now() - lastCuop.getTime();
    if (diff < COOLDOWN_MS) {
      const conLai = COOLDOWN_MS - diff;
      const gio = Math.floor(conLai / 3600000);
      const phut = Math.floor((conLai % 3600000) / 60000);
      const embed = new EmbedBuilder()
        .setColor(MAU_DO)
        .setTitle("⏳ Hồi Chiêu Chưa Xong!")
        .setDescription(
          `*Kế hoạch cướp bóc cần thời gian chuẩn bị...*\n\n` +
          `Bạn cần đợi thêm **${gio} giờ ${phut} phút** để ra tay tiếp!`
        );
      return message.reply({ embeds: [embed] });
    }
  }

  // Kiểm tra nạn nhân có đủ xu không
  const nanNhanInfo = await db.select().from(nguoiChoi).where(eq(nguoiChoi.id, nanNhan.id)).limit(1);
  const xuNanNhan = nanNhanInfo[0]?.xu ?? 0;

  // Cập nhật cooldown
  await db.execute(`UPDATE nguoi_choi SET cuop_cooldown = NOW() WHERE id = ${keKhuyen.id}`);

  if (xuNanNhan < XU_TROL_THIEU_NHAT) {
    const embed = new EmbedBuilder()
      .setColor(MAU_XANH)
      .setTitle("😅 Cướp Hụt!")
      .setDescription(
        `*Bạn định cướp của **${mucTieu.displayName}** nhưng...*\n\n` +
        `Họ chỉ có **${formatXu(xuNanNhan)}** — quá ít để đáng cướp!\n` +
        `*(Cần ít nhất ${formatXu(XU_TROL_THIEU_NHAT)} để tiến hành)*\n\n` +
        `*(Cooldown đã được tính)*`
      );
    return message.reply({ embeds: [embed] });
  }

  const thanhCong = Math.random() < TY_LE_THANH_CONG;

  if (thanhCong) {
    const soXuCuop = Math.floor(xuNanNhan * PHAN_TRAM_CUOP);
    await truXu(nanNhan.id, soXuCuop);
    await congXuVaKinhNghiem(keKhuyen.id, soXuCuop, 0);

    const embed = new EmbedBuilder()
      .setColor(MAU_VANG)
      .setTitle("💰 Cướp Thành Công!")
      .setDescription(
        `*Dưới ánh trăng tà, bạn chặn đường **${mucTieu.displayName}** và lấy đi túi tiền!*\n\n` +
        `Bạn cướp được: **${formatXu(soXuCuop)}** (15% tài sản của họ)\n\n` +
        `⚠️ *Nghiệp quả sẽ theo bạn mãi... hoặc không!*`
      )
      .setFooter({ text: `Cooldown: 4 tiếng • Tỷ lệ thành công: 40%` });
    return message.reply({ embeds: [embed] });
  } else {
    // Thất bại — mất 10% xu của mình
    const keKhuyenInfo = await db.select().from(nguoiChoi).where(eq(nguoiChoi.id, keKhuyen.id)).limit(1);
    const xuKeKhuyen = keKhuyenInfo[0]?.xu ?? 0;
    const soXuPhat = Math.max(50, Math.floor(xuKeKhuyen * PHAT_PHAN_TRAM));
    const okPhat = await truXu(keKhuyen.id, soXuPhat);

    const embed = new EmbedBuilder()
      .setColor(MAU_DO)
      .setTitle("🚔 Bị Linh Vệ Bắt!")
      .setDescription(
        `*Bạn định cướp của **${mucTieu.displayName}** nhưng Linh Vệ đang mai phục!*\n\n` +
        `Bạn bị phạt: **${formatXu(soXuPhat)}** (10% tài sản)${!okPhat ? " *(không đủ xu)*" : ""}\n\n` +
        `😤 *Tội ác không bao giờ thắng được lẽ phải... đôi khi!*`
      )
      .setFooter({ text: "Cooldown: 4 tiếng • Tỷ lệ thành công: 40%" });
    return message.reply({ embeds: [embed] });
  }
}
