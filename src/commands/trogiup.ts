import { Message, EmbedBuilder } from "discord.js";
import { MAU_CHINH, TEN_TIEN, EMOJI_TIEN, TEN_KN, EMOJI_KN, TEN_DAT } from "../utils/helpers";
import { THUE_CO_BAN } from "../data/pets";

export async function xuLyTroGiup(message: Message, prefix: string) {
  const p = prefix;

  const embed = new EmbedBuilder()
    .setColor(MAU_CHINH)
    .setTitle("🌸 Twilight Garden — Bí Kíp Tu Luyện")
    .setDescription(
      `*"Chào mừng đến với Twilight Garden — vùng đất nơi linh thảo nở hoa dưới ánh hoàng hôn huyền bí..."*\n\n` +
      `**Tiền tệ:** ${TEN_TIEN} ${EMOJI_TIEN} • **Kinh nghiệm:** ${TEN_KN} ${EMOJI_KN} • **Đất:** ${TEN_DAT}\n` +
      `**Prefix:** \`${p}\``
    )
    .addFields(
      {
        name: "🌿 Linh Địa — Vườn Tu Luyện",
        value: [
          `\`${p}vuon\` — Xem Linh Địa và tu vi của bạn`,
          `\`${p}trong <tên linh thảo>\` — Gieo trồng vào Linh Địa`,
          `\`${p}tuoi [số ô]\` — Tưới sương nguyệt (-20% thời gian, thu x2)`,
          `\`${p}thuhoach [số ô]\` — Thu hái linh thảo đã trưởng thành`,
        ].join("\n"),
      },
      {
        name: "🏮 Linh Thảo Các — Mua Bán",
        value: [
          `\`${p}cuahang\` — Xem tất cả linh thảo và giá ${EMOJI_TIEN}`,
          `\`${p}mua <tên> [số]\` — Mua hạt linh thảo`,
          `\`${p}ban <tên> [số]\` — Bán linh thảo (chịu thuế ${THUE_CO_BAN}%)`,
          `\`${p}ban tất\` — Bán toàn bộ Bảo Nang`,
          `💡 Dùng Pet để giảm thuế bán cây!`,
        ].join("\n"),
      },
      {
        name: "🎒 Bảo Nang — Quản Lý",
        value: [
          `\`${p}tuido\` — Xem Bảo Nang (túi đồ)`,
          `\`${p}bangxephang\` — Bảng Anh Hùng top 10`,
          `\`${p}tang @người <tên> [số]\` — Tặng linh thảo`,
        ].join("\n"),
      },
      {
        name: "🌙 Nguyệt Lễ — Hàng Ngày",
        value: [
          `\`${p}diemdanh\` (hoặc \`${p}dd\`) — Nhận ${TEN_TIEN} ${EMOJI_TIEN} mỗi ngày`,
          `🔥 Duy trì chuỗi ngày để nhận thưởng cao hơn!`,
        ].join("\n"),
      },
      {
        name: "⚔️ Bóng Tối — Trộm, Cướp & Phá",
        value: [
          `\`${p}trom @người\` — Trộm linh thảo từ túi đồ (55% thành công, CD 2h)`,
          `\`${p}cuop @người\` — Cướp ${TEN_TIEN} trực tiếp (40% thành công, CD 4h)`,
          `\`${p}pavuon @người\` — Phá 1-2 cây đang trồng trong vườn (60% thành công, CD 6h)`,
          `\`${p}xenlen @người\` — Lén xem vườn người khác (30% bị phát hiện)`,
          `⚠️ Thất bại sẽ bị phạt xu! Cân nhắc trước khi ra tay~`,
        ].join("\n"),
      },
      {
        name: "🐾 Thú Linh — Pet",
        value: [
          `\`${p}pet\` — Xem thú linh đang nuôi`,
          `\`${p}pet danhsach\` — Xem tất cả pet (từ 10,000 ${EMOJI_TIEN})`,
          `\`${p}pet mua <tên>\` — Nhận thú linh về nuôi`,
          `\`${p}pet tha\` — Thả pet (nhận lại 50% giá)`,
          `🐢 **Linh Quy** (10k) — Giảm tỷ lệ bị phá vườn 60%→20% • không giảm thuế`,
          `🦊 **Linh Hồ / Ngọc Thỏ / Thanh Long / Phụng Hoàng** — Giảm thuế bán cây`,
          `⚠️ Chỉ nuôi 1 pet — hiệu ứng **không cộng dồn**!`,
        ].join("\n"),
      },
      {
        name: "⚡ Thiên Cơ — Sự Kiện Ngẫu Nhiên",
        value: [
          "Khi thu hái có thể xuất hiện thiên cơ:",
          `🌕 **Nguyệt Mãn** — Thu thêm 1 linh thảo`,
          `🌱 **Hạt Giống Thiên Số** — Nhận linh thảo miễn phí`,
          `✨ **Phép Màu Twilight** — Bonus ${TEN_TIEN} bất ngờ`,
        ].join("\n"),
      },
      {
        name: "🌦️ Thời Tiết Linh Địa",
        value: [
          `\`${p}thoitiet\` (hoặc \`${p}tt\`) — Xem thời tiết hôm nay + dự báo 4 ngày tới`,
          `☀️ Quang Minh — Giảm 15% thời gian trồng`,
          `🌧️ Linh Vũ — Tự động tưới + +1 sản lượng khi thu hoạch`,
          `🌪️ Cuồng Phong — Tăng sự kiện xấu + giảm 10% giá bán`,
          `🌕 Nguyệt Sắc — Tăng 20% giá bán linh thảo`,
          `⛅ Âm Vân — Ngày bình thường, không buff/debuff`,
        ].join("\n"),
      },
      {
        name: "🏪 Linh Thảo Chợ — Chợ Người Chơi",
        value: [
          `\`${p}cho\` — Xem các linh thảo đang được bán`,
          `\`${p}cho dang <tên> <số lượng> <giá>\` — Đăng bán (phí ${5}%)`,
          `\`${p}cho mua <id>\` — Mua hàng từ người chơi khác`,
          `\`${p}cho huy <id>\` — Huỷ đơn hàng của bạn`,
          `\`${p}cho cuatoi\` — Xem đơn hàng của bạn`,
        ].join("\n"),
      },
      {
        name: "⚗️ Đan Lò — Luyện Đan",
        value: [
          `\`${p}luyendan\` (hoặc \`${p}ld\`) — Xem công thức và nguyên liệu cần có`,
          `\`${p}luyendan <tên đan>\` — Luyện đan (tiêu thụ linh thảo, nhận KN/xu/mở đất)`,
          `💊 **Linh Đan Cơ Sở** — 3 Hoàng Căn + 2 Hỏa Châu → +80 KN`,
          `🟣 **Huyết Tinh Đan** — Linh Chi + Nhật Hoa + Ám Nguyệt → +1200 KN`,
          `🟫 **Linh Địa Bảo** — 3 Nhật Hoa + 2 Ám Nguyệt → Mở thêm 1 ô đất`,
        ].join("\n"),
      },
      {
        name: "📜 Hồ Sơ Tu Sĩ",
        value: [
          `\`${p}profile\` (hoặc \`${p}hs\`) — Xem hồ sơ và thống kê của bạn`,
          `\`${p}profile @người\` — Xem hồ sơ người chơi khác`,
        ].join("\n"),
      },
      {
        name: "⚙️ Quản Trị Server",
        value: [
          `\`${p}setup\` — Xem danh sách kênh được phép dùng bot`,
          `\`${p}setup them #kênh\` — Thêm kênh được phép (cần quyền Quản lý Server)`,
          `\`${p}setup xoa #kênh\` — Xoá kênh khỏi danh sách`,
          `\`${p}setup xoahet\` — Bỏ giới hạn, bot hoạt động mọi kênh`,
          `💡 Khi chưa setup: bot hoạt động ở tất cả kênh!`,
        ].join("\n"),
      },
      {
        name: "📖 Phẩm Cấp Linh Thảo",
        value: "⬜ Phàm Phẩm → 🟦 Linh Phẩm → 🟪 Tiên Phẩm → 🟨 Thần Phẩm",
      }
    )
    .setFooter({ text: "🌸 Twilight Garden — Nơi linh thảo nở hoa dưới ánh hoàng hôn" })
    .setTimestamp();

  await message.reply({ embeds: [embed] });
}
