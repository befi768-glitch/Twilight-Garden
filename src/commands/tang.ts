import { Message, EmbedBuilder } from "discord.js";
import { layHoacTaoNguoiChoi, tang as tangDB } from "../database/queries";
import { timCayTheoTen } from "../data/plants";
import { MAU_CHINH, MAU_DO } from "../utils/helpers";

export async function xuLyTang(message: Message, args: string[]) {
  if (args.length < 2) {
    return message.reply(
      "❌ Cách dùng: `.tang @người_dùng <tên cây> [số lượng]`\nVD: `.tang @bạn cà rốt 5`"
    );
  }

  const nguoiNhan = message.mentions.users.first();
  if (!nguoiNhan) return message.reply("❌ Hãy tag người bạn muốn tặng! VD: `.tang @bạn cà rốt`");
  if (nguoiNhan.id === message.author.id) return message.reply("❌ Không thể tự tặng cho mình!");
  if (nguoiNhan.bot) return message.reply("❌ Bot không nhận quà đâu!");

  // Bỏ mention ra khỏi args
  const argsKhongMention = args.filter((a) => !a.startsWith("<@"));

  let soLuong = 1;
  let tenArgs = [...argsKhongMention];
  const cuoi = parseInt(argsKhongMention[argsKhongMention.length - 1]);
  if (!isNaN(cuoi) && cuoi > 0) {
    soLuong = cuoi;
    tenArgs = argsKhongMention.slice(0, -1);
  }

  const tenCay = tenArgs.join(" ");
  const cay = timCayTheoTen(tenCay);

  if (!cay) {
    return message.reply(`❌ Không tìm thấy **${tenCay}**! Dùng \`.tuidо\` để xem túi đồ.`);
  }

  const nguoiTang = await layHoacTaoNguoiChoi(message.author.id, message.guildId!);
  const nguoiNhanPlayer = await layHoacTaoNguoiChoi(nguoiNhan.id, message.guildId!);

  const ok = await tangDB(nguoiTang.id, nguoiNhanPlayer.id, cay.id, soLuong);

  if (!ok) {
    const embed = new EmbedBuilder()
      .setColor(MAU_DO)
      .setTitle("❌ Không đủ hàng")
      .setDescription(`Bạn không có đủ **${soLuong}x ${cay.ten}** để tặng!\nDùng \`.tuidо\` để kiểm tra.`);
    return message.reply({ embeds: [embed] });
  }

  const embed = new EmbedBuilder()
    .setColor(MAU_CHINH)
    .setTitle("🎁 Đã tặng quà!")
    .setDescription(
      `${message.author} đã tặng cho ${nguoiNhan} **${soLuong}x ${cay.emoji} ${cay.ten}**!\n\n💌 *Thật tốt bụng!*`
    );

  await message.reply({ embeds: [embed] });
}
