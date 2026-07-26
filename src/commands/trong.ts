import { Message, EmbedBuilder } from "discord.js";
import { layHoacTaoNguoiChoi, layVuon, trong as trongDB, layTuiDo, ban as banDB } from "../database/queries";
import { timCayTheoTenHoacHat, mauDoHiem, layHatGiongId } from "../data/plants";
import { MAU_DO, MAU_CHINH } from "../utils/helpers";
import { layLoiThoaiNgauNhien } from "../utils/events";

export async function xuLyTrong(message: Message, args: string[]) {
  if (!args.length) {
    return message.reply("❌ Bạn muốn trồng cây gì? Dùng `.trong <tên cây>` — VD: `.trong hoàng căn`");
  }

  const tenCay = args.join(" ");
  const cay = timCayTheoTenHoacHat(tenCay);

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

  // Kiểm tra hạt giống trong túi đồ
  const hatGiongId = layHatGiongId(cay.id);
  const tuiDo = await layTuiDo(player.id);
  const hatTrongTui = tuiDo.find((item) => item.tenCay === hatGiongId);

  if (!hatTrongTui || hatTrongTui.soLuong < 1) {
    const embed = new EmbedBuilder()
      .setColor(MAU_DO)
      .setTitle("🌱 Không Có Hạt Giống!")
      .setDescription(
        `*"Linh Địa cần hạt giống để gieo trồng..."*\n\n` +
        `Bạn không có **Hạt ${cay.ten}** trong Bảo Nang!\n` +
        `Dùng \`.mua ${cay.ten}\` để mua hạt giống tại Linh Thảo Các trước.`
      );
    return message.reply({ embeds: [embed] });
  }

  // Tiêu thụ 1 hạt giống từ túi đồ
  await banDB(player.id, hatGiongId, 1);
  await trongDB(player.id, oTrong.viTri, cay.id, cay.thoiGianMoc);

  const chinLuc = new Date(Date.now() + cay.thoiGianMoc * 60 * 1000);
  const gioChin = `<t:${Math.floor(chinLuc.getTime() / 1000)}:R>`;
  const loiThoai = layLoiThoaiNgauNhien("trong");

  const embed = new EmbedBuilder()
    .setColor(mauDoHiem[cay.doHiem] ?? MAU_CHINH)
    .setTitle(`${cay.emoji} Đã trồng ${cay.ten}!`)
    .setDescription(`${loiThoai}\n\n🌱 **Hạt ${cay.ten}** đã được gieo xuống **Ô ${oTrong.viTri}** 🌱`)
    .addFields(
      { name: "⏰ Thu hoạch", value: gioChin, inline: true },
      { name: "📦 Hạt còn lại", value: `${hatTrongTui.soLuong - 1} hạt`, inline: true },
      { name: "💰 Bán được", value: `${cay.giaBan} xu / cái`, inline: true }
    )
    .setFooter({ text: "💧 Tưới nước để giảm 20% thời gian và thu hoạch x2!" });

  await message.reply({ embeds: [embed] });
}
