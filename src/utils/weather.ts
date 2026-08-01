// Hệ thống thời tiết theo giờ — tính từ guildId + ngày + giờ (không cần DB)

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
  tangXacSuatXau: number;       // số điểm phần trăm cộng thêm cho sự kiện xấu
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
    tangXacSuatXau: 0,
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
    tangXacSuatXau: 0,
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
    tangXacSuatXau: 0,
    giamGiaBan: 0,
    mauEmbed: 0x95a5a6,
  },
  {
    id: "cuong_phong",
    ten: "Cuồng Phong Nghịch Thiên",
    emoji: "🌪️",
    moTa: "Gió dữ từ vùng hắc ám thổi qua, âm khí bao trùm khắp Linh Địa",
    hieu_ung: "🌪️ **+10 điểm % cơ hội** gặp sự kiện xấu khi thu hoạch + **Giảm 7% giá bán** linh thảo\n*(Sát thương boss -5% — thời tiết không thuận lợi chiến đấu)*",
    giamThoiGianTrong: 0,
    tuTuoiKhiTrong: false,
    bonusSanLuong: 0,
    bonusGiaBan: 0,
    tangXacSuatXau: 10,
    giamGiaBan: 7,
    mauEmbed: 0xe74c3c,
  },
  {
    id: "nguyet_sac",
    ten: "Nguyệt Sắc Huyền Diệu",
    emoji: "🌕",
    moTa: "Trăng rằm sáng tỏ chiếu xuống Vườn Twilight, linh lực dâng trào khắp nơi",
    hieu_ung: "🌕 **+12% giá bán** tất cả linh thảo hôm nay",
    giamThoiGianTrong: 0,
    tuTuoiKhiTrong: false,
    bonusSanLuong: 0,
    bonusGiaBan: 12,
    tangXacSuatXau: 0,
    giamGiaBan: 0,
    mauEmbed: 0x7b68ee,
  },
  {
    id: "bang_suong",
    ten: "Băng Sương Giá Buốt",
    emoji: "❄️",
    moTa: "Khí lạnh từ cõi u minh tràn vào Linh Địa, linh mạch trong đất đóng băng cứng lại",
    hieu_ung: "❄️ **Tăng 20% thời gian sinh trưởng** — linh khí bị đông đặc, cây mọc chậm hơn",
    giamThoiGianTrong: -20,
    tuTuoiKhiTrong: false,
    bonusSanLuong: 0,
    bonusGiaBan: 0,
    tangXacSuatXau: 0,
    giamGiaBan: 0,
    mauEmbed: 0xaed6f1,
  },
  {
    id: "am_khi",
    ten: "Âm Khí Trầm Tích",
    emoji: "🌫️",
    moTa: "Sương âm khí dày đặc phủ kín Vườn Twilight, linh thảo héo úa trong màn sương tối",
    hieu_ung: "🌫️ **Giảm 12% giá bán** linh thảo + **+10 điểm % cơ hội** gặp sự kiện xấu khi thu hoạch",
    giamThoiGianTrong: 0,
    tuTuoiKhiTrong: false,
    bonusSanLuong: 0,
    bonusGiaBan: 0,
    tangXacSuatXau: 10,
    giamGiaBan: 12,
    mauEmbed: 0x808b96,
  },
  {
    id: "han_han",
    ten: "Hạn Hán Linh Mạch",
    emoji: "🏜️",
    moTa: "Linh tuyền cạn khô, đất thiêng nứt nẻ và những mầm cây phải chống chọi với khô hạn",
    hieu_ung: "🏜️ **Tăng 10% thời gian sinh trưởng** + **Giảm 5% giá bán** + **+8 điểm % cơ hội** gặp sự kiện xấu",
    giamThoiGianTrong: -10,
    tuTuoiKhiTrong: false,
    bonusSanLuong: 0,
    bonusGiaBan: 0,
    tangXacSuatXau: 8,
    giamGiaBan: 5,
    mauEmbed: 0xd68910,
  },
  {
    id: "mua_da",
    ten: "Mưa Đá Linh Mạch",
    emoji: "🧊",
    moTa: "Những viên băng linh lực trút xuống, làm tổn thương mầm cây và khiến việc thu hoạch thêm rủi ro",
    hieu_ung: "🧊 **Tăng 15% thời gian sinh trưởng** + **Giảm 5% giá bán** + **+8 điểm % cơ hội** gặp sự kiện xấu",
    giamThoiGianTrong: -15,
    tuTuoiKhiTrong: false,
    bonusSanLuong: 0,
    bonusGiaBan: 0,
    tangXacSuatXau: 8,
    giamGiaBan: 5,
    mauEmbed: 0x5499c7,
  },
  {
    id: "doc_vu",
    ten: "Độc Vụ Hắc Ám",
    emoji: "☣️",
    moTa: "Màn sương độc len vào từng luống cây, làm linh thảo mất giá và thu hút những điềm dữ",
    hieu_ung: "☣️ **Giảm 15% giá bán** linh thảo + **+12 điểm % cơ hội** gặp sự kiện xấu khi thu hoạch",
    giamThoiGianTrong: 0,
    tuTuoiKhiTrong: false,
    bonusSanLuong: 0,
    bonusGiaBan: 0,
    tangXacSuatXau: 12,
    giamGiaBan: 15,
    mauEmbed: 0x148f77,
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
