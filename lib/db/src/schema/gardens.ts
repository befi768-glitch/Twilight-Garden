import { pgTable, serial, integer, text, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { playersTable } from "./players";

export const plotsTable = pgTable("plots", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull().references(() => playersTable.id, { onDelete: "cascade" }),
  position: integer("position").notNull(), // 0-5
  seedType: text("seed_type"),             // null = empty
  plantedAt: timestamp("planted_at", { withTimezone: true }),
  wateredAt: timestamp("watered_at", { withTimezone: true }),
  fertilizedAt: timestamp("fertilized_at", { withTimezone: true }),
  harvestCount: integer("harvest_count").notNull().default(0),
  isLocked: boolean("is_locked").notNull().default(false), // premium plots
});

export const insertPlotSchema = createInsertSchema(plotsTable).omit({ id: true });
export type InsertPlot = z.infer<typeof insertPlotSchema>;
export type Plot = typeof plotsTable.$inferSelect;

// Guild farm plots
export const guildPlotsTable = pgTable("guild_plots", {
  id: serial("id").primaryKey(),
  guildId: integer("guild_id").notNull(),
  position: integer("position").notNull(),
  seedType: text("seed_type"),
  plantedBy: integer("planted_by"), // playerId
  plantedAt: timestamp("planted_at", { withTimezone: true }),
  wateredAt: timestamp("watered_at", { withTimezone: true }),
});

export type GuildPlot = typeof guildPlotsTable.$inferSelect;
