import { Message } from "discord.js";
import { handleGarden } from "./garden";
import { handleShop, handleBuy, handleSell } from "./shop";
import { handleWeather } from "./weather";
import { handleProfile, handleInventory, handleLeaderboard } from "./profile";
import { handleRaid, handleRevenge, handleDefense } from "./raid";
import { handleExplore } from "./explore";
import { handlePet } from "./pet";
import { handleQuest } from "./quest";
import { handleGuildCmd } from "./guild";
import { handleMarket, handleAuction } from "./market";
import { handleHelp } from "./help";

function formatCommandError(error: unknown): string {
  if (error && typeof error === "object") {
    const databaseError = error as { code?: string; message?: string };

    switch (databaseError.code) {
      case "42P01":
        return "Database chưa có đủ bảng của bot. Hãy chạy migration rồi thử lại.";
      case "42703":
        return "Database đang thiếu cột cần thiết. Hãy cập nhật schema rồi thử lại.";
      case "23505":
        return "Dữ liệu đã tồn tại, hãy thử lại với thông tin khác.";
      case "28P01":
      case "3D000":
        return "Bot không kết nối được database. Hãy kiểm tra cấu hình database.";
      default:
        break;
    }

    if (databaseError.message?.toLowerCase().includes("connect")) {
      return "Bot không kết nối được database. Hãy kiểm tra database đang hoạt động.";
    }
  }

  return "Lệnh gặp lỗi ngoài dự kiến. Hãy thử lại sau giây lát.";
}

async function replyWithCommandError(msg: Message, content: string) {
  try {
    await msg.reply(`❌ ${content}`);
  } catch (replyError) {
    console.error("Could not send command error reply:", replyError);
  }
}

export async function handleCommand(msg: Message, command: string, args: string[]) {
  try {
    switch (command) {
      // Garden
      case "garden":
      case "vườn":
      case "g":
        return await handleGarden(msg, args);
      case "plant":
      case "trồng":
        return await handleGarden(msg, ["plant", ...args]);
      case "water":
      case "tưới":
        return await handleGarden(msg, ["water", ...args]);
      case "harvest":
      case "thu":
      case "h":
        return await handleGarden(msg, ["harvest", ...args]);

      // Shop & Economy
      case "shop":
      case "cửa_hàng":
      case "s":
        return await handleShop(msg, args);
      case "buy":
      case "mua":
        return await handleBuy(msg, args);
      case "sell":
      case "bán":
        return await handleSell(msg, args);

      // Weather
      case "weather":
      case "thời_tiết":
      case "w":
        return await handleWeather(msg);

      // Profile
      case "profile":
      case "hồ_sơ":
      case "p":
        return await handleProfile(msg, args);
      case "inventory":
      case "kho":
      case "inv":
      case "i":
        return await handleInventory(msg);
      case "top":
      case "leaderboard":
      case "lb":
        return await handleLeaderboard(msg);

      // PvP
      case "raid":
        return await handleRaid(msg, args);
      case "revenge":
      case "báo_thù":
        return await handleRevenge(msg, args);
      case "defense":
      case "phòng_thủ":
      case "def":
        return await handleDefense(msg, args);

      // Exploration
      case "explore":
      case "thám_hiểm":
      case "ex":
        return await handleExplore(msg);

      // Pet
      case "pet":
      case "thú_cưng":
        return await handlePet(msg, args);

      // Quest
      case "quest":
      case "nhiệm_vụ":
      case "q":
        return await handleQuest(msg, args);

      // Guild
      case "guild":
      case "hội":
        return await handleGuildCmd(msg, args);

      // Market
      case "market":
      case "chợ":
        return await handleMarket(msg, args);
      case "auction":
      case "đấu_giá":
        return await handleAuction(msg, args);

      // Help
      case "help":
      case "hướng_dẫn":
      case "hd":
        return await handleHelp(msg);

      default:
        return; // ignore unknown commands
    }
  } catch (err) {
    console.error(`Error handling command ${command}:`, err);
    await replyWithCommandError(msg, formatCommandError(err));
  }
}
