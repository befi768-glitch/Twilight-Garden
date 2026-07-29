import { Client } from "discord.js";
import * as fs from "fs";
import * as path from "path";
import { setEmojiTien } from "./helpers";

export async function khoiTaoEmojiNguyetThach(client: Client): Promise<void> {
  const imagePath = path.resolve(__dirname, "../assets/nguyet_thach.png");

  if (!fs.existsSync(imagePath)) {
    console.warn("⚠️  Không tìm thấy ảnh Nguyệt Thạch, dùng emoji mặc định 💠");
    return;
  }

  const attachment = fs.readFileSync(imagePath);

  for (const [, guild] of client.guilds.cache) {
    try {
      // Fetch emoji list nếu chưa cache
      await guild.emojis.fetch();

      // Kiểm tra emoji đã tồn tại chưa
      const existing = guild.emojis.cache.find((e) => e.name === "nguyet_thach");
      if (existing) {
        setEmojiTien(`<:nguyet_thach:${existing.id}>`);
        console.log(`🌙 Dùng emoji Nguyệt Thạch có sẵn ở "${guild.name}": ${existing.id}`);
        return;
      }

      // Tạo emoji mới
      const emoji = await guild.emojis.create({
        attachment,
        name: "nguyet_thach",
        reason: "Twilight Garden — biểu tượng Nguyệt Thạch",
      });
      setEmojiTien(`<:nguyet_thach:${emoji.id}>`);
      console.log(`✨ Đã tạo emoji Nguyệt Thạch ở "${guild.name}": ${emoji.id}`);
      return;
    } catch {
      // Không có quyền MANAGE_EMOJIS ở server này, thử server tiếp theo
    }
  }

  console.warn("⚠️  Không thể tạo emoji Nguyệt Thạch (thiếu quyền MANAGE_EMOJIS), dùng 💠");
}
