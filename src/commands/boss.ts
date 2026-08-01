import { Message, EmbedBuilder } from "discord.js";
import { layHoacTaoNguoiChoi, congXuVaKinhNghiem, themVaoTuiDo } from "../database/queries";
import { db } from "../database/db";
import { petMap, layBonusBossDamage } from "../data/pets";
import { layThoiTietHomNay } from "../utils/weather";
import { MAU_DO, MAU_VANG, MAU_CHINH, MAU_XAM, formatXu } from "../utils/helpers";

const COOLDOWN_TAN_CONG_PHUT = 5;
const DAMAGE_MIN = 80;
const DAMAGE_MAX = 220;

interface BossHienTai {
  id: number;
  guild_id: string;
  ten: string;
  emoji: string;
  hp_toi_da: number;
  hp_hien_tai: number;
  phan_thuong_xu: number;
  phan_thuong_kn: number;
  trang_thai: string;
  nguoi_tao: string;
}

export const danhSachBoss = [
  {
    id: "linh_thu",
    ten: "Linh Thú Lâm Ngư",
    emoji: "🐉",
    moTa: "Linh thú huyền thoại ẩn sâu trong rừng Twilight, hấp thu linh khí trăm năm",
    hp: 5000,
    phanThuongXu: 800,
    phanThuongKn: 150,
  },
  {
    id: "co_long",
    ten: "Cổ Long Hắc Ám",
    emoji: "🌑",
    moTa: "Rồng cổ đại thức giấc từ giấc ngủ nghìn năm, âm khí bao trùm cả Linh Địa",
    hp: 12000,
    phanThuongXu: 2000,
    phanThuongKn: 400,
  },
  {
    id: "bang_tinh",
    ten: "Băng Tinh Thần Thú",
    emoji: "❄️",
    moTa: "Thần thú băng giá giáng xuống từ Thiên Nhai Bình, đóng băng cả thế giới",
    hp: 8000,
    phanThuongXu: 1200,
    phanThuongKn: 250,
  },
  {
    id: "huyen_phung",
    ten: "Huyền Phụng Tiên Thú",
    emoji: "🦅",
    moTa: "Phụng hoàng huyền bí giáng thế, mang linh hỏa thiêu rụi vạn vật",
    hp: 20000,
    phanThuongXu: 4000,
    phanThuongKn: 700,
  },
];

