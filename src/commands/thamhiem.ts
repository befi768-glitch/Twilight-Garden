import { Message, EmbedBuilder } from "discord.js";
import { layHoacTaoNguoiChoi, congXuVaKinhNghiem, themVaoTuiDo } from "../database/queries";
import { db } from "../database/db";
import { nguoiChoi } from "../database/schema";
import { eq } from "drizzle-orm";
import { danhSachCay, layHatGiongId } from "../data/plants";
import { MAU_CHINH, MAU_DO, MAU_VANG, MAU_XANH, MAU_XAM, formatXu, formatThoiGian } from "../utils/helpers";

const COOLDOWN_PHUT = 120; // 2 tiếng

export interface DiaDiem {
  id: string;
  ten: string;
  emoji: string;
  moTa: string;
  mauEmbed: number;
  capToiThieu: number; // cấp tối thiểu để vào
  phanThuong: PhanThuongDiaDiem[];
}

interface PhanThuongDiaDiem {
  trong_so: number; // weight cho random
  loai: "xu" | "hat_giong" | "vat_pham_dac_biet" | "that_bai";
  moTa: string;
  emoji: string;
  xuMin?: number;
  xuMax?: number;
  cayId?: string;
  soLuongMin?: number;
  soLuongMax?: number;
  kinhNghiem?: number;
}

