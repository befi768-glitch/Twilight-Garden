export interface Pet {
  id: string;
  ten: string;
  emoji: string;
  gia: number;              // Giá mua
  giaBanLai: number;        // Giá bán lại (50%)
  giamThue: number;         // Số % thuế được giảm (điểm phần trăm tuyệt đối)
  moTa: string;
  bonusMoTa: string;        // Mô tả bonus ngắn
}

// Thuế cơ bản: 25%
export const THUE_CO_BAN = 25;

export const danhSachPet: Pet[] = [
  {
    id: "linh_ho",
    ten: "Linh Hồ",
    emoji: "🦊",
    gia: 15_000,
    giaBanLai: 7_500,
    giamThue: 4,   // 25% → 21%
    moTa: "Hồ ly tinh linh thoát khỏi cõi âm, mang theo phúc khí buôn bán",
    bonusMoTa: "Giảm thuế 4% (còn 21%)",
  },
  {
    id: "ngoc_tho",
    ten: "Ngọc Thỏ",
    emoji: "🐇",
    gia: 25_000,
    giaBanLai: 12_500,
    giamThue: 7,   // 25% → 18%
    moTa: "Thỏ ngọc từ Quảng Hàn cung, nhảy xuống hạ giới mang theo phước lành",
    bonusMoTa: "Giảm thuế 7% (còn 18%)",
  },
  {
    id: "thanh_long",
    ten: "Thanh Long",
    emoji: "🐉",
    gia: 50_000,
    giaBanLai: 25_000,
    giamThue: 11,  // 25% → 14%
    moTa: "Rồng xanh trấn giữ phương đông, vừa dũng mãnh vừa mang lại tài lộc",
    bonusMoTa: "Giảm thuế 11% (còn 14%)",
  },
  {
    id: "phung_hoang",
    ten: "Phụng Hoàng",
    emoji: "🦅",
    gia: 100_000,
    giaBanLai: 50_000,
    giamThue: 15,  // 25% → 10%
    moTa: "Thần điểu bất tử, tái sinh từ tro tàn, chủ của mọi điều kỳ diệu trong Twilight Garden",
    bonusMoTa: "Giảm thuế 15% (còn 10%)",
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

// Tính thuế thực tế dựa theo pet (giamThue là điểm % tuyệt đối)
export function tinhThue(petId: string | null): number {
  if (!petId) return THUE_CO_BAN;
  const pet = petMap.get(petId);
  if (!pet) return THUE_CO_BAN;
  return Math.max(1, THUE_CO_BAN - pet.giamThue); // Không bao giờ về 0
}
