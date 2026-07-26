import { Message } from "discord.js";
import { EmbedBuilder } from "discord.js";
import { getOrCreatePlayer } from "../utils/helpers";
import { COLORS } from "../utils/embed";
import { getTodayWeather, getSeasonName, getWeatherName, getSeasonEmoji, getGrowthMultiplier, isAutoWatered } from "../systems/weather";
import { SEEDS } from "../data/seeds";

export async function handleWeather(msg: Message) {
  const { weather, season } = await getTodayWeather();
  const growMul = getGrowthMultiplier(weather);
  const autoWater = isAutoWatered(weather);

  const availableSeeds = Object.values(SEEDS).filter(s => s.seasons.includes(season));
  const seedList = availableSeeds.map(s => `${s.emoji} ${s.name}`).join(" | ");

  const effectStr = [
    autoWater ? "💧 **Tự động tưới nước** cho tất cả cây!" : null,
    growMul < 1 ? `⚡ Cây lớn nhanh hơn **${Math.round((1 - growMul) * 100)}%**!` : null,
    growMul > 1 ? `🐢 Cây lớn chậm hơn **${Math.round((growMul - 1) * 100)}%**!` : null,
    weather === "stormy" ? "⚠️ Bão có thể gây hại cho cây chưa trưởng thành!" : null,
    growMul === 1 ? "✅ Điều kiện bình thường" : null,
  ].filter(Boolean).join("\n");

  const weatherColors: Record<string, number> = {
    sunny: 0xf9ca24,
    rainy: 0x74b9ff,
    cloudy: 0xb2bec3,
    stormy: 0x636e72,
  };

  const embed = new EmbedBuilder()
    .setColor((weatherColors[weather] ?? COLORS.info) as any)
    .setTitle(`🌤️ Thời Tiết Hôm Nay`)
    .setDescription(
      `**${getWeatherName(weather)}**\n${getSeasonEmoji(season)} **${getSeasonName(season)}**\n\n${effectStr}`
    )
    .addFields(
      { name: "🌱 Cây Trồng Được Mùa Này", value: seedList || "Không có", inline: false },
    )
    .setTimestamp()
    .setFooter({ text: "Thời tiết thay đổi mỗi ngày lúc 0:00" });

  return msg.reply({ embeds: [embed] });
}
