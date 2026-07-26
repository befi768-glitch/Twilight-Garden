import { Client, GatewayIntentBits, Partials } from "discord.js";
import * as dotenv from "dotenv";
import { xuLyVuon } from "./commands/vuon";
import { xuLyTrong } from "./commands/trong";
import { xuLyTuoi } from "./commands/tuoi";
import { xuLyThuHoach } from "./commands/thuhoach";
import { xuLyCuaHang } from "./commands/cuahang";
import { xuLyMua } from "./commands/mua";
import { xuLyBan } from "./commands/ban";
import { xuLyTuiDo } from "./commands/tuido";
import { xuLyBangXepHang } from "./commands/bangxephang";
import { xuLyTang } from "./commands/tang";
import { xuLyTroGiup } from "./commands/trogiup";
import { db } from "./database/db";
import { sql } from "drizzle-orm";

dotenv.config();

const PREFIX = process.env.PREFIX ?? ".";
const TOKEN = process.env.DISCORD_TOKEN;

if (!TOKEN) {
  console.error("❌ Thiếu DISCORD_TOKEN trong file .env!");
  process.exit(1);
}

// Khởi tạo bảng database
async function khoiTaoDatabase() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS nguoi_choi (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      guild_id TEXT NOT NULL,
      xu INTEGER NOT NULL DEFAULT 100,
      kinh_nghiem INTEGER NOT NULL DEFAULT 0,
      cap_do INTEGER NOT NULL DEFAULT 1,
      so_o_dat INTEGER NOT NULL DEFAULT 3,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, guild_id)
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS o_dat (
      id SERIAL PRIMARY KEY,
      nguoi_choi_id INTEGER REFERENCES nguoi_choi(id),
      vi_tri INTEGER NOT NULL,
      ten_cay TEXT,
      trong_luc TIMESTAMP,
      truong_thanh_luc TIMESTAMP,
      da_tuoi BOOLEAN DEFAULT FALSE,
      so_luong_thu_hoach INTEGER DEFAULT 1
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS tui_do (
      id SERIAL PRIMARY KEY,
      nguoi_choi_id INTEGER REFERENCES nguoi_choi(id),
      ten_cay TEXT NOT NULL,
      so_luong INTEGER NOT NULL DEFAULT 0
    )
  `);

  console.log("✅ Database đã sẵn sàng!");
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Message, Partials.Channel],
});

client.once("ready", async () => {
  console.log(`🌸 ${client.user?.tag} đã online!`);
  console.log(`🌿 Prefix: ${PREFIX}`);
  console.log(`📡 Đang phục vụ ${client.guilds.cache.size} server`);

  await khoiTaoDatabase();

  client.user?.setActivity(`${PREFIX}trogiup | Twilight Garden 🌸`, { type: 3 });
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;
  if (!message.content.startsWith(PREFIX)) return;

  const content = message.content.slice(PREFIX.length).trim();
  const args = content.split(/\s+/);
  const lenh = args.shift()?.toLowerCase() ?? "";

  try {
    switch (lenh) {
      // Vườn tược
      case "vuon":
      case "vườn":
        await xuLyVuon(message);
        break;

      case "trong":
      case "trồng":
        await xuLyTrong(message, args);
        break;

      case "tuoi":
      case "tưới":
        await xuLyTuoi(message, args);
        break;

      case "thuhoach":
      case "thu":
      case "thuhoạch":
        await xuLyThuHoach(message, args);
        break;

      // Mua bán
      case "cuahang":
      case "cửahàng":
      case "shop":
        await xuLyCuaHang(message);
        break;

      case "mua":
        await xuLyMua(message, args);
        break;

      case "ban":
      case "bán":
        await xuLyBan(message, args);
        break;

      // Quản lý
      case "tuido":
      case "túiđồ":
      case "tui":
        await xuLyTuiDo(message);
        break;

      case "bangxephang":
      case "top":
      case "bxh":
        await xuLyBangXepHang(message);
        break;

      case "tang":
      case "tặng":
        await xuLyTang(message, args);
        break;

      // Trợ giúp
      case "trogiup":
      case "trợgiúp":
      case "help":
      case "h":
        await xuLyTroGiup(message, PREFIX);
        break;

      default:
        // Không phản hồi lệnh không hợp lệ để tránh spam
        break;
    }
  } catch (err) {
    console.error(`Lỗi khi xử lý lệnh ${lenh}:`, err);
    await message.reply("❌ Có lỗi xảy ra! Vui lòng thử lại sau.").catch(() => {});
  }
});

client.login(TOKEN);
