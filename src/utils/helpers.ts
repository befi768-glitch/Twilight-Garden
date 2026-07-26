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

// Format xu có dấu phẩy
export function formatXu(so: number): string {
  return so.toLocaleString("vi-VN") + " 🪙";
}

// Thanh tiến trình
export function thanhTienTrinh(phanTram: number, do_dai: number = 10): string {
  const day = Math.floor((phanTram / 100) * do_dai);
  return "█".repeat(day) + "░".repeat(do_dai - day);
}

// Màu embed chủ đề vườn
export const MAU_CHINH = 0x2ecc71;
export const MAU_VANG = 0xf1c40f;
export const MAU_DO = 0xe74c3c;
export const MAU_XAM = 0x95a5a6;
