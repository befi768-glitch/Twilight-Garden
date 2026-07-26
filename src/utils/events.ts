import { Cay } from "../data/plants";

export interface SuKienNgauNhien {
  loai: "phep_mau" | "hat_giong_bi_an" | "trang_ram" | "binh_thuong";
  moTa: string;
  bonusXu?: number;
  bonusCay?: { id: string; soLuong: number };
  bonusSanLuong?: number;
}

const loi_chuc = [
  "Vườn Twilight mỉm cười với bạn ✨",
  "Nàng tiên vườn ban phước lành 🌸",
  "Ánh trăng rọi xuống khu vườn của bạn 🌙",
  "Gió đêm mang may mắn đến 🍃",
];

export function taoSuKien(cay: Cay): SuKienNgauNhien {
  const ran = Math.random();

  // 5% - Trăng Rằm: +1 sản lượng
  if (ran < 0.05) {
    return {
      loai: "trang_ram",
      moTa: `🌕 **Trăng Rằm chiếu rọi!** ${cay.emoji} ${cay.ten} sinh trưởng thần kỳ, thu hoạch thêm 1 cái!`,
      bonusSanLuong: 1,
    };
  }

  // 10% - Hạt giống bí ẩn: nhận 1 hạt ngẫu nhiên
  if (ran < 0.15) {
    const { danhSachCay } = require("../data/plants");
    const cayNgauNhien = danhSachCay[Math.floor(Math.random() * 4)]; // Chỉ lấy cây thường
    return {
      loai: "hat_giong_bi_an",
      moTa: `🌱 **Hạt giống bí ẩn xuất hiện!** Bạn tìm thấy 1x ${cayNgauNhien.emoji} **${cayNgauNhien.ten}** trong đất!`,
      bonusCay: { id: cayNgauNhien.id, soLuong: 1 },
    };
  }

  // 15% - Phép màu: +50% xu khi bán
  if (ran < 0.30) {
    const bonusXu = Math.floor(cay.giaBan * 0.5);
    const loiChuc = loi_chuc[Math.floor(Math.random() * loi_chuc.length)];
    return {
      loai: "phep_mau",
      moTa: `✨ **Phép màu Twilight!** ${loiChuc} — Nhận thêm **${bonusXu} xu** 🪙`,
      bonusXu,
    };
  }

  return { loai: "binh_thuong", moTa: "" };
}

// Lời thoại ngẫu nhiên theo hành động
export const loi_thoai = {
  trong: [
    "*Nàng tiên khẽ thì thầm với hạt giống, truyền vào đó chút phép màu...*",
    "*Đất đai Twilight đón nhận hạt giống với lòng biết ơn sâu sắc...*",
    "*Một mầm sống mới vừa được đánh thức trong khu vườn huyền bí...*",
    "*Hãy chăm sóc nó thật tốt nhé, khu vườn đang trông chờ bạn~*",
  ],
  tuoi: [
    "*Những giọt sương đêm lung linh như ngọc trai rơi xuống...*",
    "*Cây cối hít thở không khí mát lành, vươn mình đón ánh bình minh...*",
    "*Tình yêu của người làm vườn thấm vào từng cành lá...*",
    "*Vườn Twilight rì rào lời cảm ơn theo gió thoảng...*",
  ],
  thuhoach: [
    "*Thành quả của sự kiên nhẫn và tình yêu đã đến lúc...*",
    "*Khu vườn huyền bí trao lại những gì bạn đã gieo trồng...*",
    "*Nàng tiên vườn mỉm cười hài lòng nhìn bạn thu hoạch...*",
    "*Mùa màng bội thu, vườn Twilight thêm rực rỡ...*",
  ],
  chuc_mung_cap: [
    "Khu vườn huyền bí mở rộng theo tài năng của bạn! 🌿",
    "Nàng tiên Twilight ban thêm đất trời cho người xứng đáng! 🌸",
    "Ánh trăng chiếu sáng con đường trưởng thành của bạn! 🌕",
  ],
};

export function layLoiThoaiNgauNhien(loai: keyof typeof loi_thoai): string {
  const arr = loi_thoai[loai];
  return arr[Math.floor(Math.random() * arr.length)];
}
