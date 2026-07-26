import { Message } from "discord.js";
import { EmbedBuilder } from "discord.js";
import { COLORS } from "../utils/embed";

export async function handleHelp(msg: Message) {
  const embed = new EmbedBuilder()
    .setColor(COLORS.garden)
    .setTitle("🌱 Twilight Garden Bot — Hướng Dẫn")
    .addFields(
      {
        name: "🌿 Vườn Cây",
        value: [
          "`.garden` — Xem vườn của bạn",
          "`.plant <cây> <ô>` — Trồng cây (vd: `.plant carrot 1`)",
          "`.water <ô>` — Tưới nước",
          "`.harvest <ô>` — Thu hoạch",
        ].join("\n"),
        inline: false,
      },
      {
        name: "🏪 Mua Bán",
        value: [
          "`.shop` — Xem cửa hàng",
          "`.shop pet` — Xem thú cưng bán",
          "`.buy <id> [số]` — Mua vật phẩm",
          "`.sell <id> [số]` — Bán vật phẩm",
        ].join("\n"),
        inline: false,
      },
      {
        name: "⚔️ PvP & Phòng Thủ",
        value: [
          "`.raid @người` — Đột kích vườn người khác",
          "`.revenge @người` — Báo thù (sau khi bị raid)",
          "`.defense` — Xem phòng thủ",
          "`.defense add <loại>` — Đặt phòng thủ (fence/scarecrow/trap)",
        ].join("\n"),
        inline: false,
      },
      {
        name: "🗺️ Thám Hiểm & Nhiệm Vụ",
        value: [
          "`.explore` — Thám hiểm (cooldown 30 phút)",
          "`.quest` — Xem nhiệm vụ hằng ngày",
          "`.quest claim <id>` — Nhận thưởng quest",
        ].join("\n"),
        inline: false,
      },
      {
        name: "🐾 Thú Cưng",
        value: [
          "`.pet` — Xem thú cưng",
          "`.pet feed <loại>` — Cho ăn",
          "`.pet rename <loại> <tên>` — Đổi tên",
        ].join("\n"),
        inline: false,
      },
      {
        name: "🏰 Hội & Chợ",
        value: [
          "`.guild` — Xem thông tin hội",
          "`.guild create <tên>` — Tạo hội",
          "`.guild join <id>` — Gia nhập hội",
          "`.guild donate <tiền>` — Đóng góp",
          "`.market` — Chợ đen & đấu giá",
          "`.auction sell/bid` — Đấu giá",
        ].join("\n"),
        inline: false,
      },
      {
        name: "📊 Khác",
        value: [
          "`.weather` — Thời tiết hôm nay",
          "`.profile [@người]` — Hồ sơ người chơi",
          "`.inventory` — Kho đồ",
          "`.top` — Bảng xếp hạng",
        ].join("\n"),
        inline: false,
      },
    )
    .setFooter({ text: "Twilight Garden 🌸 | Prefix: ." })
    .setTimestamp();

  return msg.reply({ embeds: [embed] });
}
