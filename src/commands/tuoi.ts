import { Message, EmbedBuilder } from "discord.js";
import { layHoacTaoNguoiChoi, layVuon, tuoi as tuoiDB } from "../database/queries";
import { cayMap } from "../data/plants";
import { formatThoiGian, MAU_CHINH, MAU_DO } from "../utils/helpers";
import { layLoiThoaiNgauNhien } from "../utils/events";

export async function xuLyTuoi(message: Message, args: string[]) {
  const player = await layHoacTaoNguoiChoi(message.author.id, message.guildId!);
  const vuon = await layVuon(player.id);
  const bayGio = new Date();

  if (args[0]) {
    const viTri = parseInt(args[0]);
    if (isNaN(viTri)) return message.reply("❌ Số ô không hợp lệ! VD: `.tuoi 1`");

    const o = vuon.find((v) => v.viTri === viTri);
    if (!o || !o.tenCay) return message.reply(`❌ Ô ${viTri} trống hoặc không tồn tại!`);
    if (o.daTuoi) {
      return message.reply(`💧 *Nàng tiên vườn thì thầm: "Ô ${viTri} đã đủ nước rồi, đừng tưới quá nhiều~"*`);
    }

    const ok = await tuoiDB(player.id, viTri);
    if (!ok) return message.reply(`❌ Không thể tưới ô ${viTri}!`);

    const cay = cayMap.get(o.tenCay!);
    const conLai = o.truongThanhLuc!.getTime() - bayGio.getTime();
    const moiConLai = conLai - conLai * 0.2;
    const loiThoai = layLoiThoaiNgauNhien("tuoi");

    const embed = new EmbedBuilder()
      .setColor(MAU_CHINH)
      .setTitle(`💧 Đã tưới ô ${viTri}!`)
      .setDescription(`${loiThoai}\n\n${cay?.emoji} **${cay?.ten}** được tưới đẫm nước sương!`)
      .addFields(
        { name: "⏰ Thời gian còn lại", value: formatThoiGian(moiConLai), inline: true },
        { name: "✨ Hiệu ứng", value: "-20% thời gian", inline: true }
      );

    return message.reply({ embeds: [embed] });
  }

  const chuaTuoi = vuon.filter((o) => o.tenCay && !o.daTuoi && o.truongThanhLuc && o.truongThanhLuc > bayGio);

  if (chuaTuoi.length === 0) {
    const embed = new EmbedBuilder()
      .setColor(MAU_DO)
      .setTitle("💧 Không có gì để tưới")
      .setDescription("*Nàng tiên vườn mỉm cười: \"Tất cả cây đều no nước rồi~\"*\n\nDùng `.tuoi <số ô>` để tưới ô cụ thể.");
    return message.reply({ embeds: [embed] });
  }

  let daTuoi = 0;
  for (const o of chuaTuoi) {
    const ok = await tuoiDB(player.id, o.viTri);
    if (ok) daTuoi++;
  }

  const danhSachTuoi = chuaTuoi
    .map((o) => {
      const cay = cayMap.get(o.tenCay!);
      return `${cay?.emoji} **${cay?.ten}** (Ô ${o.viTri})`;
    })
    .join("\n");

  const loiThoai = layLoiThoaiNgauNhien("tuoi");

  const embed = new EmbedBuilder()
    .setColor(MAU_CHINH)
    .setTitle(`💧 Đã tưới ${daTuoi} cây!`)
    .setDescription(`${loiThoai}\n\n${danhSachTuoi}`)
    .setFooter({ text: "✨ Thời gian giảm 20%!" });

  await message.reply({ embeds: [embed] });
}
