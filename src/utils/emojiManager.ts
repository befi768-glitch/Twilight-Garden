import { Client, Guild } from "discord.js";
import * as fs from "fs";
import * as path from "path";
import { setEmojiTien } from "./helpers";
import { danhSachCay } from "../data/plants";

const emojiCayTheoGuild = new Map<string, Map<string, string>>();

export function layEmojiCay(guildId: string | null, cayId: string, emojiMacDinh: string): string {
  return emojiCayTheoGuild.get(guildId ?? "")?.get(cayId) ?? emojiMacDinh;
}

async function taoHoacLayEmoji(
  guild: Guild,
  ten: string,
  attachment: Buffer,
  reason: string,
): Promise<string | null> {
  const existing = guild.emojis.cache.find((e) => e.name === ten);
  if (existing) return existing.toString();

  try {
    const emoji = await guild.emojis.create({
      attachment,
      name: ten,
      reason,
    });
    return emoji.toString();
  } catch {
    return null;
  }
}

export async function khoiTaoEmojiNguyetThach(client: Client): Promise<void> {
  const imagePath = path.resolve(__dirname, "../assets/emojis/nguyet_thach.png");

  if (!fs.existsSync(imagePath)) {
    console.warn("⚠️  Không tìm thấy ảnh Nguyệt Thạch, dùng emoji mặc định 💠");
    return;
  }

  const attachment = fs.readFileSync(imagePath);
  let daCoEmojiTien = false;

  for (const [, guild] of client.guilds.cache) {
    try {
      // Fetch emoji list nếu chưa cache
      await guild.emojis.fetch();

      // Kiểm tra emoji đã tồn tại chưa
      const existing = guild.emojis.cache.find((e) => e.name === "nguyet_thach");
      if (existing) {
        setEmojiTien(guild.id, existing.toString());
        daCoEmojiTien = true;
        console.log(`🌙 Dùng emoji Nguyệt Thạch có sẵn ở "${guild.name}": ${existing.id}`);
        continue;
      }

      // Tạo emoji mới
      const emoji = await guild.emojis.create({
        attachment,
        name: "nguyet_thach",
        reason: "Twilight Garden — biểu tượng Nguyệt Thạch",
      });
      setEmojiTien(guild.id, emoji.toString());
      daCoEmojiTien = true;
      console.log(`✨ Đã tạo emoji Nguyệt Thạch ở "${guild.name}": ${emoji.id}`);
      continue;
    } catch {
      // Không có quyền MANAGE_EMOJIS ở server này, thử server tiếp theo
    }
  }

  if (!daCoEmojiTien) {
    console.warn("⚠️  Không thể tạo emoji Nguyệt Thạch (thiếu quyền MANAGE_EMOJIS), dùng 💠");
  }
}

export async function khoiTaoEmojiCay(client: Client): Promise<void> {
  let tongEmojiCay = 0;

  for (const [, guild] of client.guilds.cache) {
    try {
      await guild.emojis.fetch();
      const emojiCay = new Map<string, string>();

      for (const cay of danhSachCay) {
        const imagePath = path.resolve(__dirname, `../assets/emojis/plants/${cay.id}.png`);
        if (!fs.existsSync(imagePath)) continue;

        const customEmoji = await taoHoacLayEmoji(
          guild,
          `cay_${cay.id}`,
          fs.readFileSync(imagePath),
          `Twilight Garden — biểu tượng ${cay.ten}`,
        );
        if (customEmoji) emojiCay.set(cay.id, customEmoji);
      }

      if (emojiCay.size > 0) {
        emojiCayTheoGuild.set(guild.id, emojiCay);
        tongEmojiCay += emojiCay.size;
        console.log(`🌱 Đã sẵn sàng ${emojiCay.size}/${danhSachCay.length} emoji ảnh cây ở "${guild.name}"`);
      }
    } catch {
      // Không có quyền MANAGE_EMOJIS ở server này, thử server tiếp theo
    }
  }

  if (tongEmojiCay === 0) {
    console.warn("⚠️  Không thể tạo emoji ảnh cây, cửa hàng dùng emoji mặc định");
  }
}
