import { Message, EmbedBuilder } from "discord.js";
import { layHoacTaoNguoiChoi, congXuVaKinhNghiem } from "../database/queries";
import { db } from "../database/db";
import { MAU_DO, MAU_VANG, MAU_CHINH, MAU_XAM, formatXu } from "../utils/helpers";

const COOLDOWN_TAN_CONG_PHUT = 5; // 5 phút giữa các lần đánh
const DAMAGE_CO_BAN_MIN = 80;
const DAMAGE_CO_BAN_MAX = 220;

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
  created_at: string;
  chet_luc: string | null;
}

interface ThamGiaBoss {
  id: number;
  boss_id: number;
  nguoi_choi_id: number;
  sat_thuong_gay: number;
  lan_tan_cong: number;
  last_attack: string | null;
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
    moTa: "Rồng cổ đại thức giấc từ giấc ngủ nghìn năm, âm khí bao phủ cả Linh Địa",
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

  // ─── XEM BOSS HIỆN TẠI ────────────────────────────────────────────────────────
  if (!sub || sub === "xem") {
    const boss = await layBossHienTai(message.guildId);
    if (!boss) {
      const embed = new EmbedBuilder()
        .setColor(MAU_XAM)
        .setTitle("🏰 Không Có Boss Đang Hoạt Động")
        .setDescription(
          `*"Linh Địa Twilight đang yên bình... nhưng cơn bão sẽ không yên lâu đâu."*\n\n` +
          `Chưa có boss nào xuất hiện trong server này.\n` +
          `Quản trị viên dùng \`.boss tao <tên>\` để triệu hồi boss!\n\n` +
          `**Danh sách boss:**\n` +
          danhSachBoss.map((b) => `${b.emoji} **${b.ten}** — ${b.hp.toLocaleString("vi-VN")} HP`).join("\n")
        );
      return message.reply({ embeds: [embed] });
    }

    return message.reply({ embeds: [await taoEmbedBoss(boss, message.guildId)] });
  }

  // ─── TẠO BOSS (ADMIN) ────────────────────────────────────────────────────────
  if (sub === "tao" || sub === "spawn" || sub === "summon") {
    const isAdmin =
      (message.member?.permissions.has("ManageGuild")) ||
      message.author.id === process.env.OWNER_ID;

    if (!isAdmin) {
      return message.reply("❌ Chỉ quản trị viên mới có thể triệu hồi boss!");
    }

    const bossDangCoMat = await layBossHienTai(message.guildId);
    if (bossDangCoMat) {
      return message.reply(
        `❌ Đã có boss **${bossDangCoMat.ten}** đang hoạt động! Hãy đánh hạ boss hiện tại trước.`
      );
    }

    const tenBoss = args.slice(1).join(" ").toLowerCase().replace(/\s/g, "");
    const aliasMap: Record<string, string> = {
      linhthu: "linh_thu", linhthulamngu: "linh_thu",
      colong: "co_long", colonghacam: "co_long",
      bangtinh: "bang_tinh", bangtinhthanthu: "bang_tinh",
      huyenphung: "huyen_phung", huyenphungtienthu: "huyen_phung",
    };

    const bossId = aliasMap[tenBoss] ?? tenBoss;
    const bossData = danhSachBoss.find((b) => b.id === bossId);

    if (!bossData) {
      const ds = danhSachBoss.map((b) => `• \`${b.id.replace(/_/g, "")}\` — ${b.emoji} ${b.ten}`).join("\n");
      return message.reply(
        `❌ Không tìm thấy boss **"${args.slice(1).join(" ")}"**!\n\n**Boss có sẵn:**\n${ds}`
      );
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
        `🔴 **HP:** ${bossData.hp.toLocaleString("vi-VN")} / ${bossData.hp.toLocaleString("vi-VN")}\n` +
        `💠 **Phần thưởng:** ${formatXu(bossData.phanThuongXu)} mỗi người tham gia\n` +
        `✨ **Kinh nghiệm:** +${bossData.phanThuongKn} Linh Lực mỗi người tham gia\n\n` +
        `🗡️ Dùng \`.boss danh\` để tấn công!\n` +
        `*(Cooldown tấn công: ${COOLDOWN_TAN_CONG_PHUT} phút)*`
      )
      .setFooter({ text: "Cả server cùng chiến đấu — boss sẽ rớt khi HP = 0!" });

    return message.reply({ embeds: [embed] });
  }

