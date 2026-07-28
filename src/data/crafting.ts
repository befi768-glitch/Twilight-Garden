// Hệ thống Luyện Đan — kết hợp linh thảo để tạo linh đan đặc biệt

export interface NguyenLieu {
  cayId: string;    // ID cây (không phải hạt giống)
  soLuong: number;
}

export type HieuUngDan =
  | { loai: "kinhNghiem"; soLuong: number }
  | { loai: "xu"; soLuong: number }
  | { loai: "kinhNghiemVaXu"; kinhNghiem: number; xu: number }
  | { loai: "moRongVuon"; soODat: number };    // mở thêm ô đất

export interface CongThucDan {
  id: string;
  ten: string;
  emoji: string;
  nguyenLieu: NguyenLieu[];
  moTa: string;
  hieuUng: HieuUngDan;
  hieuUngMoTa: string;
  doKho: "Thường" | "Khó" | "Thần Phẩm";
}

export const congThucDanhSach: CongThucDan[] = [
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
    hieuUngMoTa: "+80 Linh Lực ngay lập tức",
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
    hieuUngMoTa: "+150 Linh Lực + 200 💠 Nguyệt Thạch",
    doKho: "Thường",
  },
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
    hieuUngMoTa: "+500 Linh Lực + 800 💠 Nguyệt Thạch",
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
    moTa: "Đan dược tím huyền mang linh lực cực âm của Ám Nguyệt Nấm, khai mở linh mạch cho tu sĩ cao cấp",
    hieuUng: { loai: "kinhNghiemVaXu", kinhNghiem: 1200, xu: 2000 },
    hieuUngMoTa: "+1200 Linh Lực + 2000 💠 Nguyệt Thạch",
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
    moTa: "Vật bảo chứa đựng tinh hoa của linh địa, khi dùng sẽ khai mở thêm một mảnh đất thiêng trong vườn",
    hieuUng: { loai: "moRongVuon", soODat: 1 },
    hieuUngMoTa: "Mở thêm 1 ô đất trồng cây (tối đa 10 ô)",
    doKho: "Khó",
  },
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
    hieuUngMoTa: "+5000 Linh Lực + 8000 💠 Nguyệt Thạch",
    doKho: "Thần Phẩm",
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
};
