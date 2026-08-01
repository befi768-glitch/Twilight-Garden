// Hệ thống thời tiết hàng ngày — tính từ guildId + ngày (không cần DB)

export interface LoaiThoiTiet {
  id: string;
  ten: string;
  emoji: string;
  moTa: string;
  hieu_ung: string;
  // Buff trồng cây
  giamThoiGianTrong: number;   // phần trăm (0–100), 0 = không giảm
  tuTuoiKhiTrong: boolean;      // có tự tưới khi trồng không
  // Buff thu hoạch
  bonusSanLuong: number;        // +N sản lượng cộng thêm
  bonusGiaBan: number;          // % tăng giá bán (0 = không)
  // Debuff
  tangXacSuatXau: boolean;      // tăng xác suất sự kiện xấu
  giamGiaBan: number;           // % giảm giá bán (0 = không)
  mauEmbed: number;
}

export const danhSachThoiTiet: LoaiThoiTiet[] = [
  {
    id: "quang_minh",
    ten: "Quang Minh Thiên",
    emoji: "☀️",
    moTa: "Ánh dương chiếu rọi khắp Vườn Twilight, linh khí đất dâng cao tràn ngập",
    hieu_ung: "☀️ Giảm **10%** thời gian sinh trưởng tất cả cây trồng hôm nay",
    giamThoiGianTrong: 10,
    tuTuoiKhiTrong: false,
    bonusSanLuong: 0,
    bonusGiaBan: 0,
    tangXacSuatXau: false,
    giamGiaBan: 0,
    mauEmbed: 0xffd700,
  },
  {
    id: "linh_vu",
    ten: "Linh Vũ Giáng",
    emoji: "🌧️",
    moTa: "Mưa linh từ trời cao tưới mát vạn vật, đất đai thấm đẫm nguyên khí",
    hieu_ung: "🌧️ Cây trồng hôm nay **tự động được tưới** (không cần .tuoi)",
    giamThoiGianTrong: 0,
    tuTuoiKhiTrong: true,
    bonusSanLuong: 0,
    bonusGiaBan: 0,
    tangXacSuatXau: false,
    giamGiaBan: 0,
    mauEmbed: 0x5dade2,
  },
  {
    id: "am_van",
    ten: "Âm Vân Bình Lặng",
    emoji: "⛅",
    moTa: "Mây che khuất vầng dương, vườn Twilight yên tĩnh trong bóng tối nhẹ nhàng",
    hieu_ung: "⛅ Ngày bình thường — không buff, không debuff",
    giamThoiGianTrong: 0,
    tuTuoiKhiTrong: false,
    bonusSanLuong: 0,
    bonusGiaBan: 0,
    tangXacSuatXau: false,
    giamGiaBan: 0,
    mauEmbed: 0x95a5a6,
  },
  {
    id: "cuong_phong",
    ten: "Cuồng Phong Nghịch Thiên",
    emoji: "🌪️",
    moTa: "Gió dữ từ vùng hắc ám thổi qua, âm khí bao trùm khắp Linh Địa",
    hieu_ung: "🌪️ **Tăng 20% xác suất** sự kiện xấu khi thu hoạch + **Giảm 7% giá bán** linh thảo\n*(Sát thương boss -5% — thời tiết không thuận lợi chiến đấu)*",
    giamThoiGianTrong: 0,
    tuTuoiKhiTrong: false,
    bonusSanLuong: 0,
    bonusGiaBan: 0,
    tangXacSuatXau: true,
    giamGiaBan: 7,
    mauEmbed: 0xe74c3c,
  },
  {
    id: "nguyet_sac",
    ten: "Nguyệt Sắc Huyền Diệu",
    emoji: "🌕",
    moTa: "Trăng rằm sáng tỏ chiếu xuống Vườn Twilight, linh lực dâng trào khắp nơi",
    hieu_ung: "🌕 **+12% giá bán** tất cả linh thảo hôm nay\n*(Hiệu ứng chỉ ảnh hưởng giá bán — không buff boss)*",
    giamThoiGianTrong: 0,
    tuTuoiKhiTrong: false,
    bonusSanLuong: 0,
    bonusGiaBan: 12,
    tangXacSuatXau: false,
    giamGiaBan: 0,
    mauEmbed: 0x7b68ee,
  },
];

// Tính thời tiết hôm nay dựa trên guild + ngày (deterministic, không cần DB)
function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function layThoiTietHomNay(guildId: string): LoaiThoiTiet {
  const now = new Date();
  const gioKey = `${guildId}-${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}`;
  const index = hashString(gioKey) % danhSachThoiTiet.length;
  return danhSachThoiTiet[index];
}

// Lấy thời tiết tại một thời điểm cụ thể (dùng để hiển thị lịch)
export function layThoiTietNgay(guildId: string, date: Date): LoaiThoiTiet {
  const gioKey = `${guildId}-${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`;
  const index = hashString(gioKey) % danhSachThoiTiet.length;
  return danhSachThoiTiet[index];
}
