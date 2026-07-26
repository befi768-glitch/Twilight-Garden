import "dotenv/config";
import { client } from "./client";
import { handleCommand } from "./commands";

const PREFIX = ".";

client.once("clientReady", () => {
  console.log(`✅ Bot đã online: ${client.user?.tag}`);
  client.user?.setActivity("🌱 Twilight Garden | .help", { type: 0 });
});

client.on("messageCreate", async (msg) => {
  if (msg.author.bot) return;
  if (!msg.content.startsWith(PREFIX)) return;

  const args = msg.content.slice(PREFIX.length).trim().split(/\s+/);
  const command = args.shift()?.toLowerCase();
  if (!command) return;

  await handleCommand(msg, command, args);
});

client.on("error", (err) => {
  console.error("Discord client error:", err);
});

const token = process.env.DISCORD_TOKEN ?? process.env.DISCORD_BOT_TOKEN;
if (!token) {
  console.error("❌ DISCORD_TOKEN chưa được thiết lập!");
  process.exit(1);
}

client.login(token).catch((err) => {
  console.error("❌ Đăng nhập thất bại:", err.message);
  process.exit(1);
});
