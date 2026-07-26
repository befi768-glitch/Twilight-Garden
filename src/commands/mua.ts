import { Message, EmbedBuilder } from "discord.js";
import { layHoacTaoNguoiChoi, truXu, themVaoTuiDo } from "../database/queries";
import { timCayTheoTen, layHatGiongId, layAnhCay } from "../data/plants";
import { formatXu, MAU_CHINH, MAU_DO, TEN_TIEN, EMOJI_TIEN } from "../utils/helpers";

export async function xuLyMua(message: Message, args: string[]) {
  if (!args.length) {
    return message.reply(
      "❌ Bạn muốn mua linh thảo gì? Dùng `.mua <tên linh thảo> [số lượng]`\nVD: `.mua Hoàng Căn 5` hoặc `.mua huyết mai`"
    );
  }

  let soLuong = 1;
  let tenArgs = [...args];
  const cuoi = parseInt(args[args.length - 1]);
  if (!isNaN(cuoi) && cuoi > 0) {
    soLuong = cuoi;
    tenArgs = args.slice(0, -1);
  }

  const tenCay = tenArgs.join(" ");
  const cay = timCayTheoTen(tenCay);

  if (!cay) {
    return message.reply(
      `❌ Không tìm thấy linh thảo **${tenCay}**!\nDùng \`.cuahang\` để xem danh sách Linh Thảo Các.`
    );
  }

  if (soLuong > 99) return message.reply("❌ Mua tối đa 99 hạt một lần!");

  const tongTien = cay.giaMua * soLuong;
  const player = await layHoacTaoNguoiChoi(message.author.id, message.guildId!);

  if (player.xu < tongTien) {
    const embed = new EmbedBuilder()
      .setColor(MAU_DO)
      .setTitle(`💠 Không Đủ ${TEN_TIEN}!`)
      .setDescription(
        `*"Nguyệt Thạch chưa đủ để thỉnh linh thảo quý này..."*\n\n` +
        `Cần: **${formatXu(tongTien)}**\nBạn có: **${formatXu(player.xu)}**`
      )
      .setThumbnail(`attachment://${cay.id}.png`);
    return message.reply({
      files: [{ attachment: layAnhCay(cay.id), name: `${cay.id}.png` }],
      embeds: [embed],
    });
  }

  await truXu(player.id, tongTien);
  await themVaoTuiDo(player.id, layHatGiongId(cay.id), soLuong);

  const embed = new EmbedBuilder()
    .setColor(MAU_CHINH)
    .setTitle(`✅ Mua Hạt Giống Thành Công!`)
    .setDescription(
      `*"Nàng Tiên Các trao cho bạn ${soLuong}x **Hạt ${cay.ten}** — hãy gieo trồng để thu hoạch~"*`
    )
    .setThumbnail(`attachment://${cay.id}.png`)
    .addFields(
      { name: `💠 Đã Chi`, value: formatXu(tongTien), inline: true },
      { name: `💠 Còn Lại`, value: formatXu(player.xu - tongTien), inline: true },
      { name: `📦 Phẩm Cấp`, value: cay.doHiem, inline: true }
    )
    .setFooter({ text: "💡 Dùng .trong <tên linh thảo> để gieo hạt vào Linh Địa!" });

  await message.reply({
    files: [{ attachment: layAnhCay(cay.id), name: `${cay.id}.png` }],
    embeds: [embed],
  });
}
