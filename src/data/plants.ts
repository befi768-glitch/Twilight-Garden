export interface Cay {
  id: string;
  ten: string;
  emoji: string;
  giaMua: number;       // xu mua hạt giống
  giaBan: number;       // xu bán nông sản
  thoiGianMoc: number;  // phút
  doHiem: "thường" | "hiếm" | "cực hiếm" | "huyền thoại";
  moTa: string;
  kinhNghiem: number;   // kinh nghiệm khi thu hoạch
}

export const danhSachCay: Cay[] = [
  {
    id: "ca_rot",
    ten: "Cà Rốt",
    emoji: "🥕",
    giaMua: 10,
    giaBan: 25,
    thoiGianMoc: 5,
    doHiem: "thường",
    moTa: "Rau củ dễ trồng, phổ biến nhất trong vườn",
    kinhNghiem: 3,
  },
  {
    id: "ca_chua",
    ten: "Cà Chua",
    emoji: "🍅",
    giaMua: 20,
    giaBan: 50,
    thoiGianMoc: 10,
    doHiem: "thường",
    moTa: "Ngọt và đỏ mọng, ai cũng thích",
    kinhNghiem: 5,
  },
  {
    id: "bap_ngo",
    ten: "Bắp Ngô",
    emoji: "🌽",
    giaMua: 30,
    giaBan: 75,
    thoiGianMoc: 15,
    doHiem: "thường",
    moTa: "Vàng óng, ngọt lịm, thơm phức",
    kinhNghiem: 7,
  },
  {
    id: "dau_tay",
    ten: "Dâu Tây",
    emoji: "🍓",
    giaMua: 50,
    giaBan: 130,
    thoiGianMoc: 30,
    doHiem: "hiếm",
    moTa: "Hương thơm quyến rũ, chua ngọt hài hoà",
    kinhNghiem: 13,
  },
  {
    id: "nam_huong",
    ten: "Nấm Hương",
    emoji: "🍄",
    giaMua: 80,
    giaBan: 220,
    thoiGianMoc: 45,
    doHiem: "hiếm",
    moTa: "Loại nấm thơm ngon từ rừng già",
    kinhNghiem: 22,
  },
  {
    id: "hoa_huong_duong",
    ten: "Hướng Dương",
    emoji: "🌻",
    giaMua: 100,
    giaBan: 280,
    thoiGianMoc: 60,
    doHiem: "hiếm",
    moTa: "Rực rỡ như ánh nắng ban mai",
    kinhNghiem: 28,
  },
  {
    id: "nam_ma_thuat",
    ten: "Nấm Ma Thuật",
    emoji: "🍄‍🟫",
    giaMua: 200,
    giaBan: 600,
    thoiGianMoc: 120,
    doHiem: "cực hiếm",
    moTa: "Loại nấm huyền bí mọc sâu trong rừng",
    kinhNghiem: 60,
  },
  {
    id: "hoa_twilight",
    ten: "Hoa Twilight",
    emoji: "🌸",
    giaMua: 500,
    giaBan: 1500,
    thoiGianMoc: 360,
    doHiem: "huyền thoại",
    moTa: "Chỉ nở trong bóng hoàng hôn, vô cùng quý hiếm",
    kinhNghiem: 150,
  },
];

// Map để tra cứu nhanh
export const cayMap = new Map(danhSachCay.map((c) => [c.id, c]));

// Tìm cây theo tên (không phân biệt hoa thường)
export function timCayTheoTen(query: string): Cay | undefined {
  const q = query.toLowerCase().trim();
  return danhSachCay.find(
    (c) =>
      c.ten.toLowerCase() === q ||
      c.id === q ||
      c.ten.toLowerCase().includes(q) ||
      c.id.includes(q)
  );
}

// Màu embed theo độ hiếm
export const mauDoHiem: Record<string, number> = {
  thường: 0x57f287,
  hiếm: 0x3498db,
  "cực hiếm": 0x9b59b6,
  "huyền thoại": 0xffd700,
};

// Hệ thống cấp độ
export const mucCapDo = [
  { cap: 1, kinhNghiemCanThiet: 0, soODat: 3, tenCap: "Người Mới" },
  { cap: 2, kinhNghiemCanThiet: 100, soODat: 4, tenCap: "Nông Dân" },
  { cap: 3, kinhNghiemCanThiet: 300, soODat: 5, tenCap: "Nông Dân Lành Nghề" },
  { cap: 4, kinhNghiemCanThiet: 700, soODat: 6, tenCap: "Thợ Làm Vườn" },
  { cap: 5, kinhNghiemCanThiet: 1500, soODat: 7, tenCap: "Chuyên Gia Làm Vườn" },
  { cap: 6, kinhNghiemCanThiet: 3000, soODat: 8, tenCap: "Bậc Thầy Vườn Tược" },
  { cap: 7, kinhNghiemCanThiet: 6000, soODat: 9, tenCap: "Người Giữ Vườn Huyền Bí" },
  { cap: 8, kinhNghiemCanThiet: 12000, soODat: 10, tenCap: "Chủ Nhân Twilight Garden" },
];

// Lấy thông tin cấp độ
export function layThongTinCap(cap: number) {
  return mucCapDo.find((m) => m.cap === cap) ?? mucCapDo[0];
}

export function layCapTiepTheo(cap: number) {
  return mucCapDo.find((m) => m.cap === cap + 1);
}
