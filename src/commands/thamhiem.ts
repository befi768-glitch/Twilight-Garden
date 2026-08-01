import { Message, EmbedBuilder } from "discord.js";
import { layHoacTaoNguoiChoi, congXuVaKinhNghiem, themVaoTuiDo, truXu } from "../database/queries";
import { db } from "../database/db";
import { danhSachCay, layHatGiongId } from "../data/plants";
import { petMap, layBonusThamHiem } from "../data/pets";
import { vatPhamMap } from "../data/vatPhamDacBiet";
import { MAU_CHINH, MAU_DO, MAU_XAM, formatXu } from "../utils/helpers";

const COOLDOWN_PHUT = 120; // 2 tiếng
const TY_LE_LOOT_CAY = 0.05; // Loot hạt giống chỉ có 5% mỗi chuyến
const TY_LE_LOOT_LINH_TINH = 0.01; // Loot Linh Tinh chỉ có 1% mỗi chuyến

interface PhanThuong {
  trong_so: number;
  loai: "xu" | "hat_giong" | "linh_tinh" | "that_bai" | "bat_loi";
  emoji: string;
  moTa: string;
  xuMin?: number;
  xuMax?: number;
  cayId?: string;       // cho hat_giong
  linhTinhId?: string;  // cho linh_tinh
  soLuongMin?: number;
  soLuongMax?: number;
  kinhNghiem?: number;
  matXuMin?: number;
  matXuMax?: number;
}

interface DiaDiem {
  id: string;
  ten: string;
  emoji: string;
  moTa: string;
  mauEmbed: number;
  capToiThieu: number;
  linhTinhId: string;     // Linh Tinh đặc trưng của địa điểm này
  phanThuong: PhanThuong[];
}