export const danhSachDiaDiem: DiaDiem[] = [
  {
    id: "rung_co_linh",
    ten: "Rừng Cổ Linh",
    emoji: "🌲",
    moTa: "Rừng già nghìn năm ẩn chứa linh khí đất, nơi linh thảo mọc tự nhiên không cần gieo trồng",
    mauEmbed: 0x27ae60,
    capToiThieu: 1,
    phanThuong: [
      { trong_so: 30, loai: "hat_giong", emoji: "🌱", moTa: "Tìm được hạt giống Hoàng Căn", cayId: "hoang_can", soLuongMin: 2, soLuongMax: 4, kinhNghiem: 10 },
      { trong_so: 25, loai: "hat_giong", emoji: "🍅", moTa: "Nhặt được hạt giống Hỏa Châu", cayId: "hoa_chau", soLuongMin: 1, soLuongMax: 3, kinhNghiem: 15 },
      { trong_so: 20, loai: "xu", emoji: "💠", moTa: "Nhặt được túi Nguyệt Thạch bỏ quên", xuMin: 50, xuMax: 200, kinhNghiem: 8 },
      { trong_so: 15, loai: "hat_giong", emoji: "🌽", moTa: "Phát hiện bụi Kim Tuệ hoang dã!", cayId: "kim_tue", soLuongMin: 1, soLuongMax: 2, kinhNghiem: 20 },
      { trong_so: 10, loai: "that_bai", emoji: "🌫️", moTa: "Lạc trong sương mù linh khí, quay về tay không", kinhNghiem: 5 },
    ],
  },
  {
    id: "linh_son_dinh",
    ten: "Linh Sơn Đỉnh",
    emoji: "🏔️",
    moTa: "Đỉnh núi thiêng nơi mây mù bao phủ quanh năm, linh thú ẩn náu và báu vật chờ kẻ dũng cảm",
    mauEmbed: 0x8e44ad,
    capToiThieu: 2,
    phanThuong: [
      { trong_so: 25, loai: "xu", emoji: "💠", moTa: "Tìm được hang linh thú bỏ hoang chứa Nguyệt Thạch", xuMin: 200, xuMax: 600, kinhNghiem: 20 },
      { trong_so: 22, loai: "hat_giong", emoji: "🍓", moTa: "Thu được hạt Huyết Mai mọc trên vách đá", cayId: "huyet_mai", soLuongMin: 1, soLuongMax: 2, kinhNghiem: 25 },
      { trong_so: 18, loai: "hat_giong", emoji: "🍄", moTa: "Phát hiện Linh Chi Cổ mọc trong kẽ đá!", cayId: "linh_chi", soLuongMin: 1, soLuongMax: 2, kinhNghiem: 30 },
      { trong_so: 20, loai: "xu", emoji: "💎", moTa: "Nhặt được linh thạch rơi vãi từ trên cao", xuMin: 150, xuMax: 400, kinhNghiem: 15 },
      { trong_so: 15, loai: "that_bai", emoji: "⚡", moTa: "Bị sét linh đánh trúng, bàng hoàng bỏ chạy về", kinhNghiem: 8 },
    ],
  },
  {
    id: "huyen_hai_bo",
    ten: "Huyền Hải Bờ",
    emoji: "🌊",
    moTa: "Bờ biển huyền bí nơi sóng mang theo linh khí từ đáy đại dương vô tận",
    mauEmbed: 0x2980b9,
    capToiThieu: 3,
    phanThuong: [
      { trong_so: 25, loai: "hat_giong", emoji: "🌻", moTa: "Sóng dạt vào bờ một hạt Nhật Thần Hoa hiếm", cayId: "nhat_hoa", soLuongMin: 1, soLuongMax: 2, kinhNghiem: 35 },
      { trong_so: 20, loai: "xu", emoji: "🐚", moTa: "Vớt được túi vàng chìm từ thuyền buôn đắm xưa", xuMin: 400, xuMax: 1200, kinhNghiem: 25 },
      { trong_so: 20, loai: "hat_giong", emoji: "🍓", moTa: "Thu được Huyết Mai cuốn theo dòng hải lưu", cayId: "huyet_mai", soLuongMin: 2, soLuongMax: 3, kinhNghiem: 25 },
      { trong_so: 20, loai: "xu", emoji: "💠", moTa: "Tìm thấy hang san hô ẩn chứa Nguyệt Thạch", xuMin: 300, xuMax: 900, kinhNghiem: 20 },
      { trong_so: 15, loai: "that_bai", emoji: "🦑", moTa: "Bị linh mực khổng lồ đuổi, tháo chạy về tay không", kinhNghiem: 10 },
    ],
  },
  {
    id: "phe_tich_dan_lo",
    ten: "Phế Tích Đan Lò",
    emoji: "⚗️",
    moTa: "Tàn tích của lò luyện đan ngàn năm trước, linh khí đan dược còn phảng phất trong không trung",
    mauEmbed: 0xe67e22,
    capToiThieu: 4,
    phanThuong: [
      { trong_so: 25, loai: "hat_giong", emoji: "🍄‍🟫", moTa: "Tìm được Ám Nguyệt Nấm mọc trong lò đan bỏ hoang!", cayId: "am_linh_chi", soLuongMin: 1, soLuongMax: 1, kinhNghiem: 60 },
      { trong_so: 22, loai: "xu", emoji: "💎", moTa: "Khai quật được kho báu của đan sư cổ đại", xuMin: 800, xuMax: 2500, kinhNghiem: 40 },
      { trong_so: 20, loai: "hat_giong", emoji: "🌻", moTa: "Nhặt được hạt Nhật Thần Hoa ủ trong lò cũ", cayId: "nhat_hoa", soLuongMin: 1, soLuongMax: 2, kinhNghiem: 35 },
      { trong_so: 18, loai: "xu", emoji: "🔮", moTa: "Thu được tàn dư linh khí đan lò quy đổi thành Nguyệt Thạch", xuMin: 500, xuMax: 1500, kinhNghiem: 30 },
      { trong_so: 15, loai: "that_bai", emoji: "💥", moTa: "Vô tình kích hoạt bẫy cổ, may mắn thoát thân về không", kinhNghiem: 15 },
    ],
  },
  {
    id: "thien_nhai_binh",
    ten: "Thiên Nhai Bình",
    emoji: "🌌",
    moTa: "Cao nguyên nơi đất trời giao hòa, linh khí đặc quánh đến mức có thể cầm nắm được — nguy hiểm tột cùng",
    mauEmbed: 0x1a1a2e,
    capToiThieu: 6,
    phanThuong: [
      { trong_so: 20, loai: "hat_giong", emoji: "🌸", moTa: "✨ Phát hiện Nguyệt Dạ Lan nở dưới ánh hoàng hôn Thiên Nhai!", cayId: "hoa_twilight", soLuongMin: 1, soLuongMax: 1, kinhNghiem: 200 },
      { trong_so: 22, loai: "hat_giong", emoji: "🍄‍🟫", moTa: "Tìm thấy Ám Nguyệt Nấm mọc từ tinh khí đất thiêng", cayId: "am_linh_chi", soLuongMin: 1, soLuongMax: 2, kinhNghiem: 80 },
      { trong_so: 23, loai: "xu", emoji: "🌟", moTa: "Ngưng tụ linh khí trời đất thành Nguyệt Thạch thuần túy", xuMin: 2000, xuMax: 6000, kinhNghiem: 60 },
      { trong_so: 20, loai: "xu", emoji: "⚡", moTa: "Thu thập sét linh quy đổi thành năng lượng Nguyệt Thạch", xuMin: 1000, xuMax: 3000, kinhNghiem: 45 },
      { trong_so: 15, loai: "that_bai", emoji: "🌪️", moTa: "Bị gió linh Thiên Nhai cuốn bay, hồi phục lại sau một hồi", kinhNghiem: 20 },
    ],
  },
];

