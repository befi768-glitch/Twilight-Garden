import { Cay, danhSachCay } from "../data/plants";
import { TEN_TIEN, EMOJI_TIEN } from "./helpers";

export interface SuKienNgauNhien {
  loai:
    | "thien_co"
    | "linh_vat_xuat_hien"
    | "nguyet_man"
    | "sau_linh"
    | "loi_kiep"
    | "cuong_phong"
    | "binh_thuong";
  moTa: string;
  // Có lợi
  bonusXu?: number;
  bonusCay?: { id: string; soLuong: number };
  bonusSanLuong?: number;
  // Bất lợi
  matXu?: number;
  matSanLuong?: number; // số nguyên dương = mất đúng số đó; -1 = mất 30%
}

// ── Xác suất mỗi loại (tổng có lợi = 15%, tổng bất lợi = 15%) ──
// Vùng [0, 0.05)  → Nguyệt Mãn        +1 sản lượng
// Vùng [0.05,0.10)→ Linh Vật           +hạt giống
// Vùng [0.10,0.15)→ Thiên Cơ           +xu
// Vùng [0.15,0.20)→ Sâu Linh           -1 sản lượng
// Vùng [0.20,0.25)→ Lôi Kiếp           -xu
// Vùng [0.25,0.30)→ Cuồng Phong        -30% sản lượng
// Vùng [0.30,1.00)→ Bình thường        (70%)

const loiThienKhoi = [
  "Thiên địa linh khí hội tụ vào khu vườn của bạn",
  "Nàng Tiên Twilight mỉm cười ban phước lành",
  "Nguyệt quang chiếu rọi, vạn vật thêm linh thiêng",
  "Gió từ rừng sâu mang theo may mắn tới",
];

const loiThoiXau = [
  "Nghiệp chướng từ kiếp trước chưa trả hết",
  "Vận số buổi sáng nay kém cỏi",
  "Âm khí vượng, linh lực tổn thất",
  "Thiên đạo vô tình, thịnh cực thì suy",
];

