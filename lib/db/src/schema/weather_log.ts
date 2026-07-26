import { pgTable, serial, text, date } from "drizzle-orm/pg-core";

export const weatherLogTable = pgTable("weather_log", {
  id: serial("id").primaryKey(),
  date: date("date", { mode: "string" }).notNull().unique(),
  weather: text("weather").notNull(), // sunny, rainy, cloudy, stormy
  season: text("season").notNull(),   // spring, summer, autumn, winter
});

export type WeatherLog = typeof weatherLogTable.$inferSelect;
