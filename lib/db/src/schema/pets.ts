import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { playersTable } from "./players";

export const petsTable = pgTable("pets", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull().references(() => playersTable.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // bee, worm, cat, dog, rabbit
  name: text("name").notNull(),
  level: integer("level").notNull().default(1),
  happiness: integer("happiness").notNull().default(100),
  lastFed: timestamp("last_fed", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPetSchema = createInsertSchema(petsTable).omit({ id: true, createdAt: true });
export type InsertPet = z.infer<typeof insertPetSchema>;
export type Pet = typeof petsTable.$inferSelect;
