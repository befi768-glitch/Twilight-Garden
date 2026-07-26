export interface Pet {
  id: string;
  ten: string;
  emoji: string;
  gia: number;              // Giá mua
  giaBanLai: number;        // Giá bán lại (50%)
  giamThue: number;         // % giảm thuế (0–100)
  moTa: string;
  bonusMoTa: string;        // Mô tả bonus ngắn
}

export const danhSachPet: Pet[] = [
  {
    id: "linh_ho",
    ten: "Linh Hồ",
    emoji: "🦊",
    gia: 15_000,
    giaBanLai: 7_500,
    giamThue: 30,   // Giảm 30% thuế (thuế gốc 10% → còn 7%)
    moTa: "Hồ ly tinh linh thoát khỏi cõi âm, mang theo phúc khí buôn bán",
    bonusMoTa: "Giảm 30% thuế bán cây",
  },
  {
    id: "ngoc_tho",
    ten: "Ngọc Thỏ",
    emoji: "🐇",
    gia: 25_000,
    giaBanLai: 12_500,
    giamThue: 50,   // Giảm 50% thuế → còn 5%
    moTa: "Thỏ ngọc từ Quảng Hàn cung, nhảy xuống hạ giới mang theo phước lành",
    bonusMoTa: "Giảm 50% thuế bán cây",
  },
  {
    id: "thanh_long",
    ten: "Thanh Long",
    emoji: "🐉",
    gia: 50_000,
    giaBanLai: 25_000,
    giamThue: 80,   // Giảm 80% thuế → còn 2%
    moTa: "Rồng xanh trấn giữ phương đông, vừa dũng mãnh vừa mang lại tài lộc",
    bonusMoTa: "Giảm 80% thuế bán cây",
  },
  {
    id: "phung_hoang",
    ten: "Phụng Hoàng",
    emoji: "🦅",
    gia: 100_000,
    giaBanLai: 50_000,
    giamThue: 100,  // Miễn hoàn toàn
    moTa: "Thần điểu bất tử, tái sinh từ tro tàn, chủ của mọi điều kỳ diệu trong Twilight Garden",
    bonusMoTa: "Miễn hoàn toàn thuế bán cây",
  },
];

export const petMap = new Map(danhSachPet.map((p) => [p.id, p]));

export function timPetTheoTen(query: string): Pet | undefined {
  const q = query.toLowerCase().trim();
  return danhSachPet.find(
    (p) =>
      p.ten.toLowerCase() === q ||
      p.id === q ||
      p.ten.toLowerCase().includes(q) ||
      p.id.includes(q.replace(/\s/g, "_"))
  );
}

// Thuế cơ bản: 10%
export const THUE_CO_BAN = 10;

export function tinhThue(petId: string | null): number {
  if (!petId) return THUE_CO_BAN;
  const pet = petMap.get(petId);
  if (!pet) return THUE_CO_BAN;
  const giamPhanTram = pet.giamThue / 100;
  return Math.round(THUE_CO_BAN * (1 - giamPhanTram));
}
