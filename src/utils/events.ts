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
    "*Đất thiêng khẽ rùng mình đón nhận hạt giống như đón một người bạn cũ...*",
    "*Nàng Tiên lắng nghe tiếng thì thầm của hạt giống — nó đang mơ về ngày trổ hoa...*",
    "*Bàn tay gieo hạt là bàn tay viết nên câu chuyện của vườn...*",
    "*Linh khí từ tứ phương tám hướng hội tụ về ô đất nhỏ này...*",
    "*Mỗi hạt giống là một lời hứa với đất — và đất chưa bao giờ quên lời hứa...*",
    "*Vườn Twilight rì rào như tiếng hát ru đón chào mầm xanh mới...*",
    "*Nàng Tiên mỉm cười: \"Ngươi lại gieo thêm một mảnh hồn vào đất rồi...\"*",
    "*Hạt giống chìm vào lòng đất như nhắm mắt thiền định, chờ ngày khai ngộ...*",
  ],
  tuoi: [
    "*Sương nguyệt long lanh như châu ngọc rơi xuống đất thiêng...*",
    "*Linh thảo hít thở linh khí thanh khiết, vươn mình về phía ánh trăng...*",
    "*Tình yêu của người tu luyện thấm sâu vào từng rễ linh thảo...*",
    "*Vườn Twilight rì rào lời cảm ơn theo ngọn gió đêm huyền bí...*",
    "*Nàng Tiên khẽ mỉm cười — tưới nước là tưới cả tâm ý vào cây...*",
    "*Từng giọt nước sương mang theo linh lực, thấm vào đất như khúc nhạc thiên nhiên...*",
    "*Cây cối khẽ rùng mình sung sướng khi được uống ngụm linh tuyền...*",
    "*Dù ngày có bận rộn đến đâu, đừng quên những sinh linh đang chờ đợi trong vườn~*",
    "*Mỗi lần tưới là một lần thì thầm với cây: \"Ta vẫn nhớ đến ngươi\"...*",
    "*Giọt nước rơi xuống đất — và vườn thở phào nhẹ nhõm...*",
    "*Nàng Tiên thì thầm: \"Cảm ơn... cây cũng biết cảm ơn đó, chỉ là theo cách của chúng thôi~\"*",
    "*Linh thảo vươn lá đón giọt sương như đứa trẻ giơ tay đón mưa...*",
  ],
  thuhoach: [
    "*Thành quả của bao ngày tu luyện cuối cùng đã đến lúc hái quả...*",
    "*Linh Địa huyền bí trao lại những gì người chủ đã dày công vun đắp...*",
    "*Nàng Tiên Twilight gật đầu hài lòng nhìn mùa thu hái bội thu...*",
    "*Linh thảo chín rộ, linh khí tỏa hương thơm khắp Vườn Twilight...*",
    "*Mùa thu hoạch — khi đất trả lại tình người bằng những linh thảo thơm ngát...*",
    "*Nàng Tiên thì thầm: \"Ngươi đã kiên nhẫn — và kiên nhẫn xứng đáng được đền đáp...\"*",
    "*Linh thảo cúi đầu chào người hái, như lời từ biệt của người bạn đường...*",
    "*Mỗi cây được hái là một câu chuyện hoàn chỉnh — từ hạt nhỏ đến kho báu...*",
    "*Đất Linh Địa đã giữ lời — những gì gieo xuống đều được trả lại gấp bội...*",
    "*Gió nhẹ thổi qua vườn như tiếng vỗ tay của thiên nhiên chúc mừng mùa bội thu...*",
    "*Nàng Tiên đứng nhìn từ xa, đôi mắt ánh lên niềm vui khó giấu...*",
    "*Thu hoạch xong, vườn lại yên lặng chờ đợi — và sự chờ đợi ấy là khởi đầu của vụ mùa mới...*",
  ],
  chuc_mung_cap: [
    "Linh Địa mở rộng theo sức mạnh tu luyện của bạn! 🌿",
    "Nàng Tiên Twilight ban thêm đất thiêng cho người xứng đáng! 🌸",
    "Nguyệt quang chiếu sáng con đường trưởng thành của đạo nông! 🌕",
  ],
};

