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
// Dùng export let để emojiManager có thể cập nhật live khi bot ready
export let EMOJI_TIEN = "💠";
export function setEmojiTien(emoji: string) {
  EMOJI_TIEN = emoji;
}

export function formatXu(so: number): string {
  return `${so.toLocaleString("vi-VN")} ${EMOJI_TIEN}`;
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
