import { Message, EmbedBuilder } from "discord.js";
import { layHoacTaoNguoiChoi, layTuiDo, ban as banDB, themVaoTuiDo, truXu } from "../database/queries";
import { db } from "../database/db";
import { MAU_CHINH, MAU_DO, MAU_VANG, MAU_XANH, formatXu } from "../utils/helpers";
import { cayMap, laHatGiong } from "../data/plants";

const COOLDOWN_MS = 2 * 60 * 60 * 1000; // 2 tiếng
const TY_LE_THANH_CONG = 0.55;           // 55%
const PHAT_THAT_BAI = 80;                // Mất 80 xu nếu thất bại

export async function xuLyTrom(message: Message, args: string[]) {
  const mucTieu = message.mentions.users.first();
  if (!mucTieu) {
    return message.reply("❌ Dùng: `.trom @người` để trộm linh thảo của họ!");
  }
  if (mucTieu.id === message.author.id) {
    return message.reply("🤦 Bạn không thể tự trộm của chính mình!");
  }
  if (mucTieu.bot) {
    return message.reply("🤖 Không thể trộm của bot!");
  }

  const keKhuyen = await layHoacTaoNguoiChoi(message.author.id, message.guildId!);
  const nanNhan = await layHoacTaoNguoiChoi(mucTieu.id, message.guildId!);

  // Kiểm tra cooldown
  const cooldownRow = await db.execute<{ trom_cooldown: Date | null }>(
    `SELECT trom_cooldown FROM nguoi_choi WHERE id = ${keKhuyen.id}`
  );
  const lastTrom: Date | null = cooldownRow.rows[0]?.trom_cooldown
    ? new Date(cooldownRow.rows[0].trom_cooldown)
    : null;

  if (lastTrom) {
    const diff = Date.now() - lastTrom.getTime();
    if (diff < COOLDOWN_MS) {
      const conLai = COOLDOWN_MS - diff;
      const gio = Math.floor(conLai / 3600000);
      const phut = Math.floor((conLai % 3600000) / 60000);
      const embed = new EmbedBuilder()
        .setColor(MAU_DO)
        .setTitle("⏳ Hồi Chiêu Chưa Xong!")
        .setDescription(
          `*Linh lực trộm đạo chưa hồi phục...*\n\n` +
          `Bạn cần đợi thêm **${gio} giờ ${phut} phút** để ra tay tiếp!`
        );
      return message.reply({ embeds: [embed] });
    }
  }

  // Kiểm tra túi đồ nạn nhân (chỉ trộm linh thảo đã thu hoạch, không trộm hạt giống)
  const tuiNanNhan = (await layTuiDo(nanNhan.id)).filter(
    (item) => !laHatGiong(item.tenCay) && item.soLuong > 0
  );

  // Cập nhật cooldown trước
  await db.execute(`UPDATE nguoi_choi SET trom_cooldown = NOW() WHERE id = ${keKhuyen.id}`);

  if (!tuiNanNhan.length) {
    // Vẫn tính cooldown nhưng không có phạt
    const embed = new EmbedBuilder()
      .setColor(MAU_XANH)
      .setTitle("🕵️ Trộm Hụt!")
      .setDescription(
        `*Bạn lẻn vào vườn của **${mucTieu.displayName}**...*\n\n` +
        `Túi đồ của họ trống rỗng! Không có gì để lấy cả. 😅\n` +
        `*(Cooldown đã được tính)*`
      );
    return message.reply({ embeds: [embed] });
  }

  const thanhCong = Math.random() < TY_LE_THANH_CONG;

  if (thanhCong) {
    // Chọn ngẫu nhiên 1 loại linh thảo và lấy 1 cái
    const chon = tuiNanNhan[Math.floor(Math.random() * tuiNanNhan.length)];
    const soLuongLay = Math.min(chon.soLuong, Math.max(1, Math.floor(chon.soLuong * 0.3)));
    const cay = cayMap.get(chon.tenCay);

    await banDB(nanNhan.id, chon.tenCay, soLuongLay);
    await themVaoTuiDo(keKhuyen.id, chon.tenCay, soLuongLay);

    // Thông báo cho nạn nhân
    const embedNanNhan = new EmbedBuilder()
      .setColor(MAU_DO)
      .setTitle("🚨 Bạn Vừa Bị Trộm!")
      .setDescription(
        `*Kẻ trộm lẻn vào Bảo Nang của bạn trong đêm tối...*\n\n` +
        `**${message.author.displayName}** đã lấy đi: ${cay?.emoji ?? "🌿"} **${cay?.ten ?? chon.tenCay}** x${soLuongLay}\n\n` +
        `💡 Dùng \`.trom\` hoặc \`.cuop\` để trả thù!`
      )
      .setFooter({ text: `Server: ${message.guild!.name}` });

    try {
      await mucTieu.send({ embeds: [embedNanNhan] });
    } catch {
      // DM bị tắt — thông báo trong kênh
      if (message.channel.isSendable()) await message.channel.send({ content: `<@${mucTieu.id}>`, embeds: [embedNanNhan] });
    }

    const embed = new EmbedBuilder()
      .setColor(MAU_VANG)
      .setTitle("🥷 Trộm Thành Công!")
      .setDescription(
        `*Bóng tối che phủ... bạn lẻn vào vườn của **${mucTieu.displayName}** mà không ai hay biết!*\n\n` +
        `Bạn đã lấy được: ${cay?.emoji ?? "🌿"} **${cay?.ten ?? chon.tenCay}** x${soLuongLay}\n\n` +
        `⚠️ *Hành vi trộm đạo sẽ bị báo oán nếu bị phát hiện...*`
      )
      .setFooter({ text: `Cooldown: 2 tiếng • ${mucTieu.username} mất ${soLuongLay}x ${cay?.ten}` });
    return message.reply({ embeds: [embed] });
  } else {
    // Thất bại — bị bắt, phạt xu
    const okPhat = await truXu(keKhuyen.id, PHAT_THAT_BAI);
    const embed = new EmbedBuilder()
      .setColor(MAU_DO)
      .setTitle("🚨 Bị Bắt Quả Tang!")
      .setDescription(
        `*Bạn lẻn vào vườn của **${mucTieu.displayName}** nhưng bị phát hiện!*\n\n` +
        `Linh vệ ập đến, bạn bị phạt **${formatXu(PHAT_THAT_BAI)}**${!okPhat ? " *(không đủ xu)*" : ""}!\n\n` +
        `😔 *Lần sau hãy cẩn thận hơn...*`
      )
      .setFooter({ text: "Cooldown: 2 tiếng • Tỷ lệ thành công: 55%" });
    return message.reply({ embeds: [embed] });
  }
}