// Lời thoại lên cấp theo từng rank
export const loiLenCap: Record<number, { tieuDe: string; moTa: string }> = {
  2: {
    tieuDe: "📖 Học Đồ Thức Tỉnh!",
    moTa: "*Nàng Tiên khẽ chạm vào trán bạn, truyền vào chút linh lực mở đường tu luyện...*\n\n\"Con đường vạn dặm bắt đầu từ một bước chân — hãy cứ tiếp tục~\"",
  },
  3: {
    tieuDe: "🌿 Tu Sĩ Nhập Đạo!",
    moTa: "*Linh khí trong vườn rung động nhẹ, đất đai thêm màu mỡ khi bước chân tu sĩ đặt xuống...*\n\n\"Đạo nông không phải nghề nghiệp — đó là con đường giác ngộ.\"",
  },
  4: {
    tieuDe: "🌾 Linh Nông Thành Tựu!",
    moTa: "*Cây cối nghiêng mình khi Linh Nông bước qua, đất thiêng tự nguyện đón nhận từng hạt giống...*\n\n\"Tay ngươi chạm đất là đất thành linh địa. Chạm cây là cây thành linh thảo.\"",
  },
  5: {
    tieuDe: "🌀 Đạo Nông Khai Sáng!",
    moTa: "*Một luồng khí thanh lưu chuyển quanh vườn — thiên địa đồng thuận, linh lực bát ngát...*\n\n\"Ngươi không còn đang trồng cây nữa — ngươi đang gieo đạo vào đất.\"",
  },
  6: {
    tieuDe: "✨ Linh Sư Hiển Thế!",
    moTa: "*Ánh sáng ngân bạch bùng lên trong thoáng chốc — các linh thảo trong vườn đồng loạt tỏa hương như chào đón vị chủ nhân mới...*\n\n\"Cả Linh Địa Twilight đã nhận ra ngươi. Hãy xứng với danh hiệu đó.\"",
  },
  7: {
    tieuDe: "🏯 Vườn Chủ Lâm Triều!",
    moTa: "*Đất rung, gió chuyển — một Vườn Chủ mới xuất hiện, và cả Linh Địa cúi đầu...*\n\n\"Từ hôm nay, ngươi không chỉ trồng cây. Ngươi bảo hộ cả một vùng linh địa.\"",
  },
  8: {
    tieuDe: "⚡ THẦN NÔNG GIÁNG THẾ!",
    moTa: "*Trời đất biến sắc — ánh vàng kim chiếu rọi khắp Vườn Twilight như thể thiên đạo chứng kiến sự kiện ngàn năm có một...*\n\n**\"THẦN NÔNG ĐÃ GIÁNG THẾ! Muôn cây rủ lá nghênh đón — Nguyệt Tiên cúi đầu kính lễ!\"**\n*Bạn đã đạt đến đỉnh cao của con đường tu luyện!* 🌕",
  },
};

