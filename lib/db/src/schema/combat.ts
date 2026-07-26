import { pgTable, serial, integer, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { playersTable } from "./players";

export const raidsTable = pgTable("raids", {
  id: serial("id").primaryKey(),
  attackerId: integer("attacker_id").notNull().references(() => playersTable.id),
  defenderId: integer("defender_id").notNull().references(() => playersTable.id),
  success: boolean("success").notNull(),
  loot: integer("loot").notNull().default(0),
  lootItems: text("loot_items").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const defensesTable = pgTable("defenses", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull().references(() => playersTable.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // fence, scarecrow, trap, guard_dog
  level: integer("level").notNull().default(1),
  durability: integer("durability").notNull().default(100),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type Raid = typeof raidsTable.$inferSelect;
export type Defense = typeof defensesTable.$inferSelect;