const danhSachDiaDiem: DiaDiem[] = [
  {
    id: "rung_co_linh",
    ten: "Rừng Cổ Linh",
    emoji: "🌲",
    moTa: "Rừng già nghìn năm ẩn chứa linh khí đất, nơi linh thảo mọc tự nhiên",
    mauEmbed: 0x27ae60,
    capToiThieu: 1,
    linhTinhId: "linh_tinh_rung",
    phanThuong: [
      { trong_so: 30, loai: "hat_giong", emoji: "🌱", moTa: "Tìm được hạt Hoàng Căn trong đất", cayId: "hoang_can", soLuongMin: 2, soLuongMax: 4, kinhNghiem: 10 },
      { trong_so: 25, loai: "hat_giong", emoji: "🍅", moTa: "Nhặt được hạt Hỏa Châu hoang dã", cayId: "hoa_chau", soLuongMin: 1, soLuongMax: 3, kinhNghiem: 15 },
      { trong_so: 20, loai: "xu", emoji: "💠", moTa: "Nhặt được túi Nguyệt Thạch bỏ quên", xuMin: 50, xuMax: 200, kinhNghiem: 8 },
      { trong_so: 15, loai: "hat_giong", emoji: "🌽", moTa: "Phát hiện bụi Kim Tuệ hoang dã", cayId: "kim_tue", soLuongMin: 1, soLuongMax: 2, kinhNghiem: 20 },
      { trong_so: 10, loai: "that_bai", emoji: "🌫️", moTa: "Lạc trong sương mù linh khí, quay về tay không", kinhNghiem: 5 },
      { trong_so: 10, loai: "bat_loi", emoji: "🕸️", moTa: "Dẫm phải bẫy dây leo, đánh rơi một phần Nguyệt Thạch", matXuMin: 20, matXuMax: 60, kinhNghiem: 2 },
    ],
  },
  {
    id: "linh_son_dinh",
    ten: "Linh Sơn Đỉnh",
    emoji: "🏔️",
    moTa: "Đỉnh núi thiêng nơi mây mù bao phủ quanh năm, linh thú ẩn náu",
    mauEmbed: 0x8e44ad,
    capToiThieu: 2,
    linhTinhId: "linh_tinh_son",
    phanThuong: [
      { trong_so: 25, loai: "xu", emoji: "💠", moTa: "Tìm được hang linh thú bỏ hoang chứa Nguyệt Thạch", xuMin: 200, xuMax: 600, kinhNghiem: 20 },
      { trong_so: 22, loai: "hat_giong", emoji: "🍓", moTa: "Thu được hạt Huyết Mai mọc trên vách đá", cayId: "huyet_mai", soLuongMin: 1, soLuongMax: 2, kinhNghiem: 25 },
      { trong_so: 18, loai: "hat_giong", emoji: "🍄", moTa: "Phát hiện Linh Chi Cổ mọc trong kẽ đá", cayId: "linh_chi", soLuongMin: 1, soLuongMax: 2, kinhNghiem: 30 },
      { trong_so: 20, loai: "xu", emoji: "💎", moTa: "Nhặt được linh thạch rơi vãi từ trên cao", xuMin: 150, xuMax: 400, kinhNghiem: 15 },
      { trong_so: 15, loai: "that_bai", emoji: "⚡", moTa: "Bị sét linh đánh trúng, bàng hoàng bỏ chạy", kinhNghiem: 8 },
      { trong_so: 10, loai: "bat_loi", emoji: "🪨", moTa: "Trượt chân trên vách đá, đánh rơi một phần Nguyệt Thạch", matXuMin: 80, matXuMax: 180, kinhNghiem: 3 },
    ],
  },
  {
    id: "huyen_hai_bo",
    ten: "Huyền Hải Bờ",
    emoji: "🌊",
    moTa: "Bờ biển huyền bí nơi sóng mang theo linh khí từ đáy đại dương",
    mauEmbed: 0x2980b9,
    capToiThieu: 3,
    linhTinhId: "linh_tinh_hai",
    phanThuong: [
      { trong_so: 25, loai: "hat_giong", emoji: "🌻", moTa: "Sóng dạt vào bờ một hạt Nhật Thần Hoa", cayId: "nhat_hoa", soLuongMin: 1, soLuongMax: 2, kinhNghiem: 35 },
      { trong_so: 20, loai: "xu", emoji: "🐚", moTa: "Vớt được túi vàng chìm từ thuyền buôn đắm", xuMin: 400, xuMax: 1200, kinhNghiem: 25 },
      { trong_so: 20, loai: "hat_giong", emoji: "🍓", moTa: "Thu được Huyết Mai cuốn theo dòng hải lưu", cayId: "huyet_mai", soLuongMin: 2, soLuongMax: 3, kinhNghiem: 25 },
      { trong_so: 20, loai: "xu", emoji: "💠", moTa: "Tìm thấy hang san hô ẩn chứa Nguyệt Thạch", xuMin: 300, xuMax: 900, kinhNghiem: 20 },
      { trong_so: 15, loai: "that_bai", emoji: "🦑", moTa: "Bị linh mực khổng lồ đuổi, tháo chạy về", kinhNghiem: 10 },
      { trong_so: 10, loai: "bat_loi", emoji: "🌊", moTa: "Một cơn sóng dữ cuốn mất một phần Nguyệt Thạch", matXuMin: 150, matXuMax: 350, kinhNghiem: 4 },
    ],
  },
  {
    id: "phe_tich_dan_lo",
    ten: "Phế Tích Đan Lò",
    emoji: "⚗️",
    moTa: "Tàn tích của lò luyện đan ngàn năm, linh khí đan dược còn phảng phất",
    mauEmbed: 0xe67e22,
    capToiThieu: 4,
    linhTinhId: "linh_tinh_tich",
    phanThuong: [
      { trong_so: 25, loai: "hat_giong", emoji: "🍄‍🟫", moTa: "Tìm được Ám Nguyệt Nấm trong lò đan bỏ hoang", cayId: "am_linh_chi", soLuongMin: 1, soLuongMax: 1, kinhNghiem: 60 },
      { trong_so: 22, loai: "xu", emoji: "💎", moTa: "Khai quật được kho báu của đan sư cổ đại", xuMin: 800, xuMax: 2500, kinhNghiem: 40 },
      { trong_so: 20, loai: "hat_giong", emoji: "🌻", moTa: "Nhặt được hạt Nhật Thần Hoa ủ trong lò cũ", cayId: "nhat_hoa", soLuongMin: 1, soLuongMax: 2, kinhNghiem: 35 },
      { trong_so: 18, loai: "xu", emoji: "🔮", moTa: "Thu được tàn dư linh khí đan lò quy đổi thành Nguyệt Thạch", xuMin: 500, xuMax: 1500, kinhNghiem: 30 },
      { trong_so: 15, loai: "that_bai", emoji: "💥", moTa: "Vô tình kích hoạt bẫy cổ, may mắn thoát thân", kinhNghiem: 15 },
      { trong_so: 10, loai: "bat_loi", emoji: "🔥", moTa: "Bẫy đan hỏa bùng lên, thiêu mất một phần Nguyệt Thạch", matXuMin: 300, matXuMax: 700, kinhNghiem: 5 },
    ],
  },
  {
    id: "thien_nhai_binh",
    ten: "Thiên Nhai Bình",
    emoji: "🌌",
    moTa: "Cao nguyên nơi đất trời giao hòa, linh khí đặc quánh — nguy hiểm tột cùng",
    mauEmbed: 0x1a1a2e,
    capToiThieu: 6,
    linhTinhId: "linh_tinh_thien",
    phanThuong: [
      { trong_so: 20, loai: "hat_giong", emoji: "🌸", moTa: "✨ Phát hiện Nguyệt Dạ Lan nở dưới ánh hoàng hôn!", cayId: "hoa_twilight", soLuongMin: 1, soLuongMax: 1, kinhNghiem: 200 },
      { trong_so: 22, loai: "hat_giong", emoji: "🍄‍🟫", moTa: "Tìm thấy Ám Nguyệt Nấm từ tinh khí đất thiêng", cayId: "am_linh_chi", soLuongMin: 1, soLuongMax: 2, kinhNghiem: 80 },
      { trong_so: 23, loai: "xu", emoji: "🌟", moTa: "Ngưng tụ linh khí trời đất thành Nguyệt Thạch", xuMin: 2000, xuMax: 6000, kinhNghiem: 60 },
      { trong_so: 20, loai: "xu", emoji: "⚡", moTa: "Thu thập sét linh quy đổi thành Nguyệt Thạch", xuMin: 1000, xuMax: 3000, kinhNghiem: 45 },
      { trong_so: 15, loai: "that_bai", emoji: "🌪️", moTa: "Bị gió linh Thiên Nhai cuốn bay, may mắn thoát về", kinhNghiem: 20 },
      { trong_so: 10, loai: "bat_loi", emoji: "🌑", moTa: "Linh áp nghiền nát túi đồ, đánh rơi một phần Nguyệt Thạch", matXuMin: 600, matXuMax: 1400, kinhNghiem: 8 },
    ],
  },
];