export async function xuLyBoss(message: Message, args: string[]) {
  if (!message.guildId) return;
  const player = await layHoacTaoNguoiChoi(message.author.id, message.guildId);
  const sub = args[0]?.toLowerCase();

  // ─── XEM BOSS ─────────────────────────────────────────────────────────────────
  if (!sub || sub === "xem") {
    const boss = await layBossHienTai(message.guildId);
    if (!boss) {
      const embed = new EmbedBuilder()
        .setColor(MAU_XAM)
        .setTitle("🏰 Không Có Boss Đang Hoạt Động")
        .setDescription(
          `*"Linh Địa Twilight đang yên bình..."*\n\nChưa có boss. Admin dùng \`.boss tao <tên>\` để triệu hồi!\n\n` +
          `**Boss có sẵn:**\n` +
          danhSachBoss.map((b) => `${b.emoji} **${b.ten}** — ${b.hp.toLocaleString("vi-VN")} HP`).join("\n")
        );
      return message.reply({ embeds: [embed] });
    }
    return message.reply({ embeds: [await taoEmbedBoss(boss, message.guildId)] });
  }

  // ─── TẠO BOSS (ADMIN) ─────────────────────────────────────────────────────────
  if (sub === "tao" || sub === "spawn" || sub === "summon") {
    const isAdmin = message.member?.permissions.has("ManageGuild") || message.author.id === process.env.OWNER_ID;
    if (!isAdmin) return message.reply("❌ Chỉ quản trị viên mới có thể triệu hồi boss!");

    if (await layBossHienTai(message.guildId)) {
      return message.reply("❌ Đã có boss đang hoạt động! Hãy đánh hạ boss hiện tại trước.");
    }

    const tenQuery = args.slice(1).join("").toLowerCase().replace(/\s/g, "");
    const aliasMap: Record<string, string> = {
      linhthu: "linh_thu", linhthulamngu: "linh_thu",
      colong: "co_long", colonghacam: "co_long",
      bangtinh: "bang_tinh", bangtinhthanthu: "bang_tinh",
      huyenphung: "huyen_phung", huyenphungtienthu: "huyen_phung",
    };
    const bossId = aliasMap[tenQuery] ?? tenQuery;
    const bossData = danhSachBoss.find((b) => b.id === bossId);

    if (!bossData) {
      const ds = danhSachBoss.map((b) => `• \`${b.id.replace(/_/g, "")}\` — ${b.emoji} ${b.ten}`).join("\n");
      return message.reply(`❌ Không tìm thấy boss **"${args.slice(1).join(" ")}"**!\n\n**Boss có sẵn:**\n${ds}`);
    }

    await db.execute(`
      INSERT INTO boss_su_kien (guild_id, ten, emoji, hp_toi_da, hp_hien_tai, phan_thuong_xu, phan_thuong_kn, trang_thai, nguoi_tao)
      VALUES ('${message.guildId}', '${bossData.ten}', '${bossData.emoji}', ${bossData.hp}, ${bossData.hp},
              ${bossData.phanThuongXu}, ${bossData.phanThuongKn}, 'dang_song', '${message.author.id}')
    `);

    const embed = new EmbedBuilder()
      .setColor(0xe74c3c)
      .setTitle(`⚠️ ${bossData.emoji} Boss Xuất Hiện! — ${bossData.ten}`)
      .setDescription(
        `*"${bossData.moTa}..."*\n\n` +
        `❤️ **HP:** ${bossData.hp.toLocaleString("vi-VN")}\n` +
        `💠 **Thưởng:** ${formatXu(bossData.phanThuongXu)} + ✨ ${bossData.phanThuongKn} Linh Lực (mỗi người)\n` +
        `💎 **Top 3 sát thương:** nhận thêm **Boss Hạch** — dùng luyện Đại Tổng Đan!\n\n` +
        `🗡️ Dùng \`.boss danh\` để tấn công!\n` +
        `🐾 Pet tốt hơn → sát thương cao hơn!\n` +
        `🌦️ Thời tiết ảnh hưởng sát thương — xem \`.thoitiet\`!`
      )
      .setFooter({ text: `Cooldown tấn công: ${COOLDOWN_TAN_CONG_PHUT} phút • Top 3 nhận Boss Hạch để luyện Đại Tổng Đan!` });
    return message.reply({ embeds: [embed] });
  }

  // ─── TẤN CÔNG BOSS ────────────────────────────────────────────────────────────
  if (sub === "danh" || sub === "tancong" || sub === "attack") {
    const boss = await layBossHienTai(message.guildId);
    if (!boss) return message.reply("❌ Không có boss nào đang hoạt động!");

    // Cooldown tấn công
    const tgRow = await db.execute<{ last_attack: string | null }>(
      `SELECT last_attack FROM boss_tham_gia WHERE boss_id = ${boss.id} AND nguoi_choi_id = ${player.id}`
    );
    const lastAttack = tgRow.rows[0]?.last_attack ? new Date(tgRow.rows[0].last_attack) : null;
    const bayGio = new Date();
    if (lastAttack) {
      const cdHet = new Date(lastAttack.getTime() + COOLDOWN_TAN_CONG_PHUT * 60 * 1000);
      if (bayGio < cdHet) {
        return message.reply(`⏳ Chưa hồi phục!\n**Đánh tiếp:** <t:${Math.floor(cdHet.getTime() / 1000)}:R>`);
      }
    }

    // ── Tính sát thương ──
    const extraRow = await db.execute<{ pet_id: string | null }>(
      `SELECT pet_id FROM nguoi_choi WHERE id = ${player.id}`
    );
    const petId = extraRow.rows[0]?.pet_id ?? null;
    const pet = petId ? petMap.get(petId) : null;
    const bonusPetDamage = layBonusBossDamage(petId);

    // Bonus cấp độ
    const bonusCap = (player.capDo - 1) * 30;
    let satThuong = Math.floor(DAMAGE_MIN + bonusCap + Math.random() * (DAMAGE_MAX - DAMAGE_MIN + bonusCap));

    // Áp dụng bonus pet
    let petBonusText = "";
    if (bonusPetDamage > 0) {
      const bonusSo = Math.floor(satThuong * bonusPetDamage / 100);
      satThuong += bonusSo;
      petBonusText = `\n${pet!.emoji} *${pet!.ten}: +${bonusSo} sát thương (${bonusPetDamage}%)*`;
    }

    // Áp dụng thời tiết — chỉ Cuồng Phong ảnh hưởng boss (-5%)
    // Nguyệt Sắc & Linh Vũ chỉ buff farming, không ảnh hưởng boss
    const thoiTiet = layThoiTietHomNay(message.guildId);
    let thoiTietText = "";
    let thoiTietMod = 1.0;
    if (thoiTiet.id === "cuong_phong") {
      thoiTietMod = 0.95;
      thoiTietText = `\n${thoiTiet.emoji} *${thoiTiet.ten}: -5% sát thương (chiến đấu trong bão!)*`;
    }
    satThuong = Math.floor(satThuong * thoiTietMod);

    const hpMoi = Math.max(0, boss.hp_hien_tai - satThuong);
    await db.execute(`UPDATE boss_su_kien SET hp_hien_tai = ${hpMoi} WHERE id = ${boss.id}`);

    // Cập nhật tham gia
    if (tgRow.rows.length > 0) {
      await db.execute(
        `UPDATE boss_tham_gia SET sat_thuong_gay = sat_thuong_gay + ${satThuong}, lan_tan_cong = lan_tan_cong + 1, last_attack = NOW()
         WHERE boss_id = ${boss.id} AND nguoi_choi_id = ${player.id}`
      );
    } else {
      await db.execute(
        `INSERT INTO boss_tham_gia (boss_id, nguoi_choi_id, sat_thuong_gay, lan_tan_cong, last_attack)
         VALUES (${boss.id}, ${player.id}, ${satThuong}, 1, NOW())`
      );
    }

    // ── BOSS CHẾT ──────────────────────────────────────────────────────────────
    if (hpMoi <= 0) {
      await db.execute(
        `UPDATE boss_su_kien SET trang_thai = 'da_chet', chet_luc = NOW(), hp_hien_tai = 0 WHERE id = ${boss.id}`
      );

      const thamGiaRows = await db.execute<{ nguoi_choi_id: number; sat_thuong_gay: number }>(
        `SELECT nguoi_choi_id, sat_thuong_gay FROM boss_tham_gia WHERE boss_id = ${boss.id} ORDER BY sat_thuong_gay DESC`
      );
      const tongSatThuong = thamGiaRows.rows.reduce((s, r) => s + r.sat_thuong_gay, 0);

      // Phân phát phần thưởng
      for (let i = 0; i < thamGiaRows.rows.length; i++) {
        const r = thamGiaRows.rows[i];
        let xu = boss.phan_thuong_xu;
        let kn = boss.phan_thuong_kn;
        if (i === 0)      { xu = Math.floor(xu * 2.0); kn = Math.floor(kn * 1.8); }
        else if (i === 1) { xu = Math.floor(xu * 1.5); kn = Math.floor(kn * 1.5); }
        else if (i === 2) { xu = Math.floor(xu * 1.2); kn = Math.floor(kn * 1.2); }
        await congXuVaKinhNghiem(r.nguoi_choi_id, xu, kn);

        // Top 3 nhận Boss Hạch — dùng luyện Đại Tổng Đan
        if (i < 3) {
          await themVaoTuiDo(r.nguoi_choi_id, "boss_hach", 1);
        }
      }

      // Top 5 sát thương
      const top5 = thamGiaRows.rows.slice(0, 5);
      const top5Text = await Promise.all(
        top5.map(async (r, i) => {
          const phanTram = tongSatThuong > 0 ? Math.round((r.sat_thuong_gay / tongSatThuong) * 100) : 0;
          const medal = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"][i];
          const hasHach = i < 3 ? " 💎" : "";
          try {
            const uidRow = await db.execute<{ user_id: string }>(`SELECT user_id FROM nguoi_choi WHERE id = ${r.nguoi_choi_id}`);
            const user = await message.client.users.fetch(uidRow.rows[0]?.user_id ?? "");
            return `${medal} **${user.displayName}**${hasHach} — ${r.sat_thuong_gay.toLocaleString("vi-VN")} sát thương (${phanTram}%)`;
          } catch {
            return `${medal} Tu sĩ ẩn danh${hasHach} — ${r.sat_thuong_gay.toLocaleString("vi-VN")} (${phanTram}%)`;
          }
        })
      );

      const embed = new EmbedBuilder()
        .setColor(MAU_VANG)
        .setTitle(`🎉 ${boss.emoji} ${boss.ten} Đã Bị Tiêu Diệt!`)
        .setDescription(
          `*"Linh Địa thoát khỏi bóng tối — tất cả đã chiến đấu anh dũng!"*\n\n` +
          `💥 Đòn cuối: **${message.author.displayName}** (+${satThuong} sát thương)\n\n` +
          `**🏆 Top Sát Thương:**\n${top5Text.join("\n")}\n\n` +
          `💎 *Top 3 nhận Boss Hạch — dùng \`.luyendan\` để xem công thức Đại Tổng Đan!*\n` +
          `👥 ${thamGiaRows.rows.length} tu sĩ đã tham chiến`
        )
        .setFooter({ text: "Phần thưởng đã vào Bảo Nang tất cả người tham gia!" });
      return message.reply({ embeds: [embed] });
    }

    // ── BOSS CÒN SỐNG ──────────────────────────────────────────────────────────
    const phanTramHP = Math.round((hpMoi / boss.hp_toi_da) * 100);
    const icon = satThuong >= 400 ? "💥" : satThuong >= 200 ? "⚔️" : "🗡️";
    const embed = new EmbedBuilder()
      .setColor(phanTramHP <= 25 ? 0xe74c3c : phanTramHP <= 50 ? 0xe67e22 : MAU_CHINH)
      .setTitle(`${icon} Tấn Công ${boss.emoji} ${boss.ten}!`)
      .setDescription(
        `**${message.author.displayName}** gây **${satThuong.toLocaleString("vi-VN")} sát thương**!` +
        petBonusText + thoiTietText +
        `\n\n❤️ **HP:** ${hpMoi.toLocaleString("vi-VN")} / ${boss.hp_toi_da.toLocaleString("vi-VN")}\n` +
        `\`${taoThanhHP(phanTramHP)}\` ${phanTramHP}%` +
        (phanTramHP <= 25 ? "\n\n⚠️ *Boss sắp chết — tập trung tấn công!*" : "")
      )
      .setFooter({ text: `⏳ ${COOLDOWN_TAN_CONG_PHUT} phút • 💎 Top 3 sát thương nhận Boss Hạch khi boss chết!` });
    return message.reply({ embeds: [embed] });
  }

  // ─── DANH SÁCH ────────────────────────────────────────────────────────────────
  if (sub === "danhsach" || sub === "ds") {
    const ds = danhSachBoss.map(
      (b) =>
        `${b.emoji} **${b.ten}** — ${b.hp.toLocaleString("vi-VN")} HP\n` +
        `┗ 💠 ${formatXu(b.phanThuongXu)} + ✨ ${b.phanThuongKn} Linh Lực mỗi người\n` +
        `┗ 💎 Top 3 sát thương → **Boss Hạch** (dùng luyện Đại Tổng Đan!)`
    );
    return message.reply({ embeds: [new EmbedBuilder().setColor(MAU_DO).setTitle("👹 Danh Sách Boss").setDescription(ds.join("\n\n")).setFooter({ text: "Admin: .boss tao <tên>" })] });
  }

  // ─── LỊCH SỬ ─────────────────────────────────────────────────────────────────
  if (sub === "lichsu" || sub === "history") {
    const rows = await db.execute<{ ten: string; emoji: string; chet_luc: string | null; trang_thai: string }>(
      `SELECT ten, emoji, chet_luc, trang_thai FROM boss_su_kien WHERE guild_id = '${message.guildId}' ORDER BY id DESC LIMIT 5`
    );
    if (!rows.rows.length) return message.reply("📜 Chưa có boss nào từng xuất hiện tại server này.");
    const ds = rows.rows.map((r) => {
      const trangThai = r.trang_thai === "da_chet" ? "✅ Đã tiêu diệt" : "🔴 Đang hoạt động";
      const tg = r.chet_luc ? `<t:${Math.floor(new Date(r.chet_luc).getTime() / 1000)}:R>` : "";
      return `${r.emoji} **${r.ten}** — ${trangThai} ${tg}`;
    });
    return message.reply({ embeds: [new EmbedBuilder().setColor(MAU_XAM).setTitle("📜 Lịch Sử Boss").setDescription(ds.join("\n"))] });
  }

  return message.reply(
    "❌ Lệnh không hợp lệ!\n• `.boss` — Xem boss\n• `.boss danh` — Tấn công\n• `.boss danhsach` — Danh sách\n• `.boss lichsu` — Lịch sử\n• `.boss tao <tên>` — Triệu hồi *(Admin)*"
  );
}