  // ─── TẤN CÔNG BOSS ────────────────────────────────────────────────────────────
  if (sub === "danh" || sub === "tan_cong" || sub === "tancong" || sub === "attack") {
    const boss = await layBossHienTai(message.guildId);

    if (!boss) {
      return message.reply("❌ Không có boss nào đang hoạt động! Dùng `.boss` để kiểm tra.");
    }

    // Kiểm tra cooldown tấn công của người chơi
    const tgRow = await db.execute<{ last_attack: string | null }>(
      `SELECT last_attack FROM boss_tham_gia WHERE boss_id = ${boss.id} AND nguoi_choi_id = ${player.id}`
    );
    const lastAttack = tgRow.rows[0]?.last_attack ? new Date(tgRow.rows[0].last_attack) : null;
    const bayGio = new Date();
    const cdHetLuc = lastAttack ? new Date(lastAttack.getTime() + COOLDOWN_TAN_CONG_PHUT * 60 * 1000) : null;

    if (cdHetLuc && bayGio < cdHetLuc) {
      return message.reply(
        `⏳ Chưa hồi phục sau lần đánh trước!\n**Đánh tiếp:** <t:${Math.floor(cdHetLuc.getTime() / 1000)}:R>`
      );
    }

    // Tính sát thương (dựa theo cấp độ)
    const bonusTuCap = (player.capDo - 1) * 30;
    const satThuong = Math.floor(
      DAMAGE_CO_BAN_MIN + bonusTuCap + Math.random() * (DAMAGE_CO_BAN_MAX - DAMAGE_CO_BAN_MIN + bonusTuCap)
    );

    const hpMoi = Math.max(0, boss.hp_hien_tai - satThuong);

    // Cập nhật HP boss
    await db.execute(`UPDATE boss_su_kien SET hp_hien_tai = ${hpMoi} WHERE id = ${boss.id}`);

    // Cập nhật tham gia
    const daCoRecord = tgRow.rows.length > 0;
    if (daCoRecord) {
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

    // ── BOSS CHẾT ────────────────────────────────────────────────────────────────
    if (hpMoi <= 0) {
      await db.execute(
        `UPDATE boss_su_kien SET trang_thai = 'da_chet', chet_luc = NOW(), hp_hien_tai = 0 WHERE id = ${boss.id}`
      );

      // Lấy danh sách người tham gia
      const thamGiaRows = await db.execute<{ nguoi_choi_id: number; sat_thuong_gay: number; lan_tan_cong: number }>(
        `SELECT nguoi_choi_id, sat_thuong_gay, lan_tan_cong FROM boss_tham_gia WHERE boss_id = ${boss.id} ORDER BY sat_thuong_gay DESC`
      );

      const tongSatThuong = thamGiaRows.rows.reduce((s, r) => s + r.sat_thuong_gay, 0);
      const soNguoiThamGia = thamGiaRows.rows.length;

      // Phần thưởng cơ bản + bonus cho top damage
      for (let i = 0; i < thamGiaRows.rows.length; i++) {
        const r = thamGiaRows.rows[i];
        let xu = boss.phan_thuong_xu;
        let kn = boss.phan_thuong_kn;

        // Top 3 sát thương nhận thưởng thêm
        if (i === 0) { xu = Math.floor(xu * 2.0); kn = Math.floor(kn * 1.8); }
        else if (i === 1) { xu = Math.floor(xu * 1.5); kn = Math.floor(kn * 1.5); }
        else if (i === 2) { xu = Math.floor(xu * 1.2); kn = Math.floor(kn * 1.2); }

        await congXuVaKinhNghiem(r.nguoi_choi_id, xu, kn);
      }

      // Hiển thị top 5 đóng góp
      const top5 = thamGiaRows.rows.slice(0, 5);
      const top5Text = await Promise.all(
        top5.map(async (r, i) => {
          const phanTram = tongSatThuong > 0 ? Math.round((r.sat_thuong_gay / tongSatThuong) * 100) : 0;
          const medal = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"][i];
          try {
            const user = await message.client.users.fetch(
              (await db.execute<{ user_id: string }>(`SELECT user_id FROM nguoi_choi WHERE id = ${r.nguoi_choi_id}`)).rows[0]?.user_id ?? ""
            );
            return `${medal} **${user.displayName}** — ${r.sat_thuong_gay.toLocaleString("vi-VN")} sát thương (${phanTram}%)`;
          } catch {
            return `${["🥇", "🥈", "🥉", "4️⃣", "5️⃣"][i]} Tu sĩ ẩn danh — ${r.sat_thuong_gay.toLocaleString("vi-VN")} sát thương`;
          }
        })
      );

      const embed = new EmbedBuilder()
        .setColor(MAU_VANG)
        .setTitle(`🎉 ${boss.emoji} ${boss.ten} Đã Bị Đánh Bại!`)
        .setDescription(
          `*"Linh Địa Twilight thoát khỏi bóng tối... mọi người đã chiến đấu anh dũng!"*\n\n` +
          `💥 Đòn cuối cùng được thực hiện bởi: **${message.author.displayName}** (+${satThuong} sát thương)\n\n` +
          `**🏆 Bảng Sát Thương:**\n${top5Text.join("\n")}\n\n` +
          `👥 **${soNguoiThamGia} người** đã tham gia trận đánh\n` +
          `💠 **Phần thưởng cơ bản:** ${formatXu(boss.phan_thuong_xu)} + ${boss.phan_thuong_kn} Linh Lực\n` +
          `🥇 **Top 1:** x2.0 xu, x1.8 KN | 🥈 **Top 2:** x1.5 | 🥉 **Top 3:** x1.2`
        )
        .setFooter({ text: "Phần thưởng đã được phân phát vào Bảo Nang của tất cả người tham gia!" });

      return message.reply({ embeds: [embed] });
    }

    // ── BOSS CÒN SỐNG ──────────────────────────────────────────────────────────
    const phanTramHP = Math.round((hpMoi / boss.hp_toi_da) * 100);
    const thanh = taoThanhHP(phanTramHP);
    const mauDonTan = satThuong >= 400 ? "💥" : satThuong >= 200 ? "⚔️" : "🗡️";

    const embed = new EmbedBuilder()
      .setColor(phanTramHP <= 25 ? 0xe74c3c : phanTramHP <= 50 ? 0xe67e22 : MAU_CHINH)
      .setTitle(`${mauDonTan} Tấn Công ${boss.emoji} ${boss.ten}!`)
      .setDescription(
        `**${message.author.displayName}** gây **${satThuong.toLocaleString("vi-VN")} sát thương**!\n\n` +
        `❤️ **HP Boss:** ${hpMoi.toLocaleString("vi-VN")} / ${boss.hp_toi_da.toLocaleString("vi-VN")}\n` +
        `\`${thanh}\` ${phanTramHP}%\n\n` +
        (phanTramHP <= 25 ? `⚠️ *Boss sắp chết rồi — tập trung tấn công!*` : "")
      )
      .setFooter({
        text: `⏳ Đánh tiếp sau: ${COOLDOWN_TAN_CONG_PHUT} phút • Dùng .boss để xem thông tin đầy đủ`,
      });

    return message.reply({ embeds: [embed] });
  }

  // ─── DANH SÁCH BOSS ──────────────────────────────────────────────────────────
  if (sub === "danhsach" || sub === "ds" || sub === "list") {
    const ds = danhSachBoss.map(
      (b) =>
        `${b.emoji} **${b.ten}** — ${b.hp.toLocaleString("vi-VN")} HP\n` +
        `┗ 💠 ${formatXu(b.phanThuongXu)} + ✨ ${b.phanThuongKn} Linh Lực mỗi người\n` +
        `┗ *${b.moTa.slice(0, 50)}...*`
    );
    const embed = new EmbedBuilder()
      .setColor(MAU_DO)
      .setTitle("👹 Danh Sách Boss — Twilight Garden")
      .setDescription(ds.join("\n\n"))
      .setFooter({ text: "Admin dùng .boss tao <tên> để triệu hồi boss" });
    return message.reply({ embeds: [embed] });
  }

  // ─── LỊCH SỬ ─────────────────────────────────────────────────────────────────
  if (sub === "lichsu" || sub === "history") {
    const rows = await db.execute<{ ten: string; emoji: string; chet_luc: string; trang_thai: string }>(
      `SELECT ten, emoji, chet_luc, trang_thai FROM boss_su_kien WHERE guild_id = '${message.guildId}' ORDER BY id DESC LIMIT 5`
    );
    if (!rows.rows.length) return message.reply("📜 Chưa có boss nào từng xuất hiện tại server này.");

    const ds = rows.rows.map((r) => {
      const trangThai = r.trang_thai === "da_chet" ? "✅ Đã bị tiêu diệt" : "🔴 Đang hoạt động";
      const thoiGian = r.chet_luc ? `<t:${Math.floor(new Date(r.chet_luc).getTime() / 1000)}:R>` : "N/A";
      return `${r.emoji} **${r.ten}** — ${trangThai} ${thoiGian}`;
    });

    const embed = new EmbedBuilder()
      .setColor(MAU_XAM)
      .setTitle("📜 Lịch Sử Boss — Twilight Garden")
      .setDescription(ds.join("\n"));
    return message.reply({ embeds: [embed] });
  }

  return message.reply(
    "❌ Lệnh không hợp lệ!\n" +
    "• `.boss` — Xem boss hiện tại\n" +
    "• `.boss danh` — Tấn công boss\n" +
    "• `.boss danhsach` — Danh sách boss\n" +
    "• `.boss lichsu` — Lịch sử boss\n" +
    "• `.boss tao <tên>` — Triệu hồi boss *(Admin)*"
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
  const thanh = taoThanhHP(phanTramHP);

  // Lấy top 3 sát thương
  const topRows = await db.execute<{ nguoi_choi_id: number; sat_thuong_gay: number }>(
    `SELECT bt.nguoi_choi_id, bt.sat_thuong_gay FROM boss_tham_gia bt WHERE bt.boss_id = ${boss.id} ORDER BY bt.sat_thuong_gay DESC LIMIT 3`
  );

  const soNguoiThamGia = (
    await db.execute<{ cnt: string }>(`SELECT COUNT(*) as cnt FROM boss_tham_gia WHERE boss_id = ${boss.id}`)
  ).rows[0]?.cnt ?? "0";

  const embed = new EmbedBuilder()
    .setColor(phanTramHP <= 25 ? 0xe74c3c : phanTramHP <= 50 ? 0xe67e22 : 0x9b59b6)
    .setTitle(`${boss.emoji} Boss: ${boss.ten}`)
    .addFields(
      {
        name: "❤️ Máu Boss",
        value: `${boss.hp_hien_tai.toLocaleString("vi-VN")} / ${boss.hp_toi_da.toLocaleString("vi-VN")}\n\`${thanh}\` ${phanTramHP}%`,
      },
      {
        name: "🏆 Phần Thưởng (mỗi người tham gia)",
        value: `💠 ${formatXu(boss.phan_thuong_xu)} Nguyệt Thạch\n✨ +${boss.phan_thuong_kn} Linh Lực\n🥇 Top damage nhận thêm x2.0/x1.5/x1.2`,
        inline: true,
      },
      {
        name: "👥 Đang Tham Chiến",
        value: `**${soNguoiThamGia}** tu sĩ`,
        inline: true,
      }
    )
    .setFooter({ text: `⚔️ Dùng .boss danh để tấn công! (cooldown: ${COOLDOWN_TAN_CONG_PHUT} phút)` })
    .setTimestamp();

  return embed;
}

function taoThanhHP(phanTram: number): string {
  const filled = Math.round(phanTram / 5);
  const empty = 20 - filled;
  const mau = phanTram > 50 ? "🟩" : phanTram > 25 ? "🟨" : "🟥";
  return mau.repeat(filled) + "⬛".repeat(empty);
}