function chonPhanThuong(ds: PhanThuongDiaDiem[]): PhanThuongDiaDiem {
  const tongTrongSo = ds.reduce((sum, p) => sum + p.trong_so, 0);
  let ran = Math.random() * tongTrongSo;
  for (const p of ds) {
    ran -= p.trong_so;
    if (ran <= 0) return p;
  }
  return ds[ds.length - 1];
}

export async function xuLyThamHiem(message: Message, args: string[]) {
  if (!message.guildId) return;
  const player = await layHoacTaoNguoiChoi(message.author.id, message.guildId);

  const sub = args[0]?.toLowerCase();

  // ─── HIỂN THỊ DANH SÁCH ĐỊA ĐIỂM ───────────────────────────────────────────
  if (!sub || sub === "ds" || sub === "danhsach" || sub === "list") {
    const dsDienTa = danhSachDiaDiem.map((d) => {
      const locked = player.capDo < d.capToiThieu;
      const lockText = locked ? ` *(Cần cấp ${d.capToiThieu})*` : "";
      return `${locked ? "🔒" : d.emoji} **${d.ten}**${lockText}\n┗ *${d.moTa.slice(0, 60)}...*`;
    });

    const embed = new EmbedBuilder()
      .setColor(MAU_CHINH)
      .setTitle("🗺️ Bản Đồ Thám Hiểm — Twilight Garden")
      .setDescription(
        `*"Nàng Tiên trải bản đồ cổ ra: 'Vùng đất nào ngươi muốn khám phá hôm nay~?'"*\n\n` +
        dsDienTa.join("\n\n")
      )
      .addFields({
        name: "📖 Cách dùng",
        value:
          "`.thamhiem <tên địa điểm>` — Bắt đầu thám hiểm\n" +
          "`.thamhiem rungcolinh` • `.thamhiem linhson` • `.thamhiem huyenhai`\n" +
          "`.thamhiem phetich` • `.thamhiem thiennhai` *(Cần cấp 6)*",
      })
      .setFooter({ text: `⏳ Cooldown: ${COOLDOWN_PHUT / 60} tiếng sau mỗi lần thám hiểm • Cấp bạn: ${player.capDo}` });

    return message.reply({ embeds: [embed] });
  }

  // ─── TÌM ĐỊA ĐIỂM ────────────────────────────────────────────────────────────
  const aliasMap: Record<string, string> = {
    rungcolinh: "rung_co_linh", rung: "rung_co_linh", forest: "rung_co_linh",
    linhson: "linh_son_dinh", linhsondinh: "linh_son_dinh", mountain: "linh_son_dinh",
    huyenhai: "huyen_hai_bo", biển: "huyen_hai_bo", sea: "huyen_hai_bo",
    phetich: "phe_tich_dan_lo", danlo: "phe_tich_dan_lo", ruins: "phe_tich_dan_lo",
    thiennhai: "thien_nhai_binh", thienhai: "thien_nhai_binh", heaven: "thien_nhai_binh",
  };

  const query = args.join("").toLowerCase().replace(/\s/g, "");
  const diaDiemId = aliasMap[query] ?? query;
  const diaDiem = danhSachDiaDiem.find((d) => d.id === diaDiemId);

  if (!diaDiem) {
    return message.reply(
      `❌ Không tìm thấy địa điểm **"${args.join(" ")}"**!\n` +
      `Dùng \`.thamhiem\` để xem danh sách địa điểm.`
    );
  }

  // ─── KIỂM TRA CẤP ────────────────────────────────────────────────────────────
  if (player.capDo < diaDiem.capToiThieu) {
    const embed = new EmbedBuilder()
      .setColor(MAU_DO)
      .setTitle("🔒 Chưa Đủ Tu Vi!")
      .setDescription(
        `*Nàng Tiên lắc đầu: "Tu vi của ngươi chưa đủ để bước vào ${diaDiem.emoji} **${diaDiem.ten}**..."*\n\n` +
        `Yêu cầu: **Cấp ${diaDiem.capToiThieu}** — Cấp hiện tại của bạn: **Cấp ${player.capDo}**`
      );
    return message.reply({ embeds: [embed] });
  }

  // ─── KIỂM TRA COOLDOWN ────────────────────────────────────────────────────────
  const cdRow = await db.execute<{ thamhiem_cooldown: string | null }>(
    `SELECT thamhiem_cooldown FROM nguoi_choi WHERE id = ${player.id}`
  );
  const cdLuc = cdRow.rows[0]?.thamhiem_cooldown ? new Date(cdRow.rows[0].thamhiem_cooldown) : null;
  const bayGio = new Date();

  if (cdLuc && bayGio < cdLuc) {
    const conLai = cdLuc.getTime() - bayGio.getTime();
    const embed = new EmbedBuilder()
      .setColor(MAU_XAM)
      .setTitle("⏳ Đang Hồi Phục Sau Chuyến Đi")
      .setDescription(
        `*"Ngươi vừa trở về từ chuyến thám hiểm... cần nghỉ ngơi thêm một chút nữa~"*\n\n` +
        `**Còn lại:** <t:${Math.floor(cdLuc.getTime() / 1000)}:R>`
      );
    return message.reply({ embeds: [embed] });
  }

  // ─── THÁM HIỂM ──────────────────────────────────────────────────────────────
  const phanThuong = chonPhanThuong(diaDiem.phanThuong);

  // Cập nhật cooldown
  const thoiGianHoiPhuc = new Date(bayGio.getTime() + COOLDOWN_PHUT * 60 * 1000);
  await db.execute(
    `UPDATE nguoi_choi SET thamhiem_cooldown = '${thoiGianHoiPhuc.toISOString()}' WHERE id = ${player.id}`
  );

  // Cộng kinh nghiệm cơ bản
  let moTaKetQua = "";
  let xuNhan = 0;

  if (phanThuong.loai === "xu") {
    xuNhan = Math.floor(phanThuong.xuMin! + Math.random() * (phanThuong.xuMax! - phanThuong.xuMin!));
    await congXuVaKinhNghiem(player.id, xuNhan, phanThuong.kinhNghiem ?? 0);
    moTaKetQua = `${phanThuong.emoji} ${phanThuong.moTa}\n\n💠 Nhận **${formatXu(xuNhan)}** Nguyệt Thạch!`;
  } else if (phanThuong.loai === "hat_giong" && phanThuong.cayId) {
    const soLuong = Math.floor(
      phanThuong.soLuongMin! + Math.random() * (phanThuong.soLuongMax! - phanThuong.soLuongMin! + 1)
    );
    const hatId = layHatGiongId(phanThuong.cayId);
    await themVaoTuiDo(player.id, hatId, soLuong);
    await congXuVaKinhNghiem(player.id, 0, phanThuong.kinhNghiem ?? 0);
    const cay = danhSachCay.find((c) => c.id === phanThuong.cayId);
    moTaKetQua =
      `${phanThuong.emoji} ${phanThuong.moTa}\n\n` +
      `🌱 Nhận **${soLuong}x Hạt ${cay?.ten ?? phanThuong.cayId}** vào Bảo Nang!`;
  } else {
    // Thất bại
    await congXuVaKinhNghiem(player.id, 0, phanThuong.kinhNghiem ?? 0);
    moTaKetQua = `${phanThuong.emoji} ${phanThuong.moTa}`;
  }

  const mauEmbed = phanThuong.loai === "that_bai" ? MAU_XAM : diaDiem.mauEmbed;

  const embed = new EmbedBuilder()
    .setColor(mauEmbed)
    .setTitle(
      phanThuong.loai === "that_bai"
        ? `${diaDiem.emoji} Thám Hiểm ${diaDiem.ten} — Xui Rồi!`
        : `${diaDiem.emoji} Thám Hiểm ${diaDiem.ten} — Thành Công!`
    )
    .setDescription(
      `*"${moTaKhiDen(diaDiem)}"*\n\n` + moTaKetQua
    )
    .addFields({
      name: "✨ Linh Lực Nhận Được",
      value: `+${phanThuong.kinhNghiem ?? 0} Linh Lực`,
      inline: true,
    })
    .setFooter({ text: `⏳ Thám hiểm tiếp theo: ${COOLDOWN_PHUT / 60} tiếng nữa` })
    .setTimestamp();

  return message.reply({ embeds: [embed] });
}