const aliasMap: Record<string, string> = {
  rungcolinh: "rung_co_linh", rung: "rung_co_linh", forest: "rung_co_linh",
  linhson: "linh_son_dinh", linhsondinh: "linh_son_dinh", mountain: "linh_son_dinh",
  huyenhai: "huyen_hai_bo", biển: "huyen_hai_bo", sea: "huyen_hai_bo",
  phetich: "phe_tich_dan_lo", danlo: "phe_tich_dan_lo", ruins: "phe_tich_dan_lo",
  thiennhai: "thien_nhai_binh", thienhai: "thien_nhai_binh", heaven: "thien_nhai_binh",
};

function chonPhanThuong(ds: PhanThuong[]): PhanThuong {
  const hatGiong = ds.filter((p) => p.loai === "hat_giong");
  const khongHatGiong = ds.filter((p) => p.loai !== "hat_giong");

  // Không để trọng số của nhiều loại hạt cộng dồn thành tỷ lệ loot cây cao.
  // Trước hết kiểm tra đúng 5% cho cả nhóm hạt, sau đó mới dùng trọng số
  // để chọn loại hạt cụ thể hoặc kết quả không phải hạt.
  const nhomPhanThuong = Math.random() < TY_LE_LOOT_CAY ? hatGiong : khongHatGiong;
  const tong = nhomPhanThuong.reduce((s, p) => s + p.trong_so, 0);
  let r = Math.random() * tong;
  for (const p of nhomPhanThuong) { r -= p.trong_so; if (r <= 0) return p; }
  return nhomPhanThuong[nhomPhanThuong.length - 1];
}

