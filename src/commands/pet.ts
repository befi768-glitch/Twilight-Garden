import { Message, EmbedBuilder } from "discord.js";
import { layHoacTaoNguoiChoi, truXu, congXuVaKinhNghiem } from "../database/queries";
import { db } from "../database/db";
import { nguoiChoi } from "../database/schema";
import { eq } from "drizzle-orm";
import { MAU_CHINH, MAU_DO, MAU_VANG, MAU_XANH, MAU_XAM, formatXu } from "../utils/helpers";
import { danhSachPet, petMap, timPetTheoTen, tinhThue, THUE_CO_BAN, coChongPhaVuon } from "../data/pets";

async function layPetHienTai(playerId: number): Promise<string | null> {
  const row = await db.execute<{ pet_id: string | null }>(
    `SELECT pet_id FROM nguoi_choi WHERE id = ${playerId}`
  );
  return row.rows[0]?.pet_id ?? null;
}

export async function xuLyPet(message: Message, args: string[]) {
  const player = await layHoacTaoNguoiChoi(message.author.id, message.guildId!);
  const sub = args[0]?.toLowerCase();

  // .pet — xem pet hiện tại
  if (!sub || sub === "xem") {
    const petId = await layPetHienTai(player.id);

    if (!petId) {
      const embed = new EmbedBuilder()
        .setColor(MAU_XAM)
        .setTitle("🐾 Thú Cưng — Bạn Chưa Có Pet")
        .setDescription(
          `*Khu vườn vắng lặng... chưa có thú linh nào ở bên bạn.*\n\n` +
          `Dùng \`.pet mua <tên>\` để nhận một người bạn đồng hành!\n` +
          `Dùng \`.pet danhsach\` để xem tất cả pet khả dụng.\n\n` +
          `💡 Thuế bán cây hiện tại: **${THUE_CO_BAN}%**`
        );
      return message.reply({ embeds: [embed] });
    }

    const pet = petMap.get(petId)!;
    const thue = tinhThue(petId);
    const truongHopThueSurf = pet.giamThue > 0
      ? `${thue}% (giảm từ ${THUE_CO_BAN}%)`
      : `${THUE_CO_BAN}% (không giảm)`;
    const embed = new EmbedBuilder()
      .setColor(MAU_CHINH)
      .setTitle(`${pet.emoji} Thú Linh — ${pet.ten}`)
      .setDescription(`*${pet.moTa}*`)
      .addFields(
        { name: "✨ Phúc Lợi", value: pet.bonusMoTa, inline: true },
        { name: "💰 Thuế Bán Cây", value: truongHopThueSurf, inline: true },
        { name: "💠 Giá Bán Lại", value: formatXu(pet.giaBanLai), inline: true }
      )
      .setFooter({ text: `Dùng .pet tha để thả pet (nhận lại ${formatXu(pet.giaBanLai)})` });
    return message.reply({ embeds: [embed] });
  }

  // .pet danhsach — xem tất cả pet
  if (sub === "danhsach" || sub === "ds" || sub === "list") {
    const petId = await layPetHienTai(player.id);
    const playerInfo = await db.select().from(nguoiChoi).where(eq(nguoiChoi.id, player.id)).limit(1);
    const xuHienTai = playerInfo[0]?.xu ?? 0;

    const danhSach = danhSachPet.map((p) => {
      const dangSo = petId === p.id ? " ✅ **(Đang nuôi)**" : "";
      const duXu = xuHienTai >= p.gia ? "✔️" : "❌";
      return `${p.emoji} **${p.ten}**${dangSo}\n  ${duXu} Giá: ${formatXu(p.gia)} • ${p.bonusMoTa}`;
    });

    const embed = new EmbedBuilder()
      .setColor(MAU_VANG)
      .setTitle("🐾 Danh Sách Thú Linh")
      .setDescription(
        `*Những linh thú đang chờ tìm chủ nhân...*\n\n` +
        danhSach.join("\n\n") +
        `\n\n💠 Số dư của bạn: **${formatXu(xuHienTai)}**`
      )
      .addFields({
        name: "⚠️ Lưu Ý",
        value: "Chỉ nuôi được **1 pet** tại một thời điểm — hiệu ứng **không cộng dồn**.\nPet giảm thuế và pet chống phá vườn là hai lựa chọn riêng biệt.",
      })
      .setFooter({ text: "Dùng .pet mua <tên> để nhận thú linh về nuôi" });
    return message.reply({ embeds: [embed] });
  }

  // .pet mua <tên>
  if (sub === "mua") {
    const tenArgs = args.slice(1).join(" ");
    if (!tenArgs) {
      return message.reply("❌ Dùng: `.pet mua <tên pet>` — Ví dụ: `.pet mua linh hồ`");
    }

    const pet = timPetTheoTen(tenArgs);
    if (!pet) {
      return message.reply(`❌ Không tìm thấy pet **${tenArgs}**! Dùng \`.pet danhsach\` để xem danh sách.`);
    }

    const petHienTai = await layPetHienTai(player.id);
    if (petHienTai === pet.id) {
      return message.reply(`❌ Bạn đã đang nuôi **${pet.ten}** rồi!`);
    }

    if (petHienTai) {
      const petCu = petMap.get(petHienTai);
      return message.reply(
        `❌ Bạn đang nuôi **${petCu?.ten ?? petHienTai}** rồi!\n` +
        `Dùng \`.pet tha\` để thả pet hiện tại trước (nhận lại ${formatXu(petCu?.giaBanLai ?? 0)}).`
      );
    }

    const playerInfo = await db.select().from(nguoiChoi).where(eq(nguoiChoi.id, player.id)).limit(1);
    const xuHienTai = playerInfo[0]?.xu ?? 0;

    if (xuHienTai < pet.gia) {
      const embed = new EmbedBuilder()
        .setColor(MAU_DO)
        .setTitle("❌ Không Đủ Nguyệt Thạch!")
        .setDescription(
          `${pet.emoji} **${pet.ten}** có giá ${formatXu(pet.gia)}\n` +
          `Bạn chỉ có: ${formatXu(xuHienTai)}\n` +
          `Còn thiếu: ${formatXu(pet.gia - xuHienTai)}`
        );
      return message.reply({ embeds: [embed] });
    }

    const ok = await truXu(player.id, pet.gia);
    if (!ok) return message.reply("❌ Có lỗi khi trừ xu. Thử lại!");

    await db.execute(`UPDATE nguoi_choi SET pet_id = '${pet.id}' WHERE id = ${player.id}`);

    const thue = tinhThue(pet.id);
    const embed = new EmbedBuilder()
      .setColor(MAU_VANG)
      .setTitle(`🎉 Đã Nhận Thú Linh — ${pet.emoji} ${pet.ten}!`)
      .setDescription(
        `*${pet.moTa}*\n\n` +
        `${pet.emoji} **${pet.ten}** đã về làm người bạn đồng hành của bạn!`
      )
      .addFields(
        { name: "✨ Phúc Lợi", value: pet.bonusMoTa, inline: true },
        {
          name: "💰 Thuế Bán Cây",
          value: pet.giamThue > 0 ? `${thue}% (giảm từ ${THUE_CO_BAN}%)` : `${THUE_CO_BAN}% (không giảm)`,
          inline: true,
        }
      )
      .setFooter({ text: `Đã trừ ${formatXu(pet.gia)} • Bán lại: ${formatXu(pet.giaBanLai)}` });
    return message.reply({ embeds: [embed] });
  }

  // .pet tha — thả pet, nhận lại tiền
  if (sub === "tha" || sub === "thả") {
    const petId = await layPetHienTai(player.id);
    if (!petId) {
      return message.reply("❌ Bạn chưa có pet nào để thả!");
    }

    const pet = petMap.get(petId)!;
    await db.execute(`UPDATE nguoi_choi SET pet_id = NULL WHERE id = ${player.id}`);
    await congXuVaKinhNghiem(player.id, pet.giaBanLai, 0);

    const embed = new EmbedBuilder()
      .setColor(MAU_XANH)
      .setTitle(`🕊️ Đã Thả ${pet.emoji} ${pet.ten}`)
      .setDescription(
        `*${pet.ten} nhẹ nhàng bay đi, để lại chút linh khí trong lòng bạn...*\n\n` +
        `Bạn nhận lại: ${formatXu(pet.giaBanLai)}\n\n` +
        `💡 Thuế bán cây trở về ${THUE_CO_BAN}%`
      )
      .setFooter({ text: "Dùng .pet mua <tên> để nhận thú linh mới" });
    return message.reply({ embeds: [embed] });
  }

  // Lệnh không hợp lệ
  return message.reply(
    "❌ Lệnh pet không hợp lệ!\n" +
    "• `.pet` — Xem thú linh hiện tại\n" +
    "• `.pet danhsach` — Xem tất cả pet\n" +
    "• `.pet mua <tên>` — Mua pet\n" +
    "• `.pet tha` — Thả pet (nhận lại 50% giá)"
  );
}
