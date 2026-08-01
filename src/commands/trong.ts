import { Message, EmbedBuilder } from "discord.js";
import { layHoacTaoNguoiChoi, layVuon, trong as trongDB, layTuiDo, ban as banDB } from "../database/queries";
import { timCayTheoTenHoacHat, mauDoHiem, layHatGiongId, layAnhCay } from "../data/plants";
import { MAU_DO, MAU_CHINH } from "../utils/helpers";
import { layLoiThoaiNgauNhien } from "../utils/events";
import { layThoiTietHomNay } from "../utils/weather";

export async function xuLyTrong(message: Message, args: string[]) {
  if (!args.length) {
    const embed = new EmbedBuilder()
      .setColor(MAU_CHINH)
      .setTitle("🌱 Gieo Hạt Vào Linh Địa")
      .setDescription(
        "*Nàng Tiên khẽ nghiêng đầu hỏi: \"Ngươi muốn gieo loại linh thảo nào hôm nay~?\"*\n\n" +
        "Dùng `.trong <tên cây>` để gieo hạt — VD: `.trong hoàng căn`\n" +
        "Hoặc `.cuahang` để xem danh sách linh thảo."
      );
    return message.reply({ embeds: [embed] });
  }

  const tenCay = args.join(" ");
  const cay = timCayTheoTenHoacHat(tenCay);

  if (!cay) {
    const embed = new EmbedBuilder()
      .setColor(MAU_DO)
      .setTitle("🍃 Linh Thảo Chưa Được Ghi Chép")
      .setDescription(
        `*Nàng Tiên lật qua từng trang thư tịch cổ... nhưng không thấy tên \"**${tenCay}**\" ở đâu.*\n\n` +
        `Dùng \`.cuahang\` để xem danh sách linh thảo hiện có tại Linh Thảo Các.`
      );
    return message.reply({ embeds: [embed] });
  }

  const player = await layHoacTaoNguoiChoi(message.author.id, message.guildId!);
  const vuon = await layVuon(player.id);

  const oTrong = vuon.find((o) => !o.tenCay);
  if (!oTrong) {
    const embed = new EmbedBuilder()
      .setColor(MAU_DO)
      .setTitle("🌿 Vườn đã đầy!")
      .setDescription("*Nàng tiên vườn lắc đầu buồn bã...*\n\nKhông còn ô đất trống! Hãy thu hoạch cây đã chín trước, hoặc lên cấp để mở thêm ô đất.");
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
      )
      .setThumbnail(`attachment://${cay.id}.png`);
    return message.reply({
      files: [{ attachment: layAnhCay(cay.id), name: `${cay.id}.png` }],
      embeds: [embed],
    });
  }

  // Tính thời gian mọc có xét thời tiết
  const thoiTiet = layThoiTietHomNay(message.guildId!);
  let thoiGianMocThucTe = cay.thoiGianMoc;
  let thoiTietNote = "";

  if (thoiTiet.giamThoiGianTrong > 0) {
    thoiGianMocThucTe = Math.max(1, Math.round(cay.thoiGianMoc * (1 - thoiTiet.giamThoiGianTrong / 100)));
    thoiTietNote = `\n${thoiTiet.emoji} **${thoiTiet.ten}**: Giảm ${thoiTiet.giamThoiGianTrong}% thời gian!`;
  } else if (thoiTiet.giamThoiGianTrong < 0) {
    // Giá trị âm = tăng thời gian (debuff)
    const phanTramTang = Math.abs(thoiTiet.giamThoiGianTrong);
    thoiGianMocThucTe = Math.round(cay.thoiGianMoc * (1 + phanTramTang / 100));
    thoiTietNote = `\n${thoiTiet.emoji} **${thoiTiet.ten}**: Tăng ${phanTramTang}% thời gian sinh trưởng!`;
  }

  // Tiêu thụ 1 hạt giống từ túi đồ
  await banDB(player.id, hatGiongId, 1);
  await trongDB(player.id, oTrong.viTri, cay.id, thoiGianMocThucTe);

  // Tự động tưới nếu thời tiết Linh Vũ
  if (thoiTiet.tuTuoiKhiTrong) {
    const { tuoi } = await import("../database/queries");
    await tuoi(player.id, oTrong.viTri);
    thoiTietNote = `\n${thoiTiet.emoji} **${thoiTiet.ten}**: Cây đã được tự động tưới!`;
  }

  const chinLuc = new Date(Date.now() + thoiGianMocThucTe * 60 * 1000);
  const gioChin = `<t:${Math.floor(chinLuc.getTime() / 1000)}:R>`;
  const loiThoai = layLoiThoaiNgauNhien("trong");

  const embed = new EmbedBuilder()
    .setColor(mauDoHiem[cay.doHiem] ?? MAU_CHINH)
    .setTitle(`Đã gieo trồng ${cay.ten}!`)
    .setDescription(`${loiThoai}\n\n**Hạt ${cay.ten}** đã được gieo xuống **Ô ${oTrong.viTri}**${thoiTietNote}`)
    .setThumbnail(`attachment://${cay.id}.png`)
    .addFields(
      { name: "⏰ Thu hoạch", value: gioChin, inline: true },
      { name: "📦 Hạt còn lại", value: `${hatTrongTui.soLuong - 1} hạt`, inline: true },
      { name: "💰 Bán được", value: `${cay.giaBan} xu / cái`, inline: true }
    )
    .setFooter({ text: "💧 Tưới nước để giảm 5~10% thời gian!" });

  await message.reply({
    files: [{ attachment: layAnhCay(cay.id), name: `${cay.id}.png` }],
    embeds: [embed],
  });
}