export async function xuLyThamHiem(message: Message, args: string[]) {
  if (!message.guildId) return;
  const player = await layHoacTaoNguoiChoi(message.author.id, message.guildId);
  const sub = args[0]?.toLowerCase();

  // ─── DANH SÁCH ────────────────────────────────────────────────────────────────
  if (!sub || sub === "ds" || sub === "danhsach" || sub === "list") {
    const dsDienTa = danhSachDiaDiem.map((d) => {
      const locked = player.capDo < d.capToiThieu;
      const linhTinh = vatPhamMap.get(d.linhTinhId)!;
      return (
        `${locked ? "🔒" : d.emoji} **${d.ten}**${locked ? ` *(Cần cấp ${d.capToiThieu})*` : ""}\n` +
        `┗ *${d.moTa}*\n` +
        `┗ 🧬 Linh Tinh: ${linhTinh.emoji} **${linhTinh.ten}** — dùng trong Luyện Đan`
      );
    });
    const embed = new EmbedBuilder()
      .setColor(MAU_CHINH)
      .setTitle("🗺️ Bản Đồ Thám Hiểm — Twilight Garden")
      .setDescription(
        `*"Nàng Tiên trải bản đồ cổ ra: 'Vùng đất nào ngươi muốn khám phá~?'"*\n\n` +
        dsDienTa.join("\n\n")
      )
      .addFields(
        { name: "📖 Cách dùng", value: "`.thamhiem <tên>` — VD: `.thamhiem rungcolinh`\n`.thamhiem linhson` • `.thamhiem huyenhai` • `.thamhiem phetich` • `.thamhiem thiennhai`" },
        { name: "🎲 Tỷ lệ & rủi ro", value: "🌱 Hạt giống: **5% mỗi chuyến**\n🧬 Linh Tinh: **1% mỗi chuyến**\n⚠️ Có thể gặp thất bại hoặc mất Nguyệt Thạch." },
      )
      .setFooter({ text: `⏳ Cooldown 2 tiếng • 🌱 Hạt giống 5% • 🧬 Linh Tinh 1% • 🐾 Pet → thêm loot` });
    return message.reply({ embeds: [embed] });
  }

  // ─── TÌM ĐỊA ĐIỂM ────────────────────────────────────────────────────────────
  const query = args.join("").toLowerCase().replace(/\s/g, "");
  const diaDiemId = aliasMap[query] ?? query;
  const diaDiem = danhSachDiaDiem.find((d) => d.id === diaDiemId);
  if (!diaDiem) {
    return message.reply(`❌ Không tìm thấy địa điểm **"${args.join(" ")}"**!\nDùng \`.thamhiem\` để xem bản đồ.`);
  }

  if (player.capDo < diaDiem.capToiThieu) {
    return message.reply({
      embeds: [new EmbedBuilder().setColor(MAU_DO).setTitle("🔒 Chưa Đủ Tu Vi!")
        .setDescription(`*Cần **Cấp ${diaDiem.capToiThieu}** để vào ${diaDiem.emoji} **${diaDiem.ten}** — cấp bạn: Cấp ${player.capDo}*`)],
    });
  }

  // ─── COOLDOWN ────────────────────────────────────────────────────────────────
  const cdRow = await db.execute<{ thamhiem_cooldown: string | null }>(
    `SELECT thamhiem_cooldown FROM nguoi_choi WHERE id = ${player.id}`
  );
  const cdLuc = cdRow.rows[0]?.thamhiem_cooldown ? new Date(cdRow.rows[0].thamhiem_cooldown) : null;
  const bayGio = new Date();
  if (cdLuc && bayGio < cdLuc) {
    return message.reply({
      embeds: [new EmbedBuilder().setColor(MAU_XAM).setTitle("⏳ Đang Hồi Phục")
        .setDescription(`*"Ngươi cần nghỉ ngơi thêm một chút~"*\n**Đi tiếp:** <t:${Math.floor(cdLuc.getTime() / 1000)}:R>`)],
    });
  }

  // ─── LẤY THÔNG TIN PET & STREAK ──────────────────────────────────────────────
  const extraRow = await db.execute<{ pet_id: string | null }>(
    `SELECT pet_id FROM nguoi_choi WHERE id = ${player.id}`
  );
  const petId = extraRow.rows[0]?.pet_id ?? null;
  const pet = petId ? petMap.get(petId) : null;
  const bonusPet = layBonusThamHiem(petId); // % tăng xu

  // ─── THÁM HIỂM ───────────────────────────────────────────────────────────────
  const phanThuong = chonPhanThuong(diaDiem.phanThuong);

  // Cập nhật cooldown
  const moiCooldown = new Date(bayGio.getTime() + COOLDOWN_PHUT * 60 * 1000);
  await db.execute(`UPDATE nguoi_choi SET thamhiem_cooldown = '${moiCooldown.toISOString()}' WHERE id = ${player.id}`);

  // ── Thực hiện phần thưởng chính ──
  let moTaKetQua = "";
  let xuNhan = 0;
  let bonusText = "";

  if (phanThuong.loai === "xu") {
    xuNhan = Math.floor(phanThuong.xuMin! + Math.random() * (phanThuong.xuMax! - phanThuong.xuMin!));
    // Áp dụng bonus pet
    if (bonusPet > 0) {
      const bonusSo = Math.floor(xuNhan * bonusPet / 100);
      xuNhan += bonusSo;
      bonusText = `\n${pet!.emoji} *${pet!.ten} giúp tìm thêm +${bonusSo} 💠 (${bonusPet}%)*`;
    }
    await congXuVaKinhNghiem(player.id, xuNhan, phanThuong.kinhNghiem ?? 0);
    moTaKetQua = `${phanThuong.emoji} ${phanThuong.moTa}\n\n💠 Nhận **${formatXu(xuNhan)}** Nguyệt Thạch!${bonusText}`;
  } else if (phanThuong.loai === "hat_giong" && phanThuong.cayId) {
    let soLuong = Math.floor(phanThuong.soLuongMin! + Math.random() * (phanThuong.soLuongMax! - phanThuong.soLuongMin! + 1));
    // Bonus pet cho seed: thêm 1 hạt nếu pet tốt
    if (bonusPet >= 30 && Math.random() < bonusPet / 100) {
      soLuong += 1;
      bonusText = `\n${pet!.emoji} *${pet!.ten} moi thêm được 1 hạt giống nữa!*`;
    }
    await themVaoTuiDo(player.id, layHatGiongId(phanThuong.cayId), soLuong);
    await congXuVaKinhNghiem(player.id, 0, phanThuong.kinhNghiem ?? 0);
    const cay = danhSachCay.find((c) => c.id === phanThuong.cayId);
    moTaKetQua = `${phanThuong.emoji} ${phanThuong.moTa}\n\n🌱 Nhận **${soLuong}x Hạt ${cay?.ten ?? phanThuong.cayId}**!${bonusText}`;
  } else if (phanThuong.loai === "bat_loi") {
    const xuMat = Math.floor(phanThuong.matXuMin! + Math.random() * (phanThuong.matXuMax! - phanThuong.matXuMin! + 1));
    const daMatXu = await truXu(player.id, xuMat);
    await congXuVaKinhNghiem(player.id, 0, phanThuong.kinhNghiem ?? 0);
    moTaKetQua = daMatXu
      ? `${phanThuong.emoji} ${phanThuong.moTa}\n\n💸 Mất **${formatXu(xuMat)}** Nguyệt Thạch.`
      : `${phanThuong.emoji} ${phanThuong.moTa}\n\n💸 Túi đồ không đủ Nguyệt Thạch nên không mất thêm, nhưng chuyến đi đã thất bại.`;
  } else {
    // Thất bại
    await congXuVaKinhNghiem(player.id, 0, phanThuong.kinhNghiem ?? 0);
    moTaKetQua = `${phanThuong.emoji} ${phanThuong.moTa}\n\n*Chuyến đi không mang về phần thưởng chính.*`;
  }

  // ── Loot Linh Tinh: chỉ có 1% mỗi chuyến ──
  const nhanDuocLinhTinh = Math.random() < TY_LE_LOOT_LINH_TINH;
  let soLinhTinh = 0;
  if (nhanDuocLinhTinh) {
    soLinhTinh = 1;
    await themVaoTuiDo(player.id, diaDiem.linhTinhId, soLinhTinh);
    bonusText += `\n🧬 *May mắn tìm được Linh Tinh!*`;
  }
  const linhTinh = vatPhamMap.get(diaDiem.linhTinhId)!;

  const laKetQuaBatLoi = phanThuong.loai === "that_bai" || phanThuong.loai === "bat_loi";
  const mauEmbed = laKetQuaBatLoi ? MAU_XAM : diaDiem.mauEmbed;
  const embed = new EmbedBuilder()
    .setColor(mauEmbed)
    .setTitle(
      laKetQuaBatLoi
        ? `${diaDiem.emoji} Thám Hiểm ${diaDiem.ten} — Xui Xẻo`
        : `${diaDiem.emoji} Thám Hiểm ${diaDiem.ten} — Thành Công!`
    )
    .setDescription(
      `*"${layLoiThoai(diaDiem.id)}"*\n\n` + moTaKetQua
    )
    .addFields(
      {
        name: `🧬 Linh Tinh`,
        value: nhanDuocLinhTinh
          ? `${linhTinh.emoji} **${linhTinh.ten}** x${soLinhTinh}\n*Dùng để luyện đan cao cấp — xem* \`.luyendan\``
          : `Không tìm thấy Linh Tinh lần này.\n*Tỷ lệ: 1% mỗi chuyến*`,
        inline: true,
      },
      {
        name: "✨ Linh Lực",
        value: `+${phanThuong.kinhNghiem ?? 0}`,
        inline: true,
      }
    )
    .setFooter({ text: `⏳ Thám hiểm tiếp theo: 2 tiếng nữa` })
    .setTimestamp();

  return message.reply({ embeds: [embed] });
}

