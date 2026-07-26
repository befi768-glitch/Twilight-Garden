import { db } from "@workspace/db";
import { weatherLogTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { todayDate } from "../utils/helpers";
import type { Season } from "../data/seeds";

export type WeatherType = "sunny" | "rainy" | "cloudy" | "stormy";

const SEASON_START = new Date("2025-01-01"); // Reference: Jan 1 = start of Spring

export function getCurrentSeason(): Season {
  const now = new Date();
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysSinceStart = Math.floor((now.getTime() - SEASON_START.getTime()) / msPerDay);
  const seasonDay = daysSinceStart % 28; // 28-day cycle (7 days each)
  if (seasonDay < 7) return "spring";
  if (seasonDay < 14) return "summer";
  if (seasonDay < 21) return "autumn";
  return "winter";
}

export function getSeasonEmoji(season: Season): string {
  const map: Record<Season, string> = {
    spring: "🌸", summer: "☀️", autumn: "🍂", winter: "❄️",
  };
  return map[season];
}

export function getSeasonName(season: Season): string {
  const map: Record<Season, string> = {
    spring: "Mùa Xuân", summer: "Mùa Hạ", autumn: "Mùa Thu", winter: "Mùa Đông",
  };
  return map[season];
}

export function getWeatherName(weather: WeatherType): string {
  const map: Record<WeatherType, string> = {
    sunny: "Nắng đẹp ☀️",
    rainy: "Mưa 🌧️",
    cloudy: "Nhiều mây ⛅",
    stormy: "Bão 🌩️",
  };
  return map[weather];
}

function generateWeather(season: Season): WeatherType {
  const rand = Math.random();
  if (season === "spring") {
    if (rand < 0.4) return "sunny";
    if (rand < 0.7) return "rainy";
    if (rand < 0.9) return "cloudy";
    return "stormy";
  }
  if (season === "summer") {
    if (rand < 0.6) return "sunny";
    if (rand < 0.75) return "rainy";
    if (rand < 0.88) return "cloudy";
    return "stormy";
  }
  if (season === "autumn") {
    if (rand < 0.3) return "sunny";
    if (rand < 0.55) return "rainy";
    if (rand < 0.8) return "cloudy";
    return "stormy";
  }
  // winter
  if (rand < 0.2) return "sunny";
  if (rand < 0.45) return "rainy";
  if (rand < 0.75) return "cloudy";
  return "stormy";
}

export async function getTodayWeather(): Promise<{ weather: WeatherType; season: Season }> {
  const today = todayDate();
  const season = getCurrentSeason();

  const rows = await db.select().from(weatherLogTable).where(eq(weatherLogTable.date, today)).limit(1);
  if (rows.length > 0) {
    return { weather: rows[0]!.weather as WeatherType, season };
  }

  const weather = generateWeather(season);
  await db.insert(weatherLogTable).values({ date: today, weather, season });
  return { weather, season };
}

/** Returns growth time multiplier based on weather */
export function getGrowthMultiplier(weather: WeatherType): number {
  const map: Record<WeatherType, number> = {
    sunny: 1.0,
    rainy: 0.8,   // faster (auto-water)
    cloudy: 1.1,  // slightly slower
    stormy: 1.5,  // much slower + risk
  };
  return map[weather];
}

export function isAutoWatered(weather: WeatherType): boolean {
  return weather === "rainy";
}