// Lời điểm danh theo streak
export const loiDiemDanh: Array<{ min: number; loi: string[] }> = [
  {
    min: 30,
    loi: [
      "*\"Ba mươi ngày... Nàng Tiên lặng đi một lúc rồi khẽ cúi đầu: 'Ta chưa từng thấy ai kiên trì như ngươi. Linh Địa này rất may mắn có được người chủ như vậy.'\"*",
      "*\"Ba mươi ngày không gián đoạn — cả Linh Địa Twilight đã ghi khắc tên ngươi vào vách đá thiêng. Đây là điều chỉ xảy ra một lần trong trăm năm.\"*",
      "*\"Nàng Tiên thì thầm trong gió: 'Sự kiên nhẫn của ngươi đã chạm đến cả thiên đạo... Hãy tiếp tục — đất thiêng đang chờ đợi điều gì đó vĩ đại từ tay ngươi.'\"*",
    ],
  },
  {
    min: 14,
    loi: [
      "*\"Hai tuần chưa bỏ lỡ một ngày — Nàng Tiên mỉm cười: 'Vườn cây biết ơn ngươi. Chúng đâm chồi nhanh hơn khi cảm nhận được sự chăm chỉ của người chủ.'\"*",
      "*\"Mười bốn mặt trăng liên tiếp... Ánh trăng trong vườn sáng hơn hẳn tối nay, như thể thiên nhiên đang khen thưởng sự bền bỉ của ngươi.\"*",
      "*\"Nàng Tiên ghi lại ngày này vào cuốn sách của Linh Địa: 'Người tu luyện kiên trì 14 ngày — linh lực trong người đang dần ổn định thành đạo cơ.'\"*",
    ],
  },
  {
    min: 7,
    loi: [
      "*\"Bảy ngày — một tuần hoàn chỉnh. Nàng Tiên gật đầu: 'Vận hành một tuần không ngừng nghỉ, linh khí trong người đã bắt đầu tạo thành chu kỳ riêng~'\"*",
      "*\"Ánh trăng rằm soi rọi vườn tươi tốt của ngươi — bảy ngày chăm chỉ đã tạo nên điều này. Tiếp tục đi, phía trước còn nhiều điều hơn thế.\"*",
      "*\"Nàng Tiên thì thầm: 'Bảy ngày... đủ để hạt giống đâm mầm, đủ để thói quen thành bản năng. Ngươi đang đi đúng đường rồi.'\"*",
    ],
  },
  {
    min: 3,
    loi: [
      "*\"Ba ngày liên tiếp — Nàng Tiên nhẹ nhàng đặt một bông hoa lên vai bạn: 'Thói quen tốt đẹp đang hình thành... Đừng để nó đứt gãy nhé~'\"*",
      "*\"Vườn cây xanh hơn một chút sau ba ngày được chăm sóc — thiên nhiên luôn ghi nhớ sự kiên trì dù nhỏ bé.\"*",
      "*\"Nàng Tiên mỉm cười: 'Ba ngày rồi đó... Chút nữa thôi, ngươi sẽ không thể ngừng lại được đâu — đây là điều kỳ diệu của vườn Twilight.'\"*",
    ],
  },
  {
    min: 1,
    loi: [
      "*\"Linh khí buổi sáng thanh tịnh nhất — hãy tận dụng tốt ngày hôm nay~\"*",
      "*\"Mỗi ngày tu luyện, khu vườn thêm phần linh thiêng...\"*",
      "*\"Nàng Tiên Twilight gật đầu hài lòng trước sự kiên trì của ngươi~\"*",
      "*\"Ánh hoàng hôn buông xuống, một ngày mới đầy linh khí bắt đầu!\"*",
      "*\"Nàng Tiên thì thầm: 'Chào buổi sáng... Vườn cây đang nhớ ngươi đó.'\"*",
      "*\"Hôm nay lại là một ngày mới trong Linh Địa Twilight — và ngươi đã không bỏ lỡ nó.\"*",
    ],
  },
];

export function layLoiDiemDanh(streak: number): string {
  const nhom = loiDiemDanh.find((n) => streak >= n.min) ?? loiDiemDanh[loiDiemDanh.length - 1];
  return nhom.loi[Math.floor(Math.random() * nhom.loi.length)];
}

export function layLoiLenCap(cap: number): { tieuDe: string; moTa: string } {
  return loiLenCap[cap] ?? {
    tieuDe: `🎉 Lên Cấp ${cap}!`,
    moTa: "*Nàng Tiên Twilight ban thêm đất thiêng cho người xứng đáng!*\n\n\"Linh Địa mở rộng theo sức mạnh tu luyện của ngươi! 🌿\"",
  };
}

export function layLoiThoaiNgauNhien(loai: keyof typeof loi_thoai): string {
  const arr = loi_thoai[loai];
  return arr[Math.floor(Math.random() * arr.length)];
}