function layLoiThoai(id: string): string {
  const m: Record<string, string[]> = {
    rung_co_linh: ["Bước chân vào rừng cổ thụ, linh khí đất thấm vào từng hơi thở...", "Tiếng lá rì rào như lời thì thầm của vạn linh thảo ngàn năm..."],
    linh_son_dinh: ["Leo lên đỉnh Linh Sơn, gió mạnh hú vang, linh khí cuồn cuộn...", "Đỉnh núi chìm trong mây trắng như đang đứng giữa thiên đình..."],
    huyen_hai_bo: ["Sóng biển vỗ nhẹ vào bờ, mỗi con sóng mang linh khí từ đáy huyền hải...", "Ánh bạc mặt nước chiếu lên khuôn mặt, linh khí biển làm tâm trí thanh thản..."],
    phe_tich_dan_lo: ["Dấu tích của lò đan ngàn năm vẫn còn đây, linh khí đan dược phảng phất...", "Những mảnh tường cổ kính, vết tích của đan sư thời xưa còn in hằn trên đá..."],
    thien_nhai_binh: ["Thiên Nhai Bình — nơi đất trời giao hòa. Mỗi hơi thở như uống linh khí cả vũ trụ...", "Từ cao nguyên này, nhìn xuống cả Twilight Garden như một bức tranh thu nhỏ..."],
  };
  const arr = m[id] ?? ["Chuyến thám hiểm bắt đầu..."];
  return arr[Math.floor(Math.random() * arr.length)];
}
