// Vật phẩm đặc biệt — chỉ kiếm được qua thám hiểm & boss, không mua được ở cửa hàng
export interface VatPhamDacBiet {
  id: string;
  ten: string;
  emoji: string;
  moTa: string;
  nguonGoc: string; // Nơi kiếm được
}

export const danhSachVatPham: VatPhamDacBiet[] = [
  {
    id: "linh_tinh_rung",
    ten: "Lâm Tinh",
    emoji: "🌿",
    moTa: "Tinh hoa cô đọng của Rừng Cổ Linh ngàn năm — dùng trong luyện đan",
    nguonGoc: "🌲 Thám hiểm Rừng Cổ Linh",
  },
  {
    id: "linh_tinh_son",
    ten: "Sơn Tinh",
    emoji: "⛰️",
    moTa: "Khoáng thạch linh khí từ đỉnh Linh Sơn — dùng trong luyện đan",
    nguonGoc: "🏔️ Thám hiểm Linh Sơn Đỉnh",
  },
  {
    id: "linh_tinh_hai",
    ten: "Hải Tinh",
    emoji: "🌊",
    moTa: "Tinh thể muối biển ngậm linh khí Huyền Hải — dùng trong luyện đan",
    nguonGoc: "🌊 Thám hiểm Huyền Hải Bờ",
  },
  {
    id: "linh_tinh_tich",
    ten: "Tích Tinh",
    emoji: "🔮",
    moTa: "Tàn dư linh lực trong lò đan cổ đại — dùng trong luyện đan",
    nguonGoc: "⚗️ Thám hiểm Phế Tích Đan Lò",
  },
  {
    id: "linh_tinh_thien",
    ten: "Thiên Tinh",
    emoji: "🌌",
    moTa: "Tinh khí trời đất đặc quánh tại Thiên Nhai Bình — cực kỳ hiếm",
    nguonGoc: "🌌 Thám hiểm Thiên Nhai Bình (Cấp 6)",
  },
  {
    id: "boss_hach",
    ten: "Boss Hạch",
    emoji: "💎",
    moTa: "Nhân tinh hoa rơi từ boss bị tiêu diệt — dùng để luyện Đại Tổng Đan",
    nguonGoc: "👹 Tham gia đánh boss server",
  },
];

export const vatPhamMap = new Map(danhSachVatPham.map((v) => [v.id, v]));

export function laVatPhamDacBiet(id: string): boolean {
  return vatPhamMap.has(id);
}

// Lấy tên hiển thị cho bất kỳ item nào (cả cây lẫn vật phẩm đặc biệt)
export function layTenItem(id: string): { ten: string; emoji: string } | undefined {
  return vatPhamMap.get(id);
}
