// Format thời gian còn lại
export function formatThoiGian(ms: number): string {
  if (ms <= 0) return "Sẵn sàng thu hoạch!";
  const giay = Math.floor(ms / 1000);
  const phut = Math.floor(giay / 60);
  const gio = Math.floor(phut / 60);
  if (gio > 0) return `${gio}g ${phut % 60}p`;
  if (phut > 0) return `${phut}p ${giay % 60}s`;
  return `${giay}s`;
}

// Đơn vị tiền tệ: Nguyệt Thạch
export const TEN_TIEN = "Nguyệt Thạch";
// Emoji tiền được lưu theo từng server để không dùng nhầm ID emoji của server khác.
export const EMOJI_TIEN = "💠";
const emojiTienTheoGuild = new Map<string, string>();

export function setEmojiTien(guildId: string, emoji: string) {
  // Chỉ lưu emoji đã được xác nhận thuộc đúng guild; không thay đổi fallback
  // dùng chung để tránh làm lộ raw markup `<:name:id>` ở server khác.
  if (emoji.startsWith("<:") && emoji.endsWith(">")) {
    emojiTienTheoGuild.set(guildId, emoji);
  }
}

export function layEmojiTien(guildId: string | null | undefined): string {
  return emojiTienTheoGuild.get(guildId ?? "") || EMOJI_TIEN;
}

export function formatXu(so: number, guildId?: string | null): string {
  return `${so.toLocaleString("vi-VN")} ${layEmojiTien(guildId)}`;
}

// Đơn vị linh lực (kinh nghiệm)
export const TEN_KN = "Linh Lực";
export const EMOJI_KN = "✨";

// Đơn vị đất: Linh Địa
export const TEN_DAT = "Linh Địa";

// Thanh tiến trình
export function thanhTienTrinh(phanTram: number, do_dai: number = 10): string {
  const day = Math.floor((phanTram / 100) * do_dai);
  return "█".repeat(day) + "░".repeat(do_dai - day);
}

// Màu chủ đề
export const MAU_CHINH = 0x7b68ee; // Tím huyền bí — Medium Slate Blue
export const MAU_VANG  = 0xffd700; // Vàng thần thánh
export const MAU_DO    = 0xe74c3c;
export const MAU_XAM   = 0x95a5a6;
export const MAU_XANH  = 0x2ecc71;
