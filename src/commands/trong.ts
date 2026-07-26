import { Message, EmbedBuilder } from "discord.js";
import { layHoacTaoNguoiChoi, layVuon, trong as trongDB, truXu } from "../database/queries";
import { timCayTheoTen, mauDoHiem } from "../data/plants";
import { formatXu, MAU_DO, MAU_CHINH } from "../utils/helpers";

export async function xuLyTrong(message: Message, args: string[]) {
  if (!args.length) {
    return message.reply("❌ Bạn muốn trồng cây gì? Dùng `.trong <tên cây>` — VD: `.trong cà rốt`");
  }

  const tenCay = args.join(" ");
  const cay = timCayTheoTen(tenCay);

  if (!cay) {
    return message.reply(`❌ Không tìm thấy cây **${tenCay}**! Dùng \`.cuahang\` để xem danh sách cây.`);
  }

  const player = await layHoacTaoNguoiChoi(message.author.id, message.guildId!);
  const vuon = await layVuon(player.id);

  // Tìm ô trống
  const oTrong = vuon.find((o) => !o.tenCay);
  if (!oTrong) {
    const embed = new EmbedBuilder()
      .setColor(MAU_DO)
      .setTitle("🌿 Vườn đã đầy!")
      .setDescription("Không còn ô đất trống. Hãy thu hoạch cây đã chín trước!\n\nLên cấp để mở thêm ô đất 🌱");
    return message.reply({ embeds: [embed] });
  }

  // Kiểm tra xu
  if (player.xu < cay.giaMua) {
    return message.reply(
      `❌ Không đủ xu! Bạn có ${formatXu(player.xu)}, cần ${formatXu(cay.giaMua)} để mua hạt giống **${cay.ten}**.`
    );
  }

  // Trừ xu và trồng cây
  await truXu(player.id, cay.giaMua);
  await trongDB(player.id, oTrong.viTri, cay.id, cay.thoiGianMoc);

  const chinLuc = new Date(Date.now() + cay.thoiGianMoc * 60 * 1000);
  const gioChin = `<t:${Math.floor(chinLuc.getTime() / 1000)}:R>`;

  const embed = new EmbedBuilder()
    .setColor(mauDoHiem[cay.doHiem] ?? MAU_CHINH)
    .setTitle(`${cay.emoji} Đã trồng ${cay.ten}!`)
    .setDescription(`Bạn đã trồng **${cay.ten}** vào **Ô ${oTrong.viTri}**`)
    .addFields(
      { name: "⏰ Thu hoạch", value: gioChin, inline: true },
      { name: "💰 Chi phí", value: formatXu(cay.giaMua), inline: true },
      { name: "📦 Bán được", value: formatXu(cay.giaBan) + " mỗi cái", inline: true }
    )
    .setFooter({ text: "💧 Dùng .tuoi để tưới nước, giảm 20% thời gian + thu hoạch x2!" });

  await message.reply({ embeds: [embed] });
}
