import { Message, EmbedBuilder } from "discord.js";
import { layHoacTaoNguoiChoi, layVuon } from "../database/queries";
import { cayMap, layThongTinCap, layCapTiepTheo } from "../data/plants";
import { formatThoiGian, formatXu, thanhTienTrinh, MAU_CHINH, TEN_DAT, TEN_KN, EMOJI_KN, EMOJI_TIEN } from "../utils/helpers";

export async function xuLyVuon(message: Message) {
  const player = await layHoacTaoNguoiChoi(message.author.id, message.guildId!);
  const vuon = await layVuon(player.id);
  const thongTinCap = layThongTinCap(player.capDo);
  const capTiep = layCapTiepTheo(player.capDo);
  const bayGio = new Date();

  let hienThiVuon = "";
  for (const o of vuon) {
    if (!o.tenCay) {
      hienThiVuon += `**${TEN_DAT} ${o.viTri}** — 🌑 Trống\n`;
    } else {
      const cay = cayMap.get(o.tenCay);
      if (!cay) continue;

      const conLai = o.truongThanhLuc!.getTime() - bayGio.getTime();
      const thoiGianTrong = o.truongThanhLuc!.getTime() - o.trongLuc!.getTime();
      const daTroi = thoiGianTrong - conLai;
      const phanTram = Math.min(100, Math.round((daTroi / thoiGianTrong) * 100));

      if (conLai <= 0) {
        hienThiVuon += `**${TEN_DAT} ${o.viTri}** — ${cay.emoji} ${cay.ten} ✅ **SẴN SÀNG THU HOẠCH!**\n`;
      } else {
        const tuoiIcon = o.daTuoi ? "💧" : "🏜️";
        hienThiVuon += `**${TEN_DAT} ${o.viTri}** — ${cay.emoji} ${cay.ten} [${cay.doHiem}] ${tuoiIcon}\n`;
        hienThiVuon += `┗ \`${thanhTienTrinh(phanTram)}\` ${phanTram}% — còn **${formatThoiGian(conLai)}**\n`;
      }
    }
  }

  let linhLucBar = "";
  if (capTiep) {
    const phanTramKN = Math.round(
      ((player.kinhNghiem - thongTinCap.kinhNghiemCanThiet) /
        (capTiep.kinhNghiemCanThiet - thongTinCap.kinhNghiemCanThiet)) * 100
    );
    linhLucBar = `\`${thanhTienTrinh(phanTramKN, 12)}\` ${player.kinhNghiem}/${capTiep.kinhNghiemCanThiet} ${EMOJI_KN}`;
  } else {
    linhLucBar = `⚡ Đạt đỉnh cao tu luyện!`;
  }

  const embed = new EmbedBuilder()
    .setColor(MAU_CHINH)
    .setTitle(`🌿 Linh Địa của ${message.author.displayName}`)
    .setDescription(
      `*"Khu vườn huyền bí phản chiếu tâm hồn người chủ..."*\n\n${hienThiVuon || "*Linh địa hoang vu, hãy gieo trồng linh thảo!*"}`
    )
    .addFields(
      {
        name: "🧘 Tu Vi",
        value: `**Cấp ${player.capDo}** — ${thongTinCap.tenCap}\n${linhLucBar}`,
        inline: true,
      },
      {
        name: `💠 ${EMOJI_TIEN} Nguyệt Thạch`,
        value: formatXu(player.xu),
        inline: true,
      },
      {
        name: `🌑 ${TEN_DAT}`,
        value: `${vuon.length} ô`,
        inline: true,
      }
    )
    .setFooter({ text: "💡 .cuahang để xem linh thảo • .trong <tên> để gieo trồng" })
    .setTimestamp();

  await message.reply({ embeds: [embed] });
}
