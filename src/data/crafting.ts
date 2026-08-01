// Hệ thống Luyện Đan — kết hợp linh thảo và vật phẩm đặc biệt để tạo linh đan

export interface NguyenLieu {
  cayId: string;    // ID cây HOẶC vật phẩm đặc biệt (linh_tinh_*, boss_hach)
  soLuong: number;
}

export type HieuUngDan =
  | { loai: "kinhNghiem"; soLuong: number }
  | { loai: "xu"; soLuong: number }
  | { loai: "kinhNghiemVaXu"; kinhNghiem: number; xu: number }
  | { loai: "moRongVuon"; soODat: number };

export interface CongThucDan {
  id: string;
  ten: string;
  emoji: string;
  nguyenLieu: NguyenLieu[];
  moTa: string;
  hieuUng: HieuUngDan;
  hieuUngMoTa: string;
  doKho: "Thường" | "Khó" | "Thần Phẩm" | "Huyền Thoại";
}

export const congThucDanhSach: CongThucDan[] = [
  // ── THƯỜNG ──────────────────────────────────────────────────────────────────
  {
    id: "linh_dan_co_so",
    ten: "Linh Đan Cơ Sở",
    emoji: "💊",
    nguyenLieu: [
      { cayId: "hoang_can", soLuong: 3 },
      { cayId: "hoa_chau", soLuong: 2 },
    ],
    moTa: "Viên đan nhỏ màu vàng óng, thấm đẫm linh khí đất sơ cấp, giúp gia tăng tu vi nhanh chóng",
    hieuUng: { loai: "kinhNghiem", soLuong: 80 },
    hieuUngMoTa: "+80 Linh Lực",
    doKho: "Thường",
  },
  {
    id: "hoa_linh_dan",
    ten: "Hỏa Linh Đan",
    emoji: "🔴",
    nguyenLieu: [
      { cayId: "hoa_chau", soLuong: 3 },
      { cayId: "kim_tue", soLuong: 2 },
    ],
    moTa: "Đan dược đỏ rực như lửa, nung nấu linh lực tới cực điểm, thích hợp cho tu sĩ trung cấp",
    hieuUng: { loai: "kinhNghiemVaXu", kinhNghiem: 150, xu: 200 },
    hieuUngMoTa: "+150 Linh Lực + 200 💠",
    doKho: "Thường",
  },

  // ── KHÓ ─────────────────────────────────────────────────────────────────────
  {
    id: "nguyet_tinh_dan",
    ten: "Nguyệt Tinh Đan",
    emoji: "🔵",
    nguyenLieu: [
      { cayId: "huyet_mai", soLuong: 2 },
      { cayId: "linh_chi", soLuong: 2 },
      { cayId: "nhat_hoa", soLuong: 1 },
    ],
    moTa: "Đan dược xanh huyền bí tỏa ánh nguyệt quang, linh khí thuần túy ngưng tụ từ ba loại linh thảo hiếm",
    hieuUng: { loai: "kinhNghiemVaXu", kinhNghiem: 500, xu: 800 },
    hieuUngMoTa: "+500 Linh Lực + 800 💠",
    doKho: "Khó",
  },
  {
    id: "huyet_tinh_dan",
    ten: "Huyết Tinh Đan",
    emoji: "🟣",
    nguyenLieu: [
      { cayId: "linh_chi", soLuong: 3 },
      { cayId: "nhat_hoa", soLuong: 2 },
      { cayId: "am_linh_chi", soLuong: 1 },
    ],
    moTa: "Đan dược tím huyền mang linh lực cực âm, khai mở linh mạch cho tu sĩ cao cấp",
    hieuUng: { loai: "kinhNghiemVaXu", kinhNghiem: 1200, xu: 2000 },
    hieuUngMoTa: "+1200 Linh Lực + 2000 💠",
    doKho: "Khó",
  },
  {
    id: "linh_dia_bao",
    ten: "Linh Địa Bảo",
    emoji: "🟫",
    nguyenLieu: [
      { cayId: "nhat_hoa", soLuong: 3 },
      { cayId: "am_linh_chi", soLuong: 2 },
    ],
    moTa: "Vật bảo chứa tinh hoa linh địa, khai mở thêm một mảnh đất thiêng trong vườn",
    hieuUng: { loai: "moRongVuon", soODat: 1 },
    hieuUngMoTa: "Mở thêm 1 ô đất (tối đa 10 ô)",
    doKho: "Khó",
  },

  // ── CÔNG THỨC THÁM HIỂM — dùng Linh Tinh ───────────────────────────────────
  {
    id: "lam_son_huyet_dan",
    ten: "Lâm Sơn Huyết Đan",
    emoji: "🌿⛰️",
    nguyenLieu: [
      { cayId: "linh_tinh_rung", soLuong: 2 },
      { cayId: "linh_tinh_son", soLuong: 2 },
      { cayId: "linh_chi", soLuong: 2 },
    ],
    moTa: "Kết hợp tinh hoa Rừng Cổ Linh và Linh Sơn Đỉnh, đan dược mang sức mạnh của cả rừng lẫn núi",
    hieuUng: { loai: "kinhNghiemVaXu", kinhNghiem: 1800, xu: 2500 },
    hieuUngMoTa: "+1800 Linh Lực + 2500 💠 *(cần Lâm Tinh + Sơn Tinh)*",
    doKho: "Khó",
  },
  {
    id: "dai_dia_bao",
    ten: "Đại Địa Bảo",
    emoji: "🗺️",
    nguyenLieu: [
      { cayId: "linh_tinh_rung", soLuong: 1 },
      { cayId: "linh_tinh_son", soLuong: 1 },
      { cayId: "linh_tinh_hai", soLuong: 1 },
      { cayId: "linh_tinh_tich", soLuong: 1 },
    ],
    moTa: "Bốn tinh hoa từ bốn vùng đất hợp lại, mở ra mảnh đất linh thiêng bí ẩn chưa ai đặt chân tới",
    hieuUng: { loai: "moRongVuon", soODat: 2 },
    hieuUngMoTa: "Mở thêm 2 ô đất *(cần 4 loại Linh Tinh)*",
    doKho: "Khó",
  },

  // ── THẦN PHẨM ───────────────────────────────────────────────────────────────
  {
    id: "than_pham_kim_dan",
    ten: "Thần Phẩm Kim Đan",
    emoji: "🌟",
    nguyenLieu: [
      { cayId: "am_linh_chi", soLuong: 3 },
      { cayId: "hoa_twilight", soLuong: 1 },
    ],
    moTa: "Đan dược thần thánh của Vườn Twilight, chứa đựng linh lực cả vũ trụ — vô cùng hiếm và quý giá",
    hieuUng: { loai: "kinhNghiemVaXu", kinhNghiem: 5000, xu: 8000 },
    hieuUngMoTa: "+5000 Linh Lực + 8000 💠",
    doKho: "Thần Phẩm",
  },
  {
    id: "ngu_hanh_linh_dan",
    ten: "Ngũ Hành Linh Đan",
    emoji: "✨",
    nguyenLieu: [
      { cayId: "linh_tinh_rung", soLuong: 1 },
      { cayId: "linh_tinh_son", soLuong: 1 },
      { cayId: "linh_tinh_hai", soLuong: 1 },
      { cayId: "linh_tinh_tich", soLuong: 1 },
      { cayId: "linh_tinh_thien", soLuong: 1 },
    ],
    moTa: "Năm tinh hoa của năm vùng đất huyền bí hội tụ — đan dược ngưng tụ toàn bộ linh khí thế giới Twilight",
    hieuUng: { loai: "kinhNghiemVaXu", kinhNghiem: 4000, xu: 4000 },
    hieuUngMoTa: "+4000 Linh Lực + 4000 💠 *(cần 5 loại Linh Tinh từ 5 địa điểm)*",
    doKho: "Thần Phẩm",
  },

  // ── HUYỀN THOẠI — cần Boss Hạch ──────────────────────────────────────────────
  {
    id: "dai_tong_dan",
    ten: "Đại Tổng Đan",
    emoji: "💎",
    nguyenLieu: [
      { cayId: "boss_hach", soLuong: 2 },
      { cayId: "linh_tinh_thien", soLuong: 1 },
      { cayId: "hoa_twilight", soLuong: 1 },
    ],
    moTa: "Đan dược tối thượng được luyện từ nhân tinh của boss và tinh khí Thiên Nhai — chỉ kẻ chinh phục cả trận địa lẫn thiên nhiên mới có thể tạo ra",
    hieuUng: { loai: "kinhNghiemVaXu", kinhNghiem: 10000, xu: 15000 },
    hieuUngMoTa: "+10,000 Linh Lực + 15,000 💠 *(cần Boss Hạch + Thiên Tinh)*",
    doKho: "Huyền Thoại",
  },
];

export const congThucMap = new Map(congThucDanhSach.map((c) => [c.id, c]));

export function timCongThucTheoTen(query: string): CongThucDan | undefined {
  const q = query.toLowerCase().trim();
  return congThucDanhSach.find(
    (c) =>
      c.ten.toLowerCase() === q ||
      c.id === q ||
      c.ten.toLowerCase().includes(q) ||
      c.id.includes(q.replace(/\s/g, "_"))
  );
}

export const mauDoKho: Record<string, number> = {
  "Thường":       0x95a5a6,
  "Khó":          0x9b59b6,
  "Thần Phẩm":   0xffd700,
  "Huyền Thoại": 0xff4444,
};
