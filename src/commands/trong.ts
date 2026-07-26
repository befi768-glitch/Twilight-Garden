import { Message, EmbedBuilder } from "discord.js";
import { layHoacTaoNguoiChoi, layVuon, trong as trongDB, truXu } from "../database/queries";
import { timCayTheoTen, mauDoHiem } from "../data/plants";
import { formatXu, MAU_DO, MAU_CHINH } from "../utils/helpers";
import { layLoiThoaiNgauNhien } from "../utils/events";

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

  const oTrong = vuon.find((o) => !o.tenCay);
  if (!oTrong) {
    const embed = new EmbedBuilder()
      .setColor(MAU_DO)
      .setTitle("🌿 Vườn đã đầy!")
      .setDescription("*Nàng tiên vườn lắc đầu buồn bã...*\n\nKhông còn ô đất trống! Hãy thu hoạch cây đã chín trước, hoặc lên cấp để mở thêm ô đất 🌱");
    return message.reply({ embeds: [embed] });
  }

  if (player.xu < cay.giaMua) {
    return message.reply(
      `❌ Không đủ xu! Bạn có ${formatXu(player.xu)}, cần ${formatXu(cay.giaMua)} để mua hạt giống **${cay.ten}**.`
    );
  }

  await truXu(player.id, cay.giaMua);
  await trongDB(player.id, oTrong.viTri, cay.id, cay.thoiGianMoc);

  const chinLuc = new Date(Date.now() + cay.thoiGianMoc * 60 * 1000);
  const gioChin = `<t:${Math.floor(chinLuc.getTime() / 1000)}:R>`;
  const loiThoai = layLoiThoaiNgauNhien("trong");

  const embed = new EmbedBuilder()
    .setColor(mauDoHiem[cay.doHiem] ?? MAU_CHINH)
    .setTitle(`${cay.emoji} Đã trồng ${cay.ten}!`)
    .setDescription(`${loiThoai}\n\n**${cay.ten}** đã được gieo xuống **Ô ${oTrong.viTri}** 🌱`)
    .addFields(
      { name: "⏰ Thu hoạch", value: gioChin, inline: true },
      { name: "💰 Chi phí", value: formatXu(cay.giaMua), inline: true },
      { name: "📦 Bán được", value: formatXu(cay.giaBan) + " / cái", inline: true }
    )
    .setFooter({ text: "💧 Tưới nước để giảm 20% thời gian và thu hoạch x2!" });

  await message.reply({ embeds: [embed] });
}
