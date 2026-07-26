export interface Cay {
  id: string;
  ten: string;
  emoji: string;
  giaMua: number;
  giaBan: number;
  thoiGianMoc: number;
  doHiem: "Phàm Phẩm" | "Linh Phẩm" | "Tiên Phẩm" | "Thần Phẩm";
  moTa: string;
  kinhNghiem: number;
}

export const danhSachCay: Cay[] = [
  {
    id: "hoang_can",
    ten: "Hoàng Căn",
    emoji: "🥕",
    giaMua: 10,
    giaBan: 15,
    thoiGianMoc: 5,
    doHiem: "Phàm Phẩm",
    moTa: "Linh căn vàng óng ẩn dưới lòng đất, hấp thu địa khí thuần túy",
    kinhNghiem: 3,
  },
  {
    id: "hoa_chau",
    ten: "Hỏa Châu",
    emoji: "🍅",
    giaMua: 80,
    giaBan: 120,
    thoiGianMoc: 10,
    doHiem: "Phàm Phẩm",
    moTa: "Quả chứa ngọn lửa âm ỉ, đỏ rực như máu rồng",
    kinhNghiem: 5,
  },
  {
    id: "kim_tue",
    ten: "Kim Tuệ",
    emoji: "🌽",
    giaMua: 150,
    giaBan: 225,
    thoiGianMoc: 15,
    doHiem: "Phàm Phẩm",
    moTa: "Hạt vàng lấp lánh tựa kim tinh, ngưng tụ ánh dương thiên niên",
    kinhNghiem: 7,
  },
  {
    id: "huyet_mai",
    ten: "Huyết Mai",
    emoji: "🍓",
    giaMua: 350,
    giaBan: 525,
    thoiGianMoc: 30,
    doHiem: "Linh Phẩm",
    moTa: "Quả mọng đỏ thẫm hấp thu nguyệt hoa, chứa đựng linh khí tinh thuần",
    kinhNghiem: 13,
  },
  {
    id: "linh_chi",
    ten: "Linh Chi Cổ",
    emoji: "🍄",
    giaMua: 600,
    giaBan: 900,
    thoiGianMoc: 45,
    doHiem: "Linh Phẩm",
    moTa: "Loài nấm trăm năm mọc nơi rừng thiêng, thấm đẫm linh khí đại địa",
    kinhNghiem: 22,
  },
  {
    id: "nhat_hoa",
    ten: "Nhật Thần Hoa",
    emoji: "🌻",
    giaMua: 900,
    giaBan: 1350,
    thoiGianMoc: 60,
    doHiem: "Linh Phẩm",
    moTa: "Loài hoa hướng về thái dương, tích lũy dương khí suốt nghìn thu",
    kinhNghiem: 28,
  },
  {
    id: "am_linh_chi",
    ten: "Ám Nguyệt Nấm",
    emoji: "🍄‍🟫",
    giaMua: 2500,
    giaBan: 3750,
    thoiGianMoc: 120,
    doHiem: "Tiên Phẩm",
    moTa: "Nấm huyền bí chỉ nảy mầm dưới bóng trăng tối, mang âm khí cực âm",
    kinhNghiem: 60,
  },
  {
    id: "hoa_twilight",
    ten: "Nguyệt Dạ Lan",
    emoji: "🌸",
    giaMua: 8000,
    giaBan: 12000,
    thoiGianMoc: 360,
    doHiem: "Thần Phẩm",
    moTa: "Thần hoa chỉ nở một lần trong hoàng hôn Twilight, chứa đựng linh lực của cả vũ trụ",
    kinhNghiem: 150,
  },
];

export const cayMap = new Map(danhSachCay.map((c) => [c.id, c]));

// Seed helpers — mua trả về "hat_<id>", trong tiêu thụ "hat_<id>"
export function layHatGiongId(cayId: string): string {
  return "hat_" + cayId;
}

export function layCayTuHatGiong(hatId: string): Cay | undefined {
  if (!hatId.startsWith("hat_")) return undefined;
  return cayMap.get(hatId.slice(4));
}

export function laHatGiong(tenCay: string): boolean {
  return tenCay.startsWith("hat_");
}

export function timCayTheoTen(query: string): Cay | undefined {
  const q = query.toLowerCase().trim();
  return danhSachCay.find(
    (c) =>
      c.ten.toLowerCase() === q ||
      c.id === q ||
      c.ten.toLowerCase().includes(q) ||
      c.id.includes(q.replace(/\s/g, "_"))
  );
}

// Tìm cây theo tên, ID cây, hoặc ID hạt giống (hat_<id>)
export function timCayTheoTenHoacHat(query: string): Cay | undefined {
  const q = query.toLowerCase().trim();
  if (q.startsWith("hat_")) {
    return cayMap.get(q.slice(4));
  }
  return timCayTheoTen(q);
}

// Màu embed theo phẩm
export const mauDoHiem: Record<string, number> = {
  "Phàm Phẩm":  0x95a5a6,
  "Linh Phẩm":  0x3498db,
  "Tiên Phẩm":  0x9b59b6,
  "Thần Phẩm":  0xffd700,
};

// Icon phẩm
export const iconDoHiem: Record<string, string> = {
  "Phàm Phẩm":  "⬜",
  "Linh Phẩm":  "🟦",
  "Tiên Phẩm":  "🟪",
  "Thần Phẩm":  "🟨",
};

// Hệ thống cấp độ — phong cách tu tiên
export const mucCapDo = [
  { cap: 1,  kinhNghiemCanThiet: 0,     soODat: 3,  tenCap: "Tiểu Đồng" },
  { cap: 2,  kinhNghiemCanThiet: 100,   soODat: 4,  tenCap: "Học Đồ" },
  { cap: 3,  kinhNghiemCanThiet: 300,   soODat: 5,  tenCap: "Tu Sĩ" },
  { cap: 4,  kinhNghiemCanThiet: 700,   soODat: 6,  tenCap: "Linh Nông" },
  { cap: 5,  kinhNghiemCanThiet: 1500,  soODat: 7,  tenCap: "Đạo Nông" },
  { cap: 6,  kinhNghiemCanThiet: 3000,  soODat: 8,  tenCap: "Linh Sư" },
  { cap: 7,  kinhNghiemCanThiet: 6000,  soODat: 9,  tenCap: "Vườn Chủ" },
  { cap: 8,  kinhNghiemCanThiet: 12000, soODat: 10, tenCap: "Thần Nông" },
];

export function layThongTinCap(cap: number) {
  return mucCapDo.find((m) => m.cap === cap) ?? mucCapDo[0];
}

export function layCapTiepTheo(cap: number) {
  return mucCapDo.find((m) => m.cap === cap + 1);
}
