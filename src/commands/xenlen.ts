import { Message, EmbedBuilder } from "discord.js";
import { layHoacTaoNguoiChoi, layVuon } from "../database/queries";
import { cayMap, layThongTinCap } from "../data/plants";
import { formatThoiGian, thanhTienTrinh, MAU_CHINH, MAU_DO, TEN_DAT } from "../utils/helpers";

const TY_LE_BI_PHAT_HIEN = 0.3; // 30% bị chủ vườn phát hiện

export async function xuLyXenLen(message: Message, args: string[]) {
  const mucTieu = message.mentions.users.first();

  if (!mucTieu) {
    return message.reply("👁️ Dùng: `.xenlen @người` để lén xem vườn của họ!");
  }
  if (mucTieu.id === message.author.id) {
    return message.reply("🤦 Xem vườn của chính mình thì dùng `.vuon` thôi!");
  }
  if (mucTieu.bot) {
    return message.reply("🤖 Bot không có vườn để xem lén!");
  }
  if (!message.guild) return;

  const chuVuon = await layHoacTaoNguoiChoi(mucTieu.id, message.guild.id);
  const vuon = await layVuon(chuVuon.id);
  const thongTinCap = layThongTinCap(chuVuon.capDo);
  const bayGio = new Date();

  // Xây dựng hiển thị vườn (ẩn thông tin xu, chỉ hiện cây)
  let hienThiVuon = "";
  let soCayDangTrong = 0;
  let soCaySanSang = 0;

  for (const o of vuon) {
    if (!o.tenCay) {
      hienThiVuon += `**${TEN_DAT} ${o.viTri}** — 🌑 Trống\n`;
    } else {
      soCayDangTrong++;
      const cay = cayMap.get(o.tenCay);
      if (!cay) continue;

      const conLai = o.truongThanhLuc!.getTime() - bayGio.getTime();
      const thoiGianTrong = o.truongThanhLuc!.getTime() - o.trongLuc!.getTime();
      const daTroi = thoiGianTrong - conLai;
      const phanTram = Math.min(100, Math.round((daTroi / thoiGianTrong) * 100));

      if (conLai <= 0) {
        soCaySanSang++;
        hienThiVuon += `**${TEN_DAT} ${o.viTri}** — ${cay.emoji} ${cay.ten} ✅ **Đã chín!**\n`;
      } else {
        const tuoiIcon = o.daTuoi ? "💧" : "🏜️";
        hienThiVuon += `**${TEN_DAT} ${o.viTri}** — ${cay.emoji} ${cay.ten} [${cay.doHiem}] ${tuoiIcon}\n`;
        hienThiVuon += `┗ \`${thanhTienTrinh(phanTram)}\` ${phanTram}% — còn **${formatThoiGian(conLai)}**\n`;
      }
    }
  }

  // Có 30% chance chủ vườn nhận DM biết bị xem lén
  const biPhatHien = Math.random() < TY_LE_BI_PHAT_HIEN;
  if (biPhatHien) {
    const embedCanhBao = new EmbedBuilder()
      .setColor(MAU_DO)
      .setTitle("👁️ Có Người Đang Lén Nhìn Vườn Bạn!")
      .setDescription(
        `*Linh khí trong vườn chợt rung động...*\n\n` +
        `**${message.author.displayName}** vừa lén nhìn vào Linh Địa của bạn!\n\n` +
        `💡 Dùng \`.pavuon @${message.author.username}\` để trả đũa!`
      )
      .setFooter({ text: `Server: ${message.guild!.name}` });

    try {
      await mucTieu.send({ embeds: [embedCanhBao] });
    } catch {
      // DM bị tắt — không thông báo, xem lén thành công hoàn toàn
    }
  }

  // Embed kết quả cho người xem lén
  const embed = new EmbedBuilder()
    .setColor(MAU_CHINH)
    .setTitle(`👁️ Vườn Của ${mucTieu.displayName} (Lén Nhìn)`)
    .setDescription(
      `*Bạn nhón chân lén nhìn qua hàng rào...*\n\n` +
      `${hienThiVuon || "*Linh địa hoang vu, chẳng có gì để xem.*"}`
    )
    .addFields(
      { name: "🧘 Tu Vi", value: `Cấp ${chuVuon.capDo} — ${thongTinCap.tenCap}`, inline: true },
      { name: "🌿 Đang trồng", value: `${soCayDangTrong} cây`, inline: true },
      { name: "✅ Có thể thu", value: `${soCaySanSang} cây`, inline: true },
    )
    .setFooter({
      text: biPhatHien
        ? `⚠️ Chủ vườn đã phát hiện ra bạn! (30% xác suất)`
        : `👻 Xem lén thành công — họ không hay biết gì! (70% xác suất)`,
    })
    .setTimestamp();

  return message.reply({ embeds: [embed] });
}