function moTaKhiDen(dd: DiaDiem): string {
  const loiThoai: Record<string, string[]> = {
    rung_co_linh: [
      "Bước chân vào rừng cổ thụ, linh khí đất thấm vào từng hơi thở...",
      "Tiếng lá rì rào như lời thì thầm của vạn linh thảo ngàn năm...",
      "Rừng già ẩn hiện trong sương mù, nơi thiên nhiên còn giữ nguyên vẹn linh khí nguyên thủy...",
    ],
    linh_son_dinh: [
      "Leo lên đỉnh Linh Sơn, gió mạnh hú vang, linh khí cuồn cuộn như thác lũ...",
      "Đỉnh núi chìm trong mây trắng, cảm giác như đang đứng giữa thiên đình...",
      "Từng bước leo lên, cảm nhận linh khí đất trời ngày càng đặc quánh hơn...",
    ],
    huyen_hai_bo: [
      "Sóng biển vỗ nhẹ vào bờ, mỗi con sóng mang theo linh khí từ đáy huyền hải...",
      "Ánh bạc của mặt nước chiếu lên khuôn mặt, linh khí biển làm tâm trí thanh thản...",
      "Huyền Hải vào buổi chiều tà — sóng nước huyền bí như che giấu kho báu vô tận...",
    ],
    phe_tich_dan_lo: [
      "Dấu tích của lò đan ngàn năm vẫn còn đây, linh khí đan dược phảng phất trong không khí...",
      "Những mảnh tường cổ kính, vết tích của đan sư thời xưa còn in hằn trên đá...",
      "Phế tích im lặng nhưng linh khí vẫn dày đặc — cảm giác như chủ nhân cũ chưa rời đi hoàn toàn...",
    ],
    thien_nhai_binh: [
      "Thiên Nhai Bình — nơi đất trời giao hòa. Mỗi hơi thở như uống nguyên linh khí của cả vũ trụ...",
      "Từ cao nguyên này, nhìn xuống cả Twilight Garden như một bức tranh thu nhỏ trong tay...",
      "Gió linh Thiên Nhai thổi qua, mang theo tiếng vang từ tầng cao nhất của thế giới tu tiên...",
    ],
  };
  const arr = loiThoai[dd.id] ?? ["Chuyến thám hiểm bắt đầu..."];
  return arr[Math.floor(Math.random() * arr.length)];
}
