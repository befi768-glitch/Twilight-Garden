import { pgTable, serial, integer, text, timestamp, boolean, date } from "drizzle-orm/pg-core";
import { playersTable } from "./players";

export const playerQuestsTable = pgTable("player_quests", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull().references(() => playersTable.id, { onDelete: "cascade" }),
  questId: text("quest_id").notNull(),
  progress: integer("progress").notNull().default(0),
  completed: boolean("completed").notNull().default(false),
  claimedAt: timestamp("claimed_at", { withTimezone: true }),
  date: date("date", { mode: "string" }).notNull(), // YYYY-MM-DD for daily reset
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type PlayerQuest = typeof playerQuestsTable.$inferSelect;
