import { Message, EmbedBuilder } from "discord.js";
import { layHoacTaoNguoiChoi, layVuon } from "../database/queries";
import { cayMap, layThongTinCap, layCapTiepTheo } from "../data/plants";
import { formatThoiGian, formatXu, thanhTienTrinh, MAU_CHINH } from "../utils/helpers";

export async function xuLyVuon(message: Message) {
  const player = await layHoacTaoNguoiChoi(message.author.id, message.guildId!);
  const vuon = await layVuon(player.id);
  const thongTinCap = layThongTinCap(player.capDo);
  const capTiep = layCapTiepTheo(player.capDo);

  const bayGio = new Date();

  // Xây dựng hiển thị vườn
  let hienThiVuon = "";
  for (const o of vuon) {
    if (!o.tenCay) {
      hienThiVuon += `**Ô ${o.viTri}** — 🟫 Trống\n`;
    } else {
      const cay = cayMap.get(o.tenCay);
      if (!cay) continue;

      const conLai = o.truongThanhLuc!.getTime() - bayGio.getTime();
      const thoiGianTrong = o.truongThanhLuc!.getTime() - o.trongLuc!.getTime();
      const daTroi = thoiGianTrong - conLai;
      const phanTram = Math.min(100, Math.round((daTroi / thoiGianTrong) * 100));

      if (conLai <= 0) {
        hienThiVuon += `**Ô ${o.viTri}** — ${cay.emoji} ${cay.ten} ✅ **SẴN SÀNG THU HOẠCH!**\n`;
      } else {
        const tuoiIcon = o.daTuoi ? "💧" : "🏜️";
        hienThiVuon += `**Ô ${o.viTri}** — ${cay.emoji} ${cay.ten} ${tuoiIcon}\n`;
        hienThiVuon += `┗ \`${thanhTienTrinh(phanTram)}\` ${phanTram}% — còn **${formatThoiGian(conLai)}**\n`;
      }
    }
  }

  // Tính KN tiếp theo
  let kinhNghiemBar = "";
  if (capTiep) {
    const phanTramKN = Math.round(
      ((player.kinhNghiem - (thongTinCap.kinhNghiemCanThiet ?? 0)) /
        (capTiep.kinhNghiemCanThiet - (thongTinCap.kinhNghiemCanThiet ?? 0))) *
        100
    );
    kinhNghiemBar = `\`${thanhTienTrinh(phanTramKN, 12)}\` ${player.kinhNghiem}/${capTiep.kinhNghiemCanThiet} KN`;
  } else {
    kinhNghiemBar = `✨ Đã đạt cấp tối đa!`;
  }

  const embed = new EmbedBuilder()
    .setColor(MAU_CHINH)
    .setTitle(`🌿 Vườn của ${message.author.displayName}`)
    .setDescription(hienThiVuon || "*Vườn trống trơn, hãy trồng gì đó đi!*")
    .addFields(
      {
        name: "👤 Thông tin",
        value: `Cấp **${player.capDo}** — ${thongTinCap.tenCap}\n${kinhNghiemBar}`,
        inline: true,
      },
      {
        name: "💰 Ví tiền",
        value: formatXu(player.xu),
        inline: true,
      },
      {
        name: "🌱 Ô đất",
        value: `${vuon.length} ô`,
        inline: true,
      }
    )
    .setFooter({ text: "💡 Dùng .cuahang để mua hạt giống • .trong <tên cây> để trồng" })
    .setTimestamp();

  await message.reply({ embeds: [embed] });
}
