import { Message, EmbedBuilder, GuildMember } from "discord.js";
import { layHoacTaoNguoiChoi } from "../database/queries";
import { db } from "../database/db";
import { layThongTinCap, layCapTiepTheo } from "../data/plants";
import { petMap } from "../data/pets";
import { formatXu, formatThoiGian, thanhTienTrinh, MAU_CHINH, MAU_VANG, TEN_KN, EMOJI_KN, EMOJI_TIEN } from "../utils/helpers";

export async function xuLyProfile(message: Message, args: string[]) {
  // Xác định target — mention người khác hoặc tự xem
  const mucTieu = message.mentions.users.first() ?? message.author;
  const guildId = message.guildId!;

  const player = await layHoacTaoNguoiChoi(mucTieu.id, guildId);
  const thongTinCap = layThongTinCap(player.capDo);
  const capTiep = layCapTiepTheo(player.capDo);

  // Lấy thêm thông tin: pet, streak, tổng thu hoạch, số đơn trên chợ
  const extra = await db.execute<{
    pet_id: string | null;
    streak: number;
    last_check_in: string | null;
    tong_thu_hoach: number;
    tong_ban_buon: number;
  }>(
    `SELECT pet_id, COALESCE(streak,0) as streak, last_check_in,
            COALESCE(tong_thu_hoach,0) as tong_thu_hoach,
            COALESCE(tong_ban_buon,0) as tong_ban_buon
     FROM nguoi_choi WHERE id = ${player.id}`
  );
  const info = extra.rows[0];

  // Đếm số đơn đang bán trên chợ
  const choRows = await db.execute<{ cnt: string }>(
    `SELECT COUNT(*) as cnt FROM cho_buon WHERE nguoi_ban_id = ${player.id}`
  );
  const soChoHienTai = parseInt(choRows.rows[0]?.cnt ?? "0");

  // Tính bar kinh nghiệm
  let kinhNghiemBar = "";
  if (capTiep) {
    const phanTramKN = Math.round(
      ((player.kinhNghiem - thongTinCap.kinhNghiemCanThiet) /
        (capTiep.kinhNghiemCanThiet - thongTinCap.kinhNghiemCanThiet)) * 100
    );
    kinhNghiemBar = `\`${thanhTienTrinh(phanTramKN, 14)}\`\n${player.kinhNghiem.toLocaleString("vi-VN")} / ${capTiep.kinhNghiemCanThiet.toLocaleString("vi-VN")} ${EMOJI_KN}`;
  } else {
    kinhNghiemBar = `⚡ **Đã đạt đỉnh cao tu luyện!**\n${player.kinhNghiem.toLocaleString("vi-VN")} ${EMOJI_KN}`;
  }

  // Thông tin pet
  const petHienTai = info?.pet_id ? petMap.get(info.pet_id) : null;
  const petText = petHienTai
    ? `${petHienTai.emoji} **${petHienTai.ten}**\n*${petHienTai.bonusMoTa}*`
    : "🐾 *Chưa có thú linh*\n*(Dùng .pet mua để nhận)*";

  // Streak và điểm danh
  const streakHienTai = info?.streak ?? 0;
  const streakText = streakHienTai >= 7
    ? `🔥 **${streakHienTai} ngày** (Chuỗi xuất sắc!)`
    : streakHienTai >= 1
    ? `🌱 **${streakHienTai} ngày**`
    : "❄️ *Chưa điểm danh*";

  // Xác định màu theo cấp độ
  const mauTheoCapDo: number[] = [0x95a5a6, 0x3498db, 0x2ecc71, 0x1abc9c, 0xe67e22, 0x9b59b6, 0xe74c3c, 0xffd700];
  const mauEmbed = mauTheoCapDo[Math.min(player.capDo - 1, mauTheoCapDo.length - 1)];

  // Lấy avatar của thành viên nếu có
  let avatarUrl: string | null = null;
  try {
    const member = await message.guild?.members.fetch(mucTieu.id);
    avatarUrl = member?.displayAvatarURL({ size: 128 }) ?? mucTieu.displayAvatarURL({ size: 128 });
  } catch {
    avatarUrl = mucTieu.displayAvatarURL({ size: 128 });
  }

  const laNguoiChoi = mucTieu.id === message.author.id;
  const tieuDe = laNguoiChoi
    ? `📜 Hồ Sơ Tu Sĩ — ${mucTieu.displayName}`
    : `📜 Hồ Sơ — ${mucTieu.displayName}`;

  const embed = new EmbedBuilder()
    .setColor(mauEmbed)
    .setTitle(tieuDe)
    .setThumbnail(avatarUrl)
    .addFields(
      {
        name: "🧘 Tu Vi & Cấp Độ",
        value: `**Cấp ${player.capDo}** — *${thongTinCap.tenCap}*\n${kinhNghiemBar}`,
        inline: false,
      },
      {
        name: `${EMOJI_TIEN} Nguyệt Thạch`,
        value: formatXu(player.xu),
        inline: true,
      },
      {
        name: "🌿 Ô Đất",
        value: `${player.soODat} ô`,
        inline: true,
      },
      {
        name: "🔥 Điểm Danh",
        value: streakText,
        inline: true,
      },
      {
        name: "🐾 Thú Linh",
        value: petText,
        inline: false,
      },
      {
        name: "📊 Thống Kê",
        value: [
          `🧺 Tổng thu hoạch: **${(info?.tong_thu_hoach ?? 0).toLocaleString("vi-VN")} lần**`,
          `🏪 Đơn hàng trên chợ: **${soChoHienTai}**`,
        ].join("\n"),
        inline: false,
      }
    )
    .setFooter({ text: "🌸 Twilight Garden — Tu Tiên Vườn Huyền Bí" })
    .setTimestamp();

  await message.reply({ embeds: [embed] });
}
