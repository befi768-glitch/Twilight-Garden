import { Message, EmbedBuilder } from "discord.js";
import { layHoacTaoNguoiChoi, layVuon, truXu } from "../database/queries";
import { db } from "../database/db";
import { sql } from "drizzle-orm";
import { oDat } from "../database/schema";
import { eq, and, isNotNull } from "drizzle-orm";
import { cayMap } from "../data/plants";
import { coChongPhaVuon } from "../data/pets";
import { MAU_DO, MAU_VANG, MAU_XANH, MAU_CHINH, formatXu } from "../utils/helpers";

const COOLDOWN_MS   = 6 * 60 * 60 * 1000; // 6 tiếng
const TY_LE_THANH_CONG      = 0.6;        // 60% bình thường
const TY_LE_THANH_CONG_QUY  = 0.2;        // 20% khi nạn nhân có Linh Quy
const PHAT_THAT_BAI          = 150;        // Mất 150 xu nếu thất bại
const SO_O_PHA_MIN     = 1;
const SO_O_PHA_MAX     = 2;

export async function xuLyPhaVuon(message: Message, args: string[]) {
  const mucTieu = message.mentions.users.first();

  if (!mucTieu) {
    return message.reply("⚔️ Dùng: `.pavuon @người` để phá vườn của họ!");
  }
  if (mucTieu.id === message.author.id) {
    return message.reply("🤦 Bạn không thể tự phá vườn của chính mình!");
  }
  if (mucTieu.bot) {
    return message.reply("🤖 Không thể phá vườn của bot!");
  }
  if (!message.guild) return;

  const kePha = await layHoacTaoNguoiChoi(message.author.id, message.guild.id);
  const chuVuon = await layHoacTaoNguoiChoi(mucTieu.id, message.guild.id);

  // ── Kiểm tra cooldown ──────────────────────────────────────────────────────
  const cooldownRow = await db.execute<{ pavuon_cooldown: Date | null }>(
    `SELECT pavuon_cooldown FROM nguoi_choi WHERE id = ${kePha.id}`
  );
  const lastPha: Date | null = cooldownRow.rows[0]?.pavuon_cooldown
    ? new Date(cooldownRow.rows[0].pavuon_cooldown)
    : null;

  if (lastPha) {
    const diff = Date.now() - lastPha.getTime();
    if (diff < COOLDOWN_MS) {
      const conLai = COOLDOWN_MS - diff;
      const gio = Math.floor(conLai / 3600000);
      const phut = Math.floor((conLai % 3600000) / 60000);
      const embed = new EmbedBuilder()
        .setColor(MAU_DO)
        .setTitle("⏳ Hồi Chiêu Chưa Xong!")
        .setDescription(
          `*Linh lực phá hoại chưa hồi phục...*\n\n` +
          `Bạn cần đợi thêm **${gio} giờ ${phut} phút** để ra tay tiếp!`
        );
      return message.reply({ embeds: [embed] });
    }
  }

  // ── Kiểm tra pet chống phá vườn của nạn nhân ─────────────────────────────
  const petNanNhan = await db.execute<{ pet_id: string | null }>(
    `SELECT pet_id FROM nguoi_choi WHERE id = ${chuVuon.id}`
  );
  const petIdNanNhan = petNanNhan.rows[0]?.pet_id ?? null;

  const coQuy = coChongPhaVuon(petIdNanNhan);
  const tyLe = coQuy ? TY_LE_THANH_CONG_QUY : TY_LE_THANH_CONG;

  // ── Lấy danh sách ô đang có cây (chưa thu hoạch) ─────────────────────────
  const vuon = await layVuon(chuVuon.id);
  const oDangTrong = vuon.filter((o) => o.tenCay !== null && o.tenCay !== undefined);

  // Cập nhật cooldown ngay
  await db.execute(sql`UPDATE nguoi_choi SET pavuon_cooldown = NOW() WHERE id = ${kePha.id}`);

  if (oDangTrong.length === 0) {
    const embed = new EmbedBuilder()
      .setColor(MAU_XANH)
      .setTitle("🌑 Vườn Trống Hoang!")
      .setDescription(
        `*Bạn lẻn vào vườn của **${mucTieu.displayName}**...*\n\n` +
        `Vườn họ không có cây nào để phá! Lãng phí công sức.\n` +
        `*(Cooldown đã được tính)*`
      );
    return message.reply({ embeds: [embed] });
  }

  const thanhCong = Math.random() < tyLe;

  if (thanhCong) {
    // Chọn ngẫu nhiên 1-2 ô để phá
    const soOPha = Math.min(
      oDangTrong.length,
      SO_O_PHA_MIN + Math.floor(Math.random() * (SO_O_PHA_MAX - SO_O_PHA_MIN + 1))
    );

    // Xáo trộn rồi lấy đầu
    const oChoTu = [...oDangTrong].sort(() => Math.random() - 0.5).slice(0, soOPha);

    // Xoá cây khỏi các ô được chọn
    const cayBiPha: string[] = [];
    for (const o of oChoTu) {
      const cay = cayMap.get(o.tenCay!);
      cayBiPha.push(`${cay?.emoji ?? "🌿"} **${cay?.ten ?? o.tenCay}** (Ô ${o.viTri})`);

      await db
        .update(oDat)
        .set({ tenCay: null, trongLuc: null, truongThanhLuc: null, daTuoi: false, soLuongThuHoach: 1 })
        .where(and(eq(oDat.nguoiChoiId, chuVuon.id), eq(oDat.viTri, o.viTri)));
    }

    // Thông báo DM cho chủ vườn
    const embedNanNhan = new EmbedBuilder()
      .setColor(MAU_DO)
      .setTitle("💥 Vườn Của Bạn Bị Phá Hoại!")
      .setDescription(
        `*Ác nhân lẻn vào phá tan linh địa của bạn...*\n\n` +
        `**${message.author.displayName}** vừa phá **${soOPha} ô cây** trong vườn bạn!\n\n` +
        `🌿 Cây bị phá:\n${cayBiPha.join("\n")}\n\n` +
        `💡 Dùng \`.pavuon @${message.author.username}\` để trả thù!`
      )
      .setFooter({ text: `Server: ${message.guild!.name}` });

    try {
      await mucTieu.send({ embeds: [embedNanNhan] });
    } catch {
      if (message.channel.isSendable())
        await message.channel.send({ content: `<@${mucTieu.id}>`, embeds: [embedNanNhan] });
    }

    // Kết quả cho kẻ phá
    const embed = new EmbedBuilder()
      .setColor(MAU_VANG)
      .setTitle("🔥 Phá Vườn Thành Công!")
      .setDescription(
        `*Bóng tối che phủ, bạn lẻn vào vườn của **${mucTieu.displayName}** và tàn phá!*\n\n` +
        `Bạn đã phá **${soOPha} ô cây**:\n${cayBiPha.join("\n")}\n\n` +
        `⚠️ *Linh vệ truy tìm kẻ phá hoại... hãy cẩn thận!*`
      )
      .setFooter({ text: `Cooldown: 6 tiếng • Tỷ lệ thành công: ${Math.round(tyLe * 100)}%${coQuy ? " (Linh Quy giảm từ 60%)" : ""}` })
      .setTimestamp();

    return message.reply({ embeds: [embed] });

  } else {
    // Thất bại — bị bắt, phạt xu
    const okPhat = await truXu(kePha.id, PHAT_THAT_BAI);

    const embed = new EmbedBuilder()
      .setColor(MAU_DO)
      .setTitle("🚨 Bị Linh Vệ Bắt Quả Tang!")
      .setDescription(
        `*Bạn định phá vườn của **${mucTieu.displayName}** nhưng Linh Vệ đang canh gác!*\n\n` +
        `Bạn bị phạt **${formatXu(PHAT_THAT_BAI)}**${!okPhat ? " *(không đủ xu)*" : ""}!\n\n` +
        `😔 *Phá hoại không phải lúc nào cũng dễ dàng...*`
      )
      .setFooter({ text: `Cooldown: 6 tiếng • Tỷ lệ thành công: ${Math.round(tyLe * 100)}%${coQuy ? " (Linh Quy giảm từ 60%)" : ""}` })
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  }
}
