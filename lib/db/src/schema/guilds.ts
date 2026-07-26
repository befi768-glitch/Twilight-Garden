import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { playersTable } from "./players";

export const guildsTable = pgTable("guilds", {
  id: serial("id").primaryKey(),
  discordGuildId: text("discord_guild_id").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  level: integer("level").notNull().default(1),
  bank: integer("bank").notNull().default(0),
  exp: integer("exp").notNull().default(0),
  ownerId: integer("owner_id").notNull().references(() => playersTable.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const guildMembersTable = pgTable("guild_members", {
  id: serial("id").primaryKey(),
  guildId: integer("guild_id").notNull().references(() => guildsTable.id, { onDelete: "cascade" }),
  playerId: integer("player_id").notNull().references(() => playersTable.id, { onDelete: "cascade" }),
  role: text("role").notNull().default("member"), // owner, officer, member
  contribution: integer("contribution").notNull().default(0),
  joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Guild = typeof guildsTable.$inferSelect;
export type GuildMember = typeof guildMembersTable.$inferSelect;
export const insertGuildSchema = createInsertSchema(guildsTable).omit({ id: true, createdAt: true });
export type InsertGuild = z.infer<typeof insertGuildSchema>;
