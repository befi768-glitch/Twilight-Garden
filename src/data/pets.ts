export interface Pet {
  id: string;
  ten: string;
  emoji: string;
  gia: number;
  giaBanLai: number;
  giamThue: number;         // % thuế bán cây giảm
  chongPhaVuon: boolean;    // chặn .pavuon
  bonusThamHiem: number;    // % tăng loot từ thám hiểm (xu/vật phẩm)
  bonusBossDamage: number;  // % tăng sát thương đánh boss
  moTa: string;
  bonusMoTa: string;
}

export const THUE_CO_BAN = 25;

export const danhSachPet: Pet[] = [
  {
    id: "linh_quy",
    ten: "Linh Quy",
    emoji: "🐢",
    gia: 10_000,
    giaBanLai: 5_000,
    giamThue: 0,
    chongPhaVuon: true,
    bonusThamHiem: 10,
    bonusBossDamage: 0,
    moTa: "Thần Rùa ngàn tuổi, mai cứng như thép, trấn giữ linh địa khỏi kẻ phá hoại",
    bonusMoTa: "🛡️ Giảm tỷ lệ bị phá vườn 60%→20% • 🗺️ +10% loot thám hiểm",
  },
  {
    id: "linh_ho",
    ten: "Linh Hồ",
    emoji: "🦊",
    gia: 15_000,
    giaBanLai: 7_500,
    giamThue: 1,
    chongPhaVuon: false,
    bonusThamHiem: 30,
    bonusBossDamage: 5,
    moTa: "Hồ ly tinh linh thoát khỏi cõi âm, mang theo phúc khí buôn bán và bản năng sục sạo",
    bonusMoTa: "💰 Giảm thuế 1% (còn 24%) • 🗺️ +30% loot thám hiểm • ⚔️ +5% sát thương boss",
  },
  {
    id: "ngoc_tho",
    ten: "Ngọc Thỏ",
    emoji: "🐇",
    gia: 25_000,
    giaBanLai: 12_500,
    giamThue: 2,
    chongPhaVuon: false,
    bonusThamHiem: 20,
    bonusBossDamage: 10,
    moTa: "Thỏ ngọc từ Quảng Hàn cung, nhảy xuống hạ giới mang theo phước lành và đôi tai thính nhạy",
    bonusMoTa: "💰 Giảm thuế 2% (còn 23%) • 🗺️ +20% loot thám hiểm • ⚔️ +10% sát thương boss",
  },
  {
    id: "thanh_long",
    ten: "Thanh Long",
    emoji: "🐉",
    gia: 50_000,
    giaBanLai: 25_000,
    giamThue: 3,
    chongPhaVuon: false,
    bonusThamHiem: 15,
    bonusBossDamage: 25,
    moTa: "Rồng xanh trấn giữ phương đông, vừa dũng mãnh vừa mang lại tài lộc và uy lực chiến đấu",
    bonusMoTa: "💰 Giảm thuế 3% (còn 22%) • 🗺️ +15% loot thám hiểm • ⚔️ +25% sát thương boss",
  },
  {
    id: "phung_hoang",
    ten: "Phụng Hoàng",
    emoji: "🦅",
    gia: 100_000,
    giaBanLai: 50_000,
    giamThue: 4,
    chongPhaVuon: false,
    bonusThamHiem: 40,
    bonusBossDamage: 35,
    moTa: "Thần điểu bất tử, tái sinh từ tro tàn — chủ của mọi điều kỳ diệu, bá chủ cả thám hiểm lẫn chiến trường",
    bonusMoTa: "💰 Giảm thuế 4% (còn 21%) • 🗺️ +40% loot thám hiểm • ⚔️ +35% sát thương boss",
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

export function tinhThue(petId: string | null): number {
  if (!petId) return THUE_CO_BAN;
  const pet = petMap.get(petId);
  if (!pet) return THUE_CO_BAN;
  return Math.max(1, THUE_CO_BAN - pet.giamThue);
}

export function coChongPhaVuon(petId: string | null): boolean {
  if (!petId) return false;
  return petMap.get(petId)?.chongPhaVuon ?? false;
}

export function layBonusThamHiem(petId: string | null): number {
  if (!petId) return 0;
  return petMap.get(petId)?.bonusThamHiem ?? 0;
}

export function layBonusBossDamage(petId: string | null): number {
  if (!petId) return 0;
  return petMap.get(petId)?.bonusBossDamage ?? 0;
}
