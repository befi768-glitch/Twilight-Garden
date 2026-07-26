import { Message, EmbedBuilder } from "discord.js";
import { layHoacTaoNguoiChoi, tang as tangDB } from "../database/queries";
import { timCayTheoTen } from "../data/plants";
import { MAU_CHINH, MAU_DO } from "../utils/helpers";

export async function xuLyTang(message: Message, args: string[]) {
  if (args.length < 2) {
    return message.reply(
      "❌ Cách dùng: `.tang @người_dùng <tên linh thảo> [số lượng]`\nVD: `.tang @bạn Hoàng Căn 5`"
    );
  }

  const nguoiNhan = message.mentions.users.first();
  if (!nguoiNhan) return message.reply("❌ Hãy tag người bạn muốn tặng linh thảo!");
  if (nguoiNhan.id === message.author.id) return message.reply("❌ Không thể tự tặng cho chính mình!");
  if (nguoiNhan.bot) return message.reply("❌ Bot không cần linh thảo đâu bạn ơi!");

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
    return message.reply(
      `❌ Không tìm thấy linh thảo **${tenCay}**!\nDùng \`.tuidо\` để xem Bảo Nang của bạn.`
    );
  }

  const nguoiTang = await layHoacTaoNguoiChoi(message.author.id, message.guildId!);
  const nguoiNhanPlayer = await layHoacTaoNguoiChoi(nguoiNhan.id, message.guildId!);

  const ok = await tangDB(nguoiTang.id, nguoiNhanPlayer.id, cay.id, soLuong);

  if (!ok) {
    const embed = new EmbedBuilder()
      .setColor(MAU_DO)
      .setTitle("❌ Bảo Nang Không Đủ!")
      .setDescription(
        `Bạn không có đủ **${soLuong}x ${cay.emoji} ${cay.ten}** để tặng!\nDùng \`.tuidо\` để kiểm tra Bảo Nang.`
      );
    return message.reply({ embeds: [embed] });
  }

  const embed = new EmbedBuilder()
    .setColor(MAU_CHINH)
    .setTitle("🎁 Linh Thảo Được Trao Tặng!")
    .setDescription(
      `${message.author} đã tặng cho ${nguoiNhan}\n` +
      `**${soLuong}x ${cay.emoji} ${cay.ten}** [${cay.doHiem}]\n\n` +
      `*"Linh khí của tình bạn ấm áp hơn bất kỳ linh thảo nào..."* 💫`
    );

  await message.reply({ embeds: [embed] });
}