export function taoSuKien(cay: Cay): SuKienNgauNhien {
  const ran = Math.random();

  // ── CÓ LỢI (5% mỗi loại, tổng 15%) ─────────────────────────

  // 5% — Nguyệt Mãn: +1 sản lượng
  if (ran < 0.05) {
    return {
      loai: "nguyet_man",
      moTa: `🌕 **Nguyệt Mãn Thiên Cơ!** ${cay.emoji} **${cay.ten}** hấp thu trăng rằm, sinh trưởng bội thu — thu thêm 1!`,
      bonusSanLuong: 1,
    };
  }

  // 5% — Linh Vật Xuất Hiện: nhận hạt giống ngẫu nhiên Phàm Phẩm
  if (ran < 0.10) {
    const cayNgauNhien = danhSachCay[Math.floor(Math.random() * 3)];
    return {
      loai: "linh_vat_xuat_hien",
      moTa: `🌱 **Linh Vật Xuất Hiện!** Hạt ${cayNgauNhien.emoji} **${cayNgauNhien.ten}** từ đất thiêng rơi vào Bảo Nang!`,
      bonusCay: { id: cayNgauNhien.id, soLuong: 1 },
    };
  }

  // 5% — Thiên Cơ: bonus xu bằng 40% giá bán
  if (ran < 0.15) {
    const bonusXu = Math.floor(cay.giaBan * 0.4);
    const loi = loiThienKhoi[Math.floor(Math.random() * loiThienKhoi.length)];
    return {
      loai: "thien_co",
      moTa: `✨ **Thiên Cơ Giáng Lâm!** *${loi}* — Nhận thêm **${bonusXu} ${EMOJI_TIEN}**!`,
      bonusXu,
    };
  }

  // ── BẤT LỢI (5% mỗi loại, tổng 15%) ────────────────────────

  // 5% — Sâu Linh: mất 1 sản lượng (nếu chỉ có 1 thì không mất)
  if (ran < 0.20) {
    const loi = loiThoiXau[Math.floor(Math.random() * loiThoiXau.length)];
    return {
      loai: "sau_linh",
      moTa: `🐛 **Sâu Linh Xâm Thực!** *${loi}* — Sâu ăn mất 1 ${cay.emoji} **${cay.ten}**!`,
      matSanLuong: 1,
    };
  }

  // 5% — Lôi Kiếp: mất xu bằng 20% giá bán
  if (ran < 0.25) {
    const matXu = Math.max(5, Math.floor(cay.giaBan * 0.2));
    const loi = loiThoiXau[Math.floor(Math.random() * loiThoiXau.length)];
    return {
      loai: "loi_kiep",
      moTa: `⚡ **Lôi Kiếp Giáng Xuống!** *${loi}* — Mất **${matXu} ${EMOJI_TIEN} ${TEN_TIEN}**!`,
      matXu,
    };
  }

  // 5% — Cuồng Phong: mất 30% sản lượng (tối thiểu 1)
  if (ran < 0.30) {
    const loi = loiThoiXau[Math.floor(Math.random() * loiThoiXau.length)];
    return {
      loai: "cuong_phong",
      moTa: `🌪️ **Cuồng Phong Linh Thổi Qua!** *${loi}* — Gió cuốn mất 30% sản lượng!`,
      matSanLuong: -1, // -1 = mất 30%, xử lý trong thuhoach.ts
    };
  }

  // 5% — Hắc Sương Độc: mất xu = 50% giá bán (nặng hơn Lôi Kiếp)
  if (ran < 0.35) {
    const matXu = Math.max(10, Math.floor(cay.giaBan * 0.5));
    const loi = loiThoiXau[Math.floor(Math.random() * loiThoiXau.length)];
    return {
      loai: "loi_kiep",
      moTa: `🌫️ **Hắc Sương Độc Phủ!** *${loi}* — Sương âm khí bao trùm, linh lực tan biến — Mất **${matXu} ${EMOJI_TIEN} ${TEN_TIEN}**!`,
      matXu,
    };
  }

  // 5% — Quỷ Tinh Quấy Phá: mất thêm 2 sản lượng (nặng hơn Sâu Linh)
  if (ran < 0.40) {
    const loi = loiThoiXau[Math.floor(Math.random() * loiThoiXau.length)];
    return {
      loai: "sau_linh",
      moTa: `👺 **Quỷ Tinh Quấy Phá!** *${loi}* — Bầy quỷ tinh ập vào, nghiền nát linh thảo — Mất 2 ${cay.emoji} **${cay.ten}**!`,
      matSanLuong: 2,
    };
  }

  // 60% — Bình thường
  return { loai: "binh_thuong", moTa: "" };
}

// Lời thoại ngẫu nhiên theo hành động
export const loi_thoai = {
  trong: [
    "*Nàng Tiên khẽ thì thầm với hạt giống, truyền vào đó linh lực của đại địa...*",
    "*Linh Địa Twilight đón nhận hạt giống với sự trân trọng vô hạn...*",
    "*Một mầm linh thảo mới vừa được đánh thức từ giấc ngủ ngàn năm...*",
    "*Hãy chăm sóc nó bằng cả tấm lòng — linh thảo cảm nhận được tình cảm người trồng~*",
  ],
  tuoi: [
    "*Sương nguyệt long lanh như châu ngọc rơi xuống đất thiêng...*",
    "*Linh thảo hít thở linh khí thanh khiết, vươn mình về phía ánh trăng...*",
    "*Tình yêu của người tu luyện thấm sâu vào từng rễ linh thảo...*",
    "*Vườn Twilight rì rào lời cảm ơn theo ngọn gió đêm huyền bí...*",
  ],
  thuhoach: [
    "*Thành quả của bao ngày tu luyện cuối cùng đã đến lúc hái quả...*",
    "*Linh Địa huyền bí trao lại những gì người chủ đã dày công vun đắp...*",
    "*Nàng Tiên Twilight gật đầu hài lòng nhìn mùa thu hái bội thu...*",
    "*Linh thảo chín rộ, linh khí tỏa hương thơm khắp Vườn Twilight...*",
  ],
  chuc_mung_cap: [
    "Linh Địa mở rộng theo sức mạnh tu luyện của bạn! 🌿",
    "Nàng Tiên Twilight ban thêm đất thiêng cho người xứng đáng! 🌸",
    "Nguyệt quang chiếu sáng con đường trưởng thành của đạo nông! 🌕",
  ],
};

export function layLoiThoaiNgauNhien(loai: keyof typeof loi_thoai): string {
  const arr = loi_thoai[loai];
  return arr[Math.floor(Math.random() * arr.length)];
}
