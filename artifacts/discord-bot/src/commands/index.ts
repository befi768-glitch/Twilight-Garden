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
    await msg.reply("❌ Có lỗi xảy ra! Thử lại sau nhé.");
  }
}