async function layBossHienTai(guildId: string): Promise<BossHienTai | null> {
  const rows = await db.execute<BossHienTai>(
    `SELECT * FROM boss_su_kien WHERE guild_id = '${guildId}' AND trang_thai = 'dang_song' ORDER BY id DESC LIMIT 1`
  );
  return rows.rows[0] ?? null;
}

async function taoEmbedBoss(boss: BossHienTai, guildId: string): Promise<EmbedBuilder> {
  const phanTramHP = Math.round((boss.hp_hien_tai / boss.hp_toi_da) * 100);
  const soNguoi = (await db.execute<{ cnt: string }>(`SELECT COUNT(*) as cnt FROM boss_tham_gia WHERE boss_id = ${boss.id}`)).rows[0]?.cnt ?? "0";
  const thoiTiet = layThoiTietHomNay(guildId);
  let thoiTietNote = "";
  if (thoiTiet.id === "nguyet_sac") thoiTietNote = `\n${thoiTiet.emoji} **${thoiTiet.ten}**: Sát thương +15% hôm nay!`;
  else if (thoiTiet.id === "cuong_phong") thoiTietNote = `\n${thoiTiet.emoji} **${thoiTiet.ten}**: Sát thương -10% hôm nay (boss mạnh hơn!)`;
  else if (thoiTiet.id === "linh_vu") thoiTietNote = `\n${thoiTiet.emoji} **${thoiTiet.ten}**: Sát thương +5% hôm nay`;

  return new EmbedBuilder()
    .setColor(phanTramHP <= 25 ? 0xe74c3c : phanTramHP <= 50 ? 0xe67e22 : 0x9b59b6)
    .setTitle(`${boss.emoji} Boss: ${boss.ten}`)
    .addFields(
      { name: "❤️ Máu Boss", value: `${boss.hp_hien_tai.toLocaleString("vi-VN")} / ${boss.hp_toi_da.toLocaleString("vi-VN")}\n\`${taoThanhHP(phanTramHP)}\` ${phanTramHP}%` },
      { name: "🏆 Phần Thưởng", value: `💠 ${formatXu(boss.phan_thuong_xu)}\n✨ +${boss.phan_thuong_kn} Linh Lực\n💎 Top 3 → **Boss Hạch**`, inline: true },
      { name: "👥 Tham Chiến", value: `**${soNguoi}** tu sĩ`, inline: true },
      { name: "🌦️ Thời Tiết", value: `${thoiTiet.emoji} ${thoiTiet.ten}${thoiTietNote}` }
    )
    .setFooter({ text: `⚔️ .boss danh để tấn công (CD: ${COOLDOWN_TAN_CONG_PHUT}p) • 🐾 Pet mạnh hơn → sát thương cao hơn` });
}

function taoThanhHP(pct: number): string {
  const filled = Math.round(pct / 5);
  const mau = pct > 50 ? "🟩" : pct > 25 ? "🟨" : "🟥";
  return mau.repeat(filled) + "⬛".repeat(20 - filled);
}
