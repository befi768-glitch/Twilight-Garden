import { Cay, danhSachCay } from "../data/plants";
import { TEN_TIEN, EMOJI_TIEN } from "./helpers";

export interface SuKienNgauNhien {
  loai: "thien_co" | "linh_vat_xuat_hien" | "nguyet_man" | "binh_thuong";
  moTa: string;
  bonusXu?: number;
  bonusCay?: { id: string; soLuong: number };
  bonusSanLuong?: number;
}

const loiThienKhoi = [
  "Thiên địa linh khí hội tụ vào khu vườn của bạn",
  "Nàng Tiên Twilight mỉm cười ban phước lành",
  "Nguyệt quang chiếu rọi, vạn vật thêm linh thiêng",
  "Gió từ rừng sâu mang theo may mắn tới",
];

export function taoSuKien(cay: Cay): SuKienNgauNhien {
  const ran = Math.random();

  // 5% — Nguyệt Mãn: +1 sản lượng
  if (ran < 0.05) {
    return {
      loai: "nguyet_man",
      moTa: `🌕 **Nguyệt Mãn Thiên Cơ!** ${cay.emoji} **${cay.ten}** hấp thu trăng rằm, sinh trưởng bội thu — thu thêm 1 linh thảo!`,
      bonusSanLuong: 1,
    };
  }

  // 10% — Linh Vật Xuất Hiện: nhận hạt giống ngẫu nhiên
  if (ran < 0.15) {
    const cayNgauNhien = danhSachCay[Math.floor(Math.random() * 3)]; // Lấy từ Phàm Phẩm
    return {
      loai: "linh_vat_xuat_hien",
      moTa: `🌱 **Linh Vật Xuất Hiện!** Một hạt ${cayNgauNhien.emoji} **${cayNgauNhien.ten}** từ đất thiêng rơi vào Bảo Nang của bạn!`,
      bonusCay: { id: cayNgauNhien.id, soLuong: 1 },
    };
  }

  // 15% — Thiên Cơ: bonus Nguyệt Thạch
  if (ran < 0.30) {
    const bonusXu = Math.floor(cay.giaBan * 0.5);
    const loiChuc = loiThienKhoi[Math.floor(Math.random() * loiThienKhoi.length)];
    return {
      loai: "thien_co",
      moTa: `✨ **Thiên Cơ Giáng Lâm!** *${loiChuc}* — Nhận thêm **${bonusXu} ${EMOJI_TIEN} ${TEN_TIEN}**!`,
      bonusXu,
    };
  }

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
