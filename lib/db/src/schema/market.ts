import { pgTable, serial, integer, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { playersTable } from "./players";

export const auctionsTable = pgTable("auctions", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id").notNull().references(() => playersTable.id),
  itemId: text("item_id").notNull(),
  quantity: integer("quantity").notNull().default(1),
  startPrice: integer("start_price").notNull(),
  currentPrice: integer("current_price").notNull(),
  buyerId: integer("buyer_id").references(() => playersTable.id),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  sold: boolean("sold").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Auction = typeof auctionsTable.$inferSelect;
