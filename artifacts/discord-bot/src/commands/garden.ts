import { Message } from "discord.js";
import { getOrCreatePlayer, formatTime } from "../utils/helpers";
import { gardenEmbed, errorEmbed, successEmbed } from "../utils/embed";
import { getPlayerPlots, plantSeed, waterPlot, harvestPlot, renderGarden } from "../systems/garden";
import { getTodayWeather, getSeasonName, getWeatherName, getSeasonEmoji } from "../systems/weather";
import { db } from "@workspace/db";
import { petsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { getSeedById } from "../data/seeds";

export async function handleGarden(msg: Message, args: string[]) {
  const player = await getOrCreatePlayer(msg.author.id, msg.author.username);
  const sub = args[0]?.toLowerCase();

  if (!sub || sub === "view" || sub === "xem") {
    const plots = await getPlayerPlots(player.id);
    const { weather, season } = await getTodayWeather();
    const now = Date.now();

    const gardenDisplay = renderGarden(plots, weather);

    const plotLines = plots.map((p, i) => {
      if (p.isLocked) return `**Ô ${i + 1}:** 🔒 Bị khóa`;
      if (!p.seedType) return `**Ô ${i + 1}:** 🟫 Trống`;
      const seed = getSeedById(p.seedType);
      if (!seed || !p.plantedAt) return `**Ô ${i + 1}:** 🌱 Đang trồng...`;

      const readyAt = p.plantedAt.getTime() + seed.growTimeMs;
      const isReady = now >= readyAt;
      const isWatered = p.wateredAt && p.wateredAt > p.plantedAt;
      const timeLeft = isReady ? "✅ Sẵn thu hoạch!" : `⏰ ${formatTime(readyAt - now)}`;
      return `**Ô ${i + 1}:** ${seed.emoji} ${seed.name} ${isWatered ? "💧" : "🌵"} — ${timeLeft}`;
    });

    const embed = gardenEmbed(
      `Vườn của ${msg.author.username}`,
      `${getSeasonEmoji(season)} **${getSeasonName(season)}** | ${getWeatherName(weather)}\n\n${gardenDisplay}\n\n${plotLines.join("\n")}`
    ).addFields(
      { name: "💰 Tiền", value: `${player.coins} 🪙`, inline: true },
      { name: "⭐ Level", value: `${player.level}`, inline: true },
    ).setFooter({ text: ".plant <cây> <ô> | .water <ô> | .harvest <ô>" });

    return msg.reply({ embeds: [embed] });
  }

  if (sub === "plant" || sub === "trồng") {
    const seedId = args[1];
    const pos = parseInt(args[2] ?? "");
    if (!seedId || isNaN(pos) || pos < 1 || pos > 6) {
      return msg.reply({ embeds: [errorEmbed("Dùng: `.plant <tên_cây> <ô 1-6>`\nVí dụ: `.plant carrot 1`")] });
    }
    const result = await plantSeed(player.id, pos - 1, seedId);
    const embed = result.success ? successEmbed("Trồng cây", result.message) : errorEmbed(result.message);
    return msg.reply({ embeds: [embed] });
  }

  if (sub === "water" || sub === "tưới") {
    const pos = parseInt(args[1] ?? "");
    if (isNaN(pos) || pos < 1 || pos > 6) {
      return msg.reply({ embeds: [errorEmbed("Dùng: `.water <ô 1-6>`\nVí dụ: `.water 1`")] });
    }
    const result = await waterPlot(player.id, pos - 1);
    const embed = result.success ? successEmbed("Tưới nước", result.message) : errorEmbed(result.message);
    return msg.reply({ embeds: [embed] });
  }

  if (sub === "harvest" || sub === "thu") {
    const pos = parseInt(args[1] ?? "");
    if (isNaN(pos) || pos < 1 || pos > 6) {
      return msg.reply({ embeds: [errorEmbed("Dùng: `.harvest <ô 1-6>`\nVí dụ: `.harvest 1`")] });
    }
    const pets = await db.select().from(petsTable).where(eq(petsTable.playerId, player.id));
    const passives = pets.map(p => p.type);
    const result = await harvestPlot(player.id, pos - 1, passives);

    if (!result.success) return msg.reply({ embeds: [errorEmbed(result.message)] });

    let desc = result.message;
    if (result.items && result.items.length > 0) {
      desc += `\n🎁 Bonus: ${result.items.join(", ")}`;
    }
    return msg.reply({ embeds: [successEmbed("Thu hoạch!", desc)] });
  }

  return msg.reply({ embeds: [errorEmbed("Lệnh không hợp lệ!\n`.garden view` | `.plant` | `.water` | `.harvest`")] });
}
