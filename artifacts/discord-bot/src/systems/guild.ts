import { db } from "@workspace/db";
import { guildsTable, guildMembersTable, playersTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { addCoins, removeCoins } from "./economy";

export async function createGuild(
  ownerId: number,
  discordGuildId: string,
  name: string,
): Promise<{ success: boolean; message: string }> {
  const existing = await db.select().from(guildMembersTable).where(eq(guildMembersTable.playerId, ownerId)).limit(1);
  if (existing.length) return { success: false, message: "Bạn đã ở trong một hội rồi!" };

  const [guild] = await db.insert(guildsTable).values({
    discordGuildId, name, ownerId,
  }).returning();
  await db.insert(guildMembersTable).values({ guildId: guild!.id, playerId: ownerId, role: "owner" });

  return { success: true, message: `Tạo hội **${name}** thành công!` };
}

export async function joinGuild(
  playerId: number,
  guildId: number,
): Promise<{ success: boolean; message: string }> {
  const existing = await db.select().from(guildMembersTable).where(eq(guildMembersTable.playerId, playerId)).limit(1);
  if (existing.length) return { success: false, message: "Bạn đã ở trong hội khác!" };

  const guild = await db.select().from(guildsTable).where(eq(guildsTable.id, guildId)).limit(1);
  if (!guild.length) return { success: false, message: "Hội không tồn tại!" };

  await db.insert(guildMembersTable).values({ guildId, playerId, role: "member" });
  return { success: true, message: `Gia nhập hội **${guild[0]!.name}** thành công!` };
}

export async function donateToGuild(
  playerId: number,
  amount: number,
): Promise<{ success: boolean; message: string }> {
  const member = await db.select().from(guildMembersTable).where(eq(guildMembersTable.playerId, playerId)).limit(1);
  if (!member.length) return { success: false, message: "Bạn chưa ở trong hội nào!" };

  const ok = await removeCoins(playerId, amount);
  if (!ok) return { success: false, message: "Không đủ tiền!" };

  await db.update(guildsTable)
    .set({ bank: sql`bank + ${amount}` as any })
    .where(eq(guildsTable.id, member[0]!.guildId));

  await db.update(guildMembersTable)
    .set({ contribution: member[0]!.contribution + amount })
    .where(eq(guildMembersTable.id, member[0]!.id));

  return { success: true, message: `Đã đóng góp **${amount}** 🪙 cho hội!` };
}

export async function getPlayerGuild(playerId: number) {
  const member = await db.select().from(guildMembersTable).where(eq(guildMembersTable.playerId, playerId)).limit(1);
  if (!member.length) return null;
  const guild = await db.select().from(guildsTable).where(eq(guildsTable.id, member[0]!.guildId)).limit(1);
  return guild[0] ?? null;
}

export async function getGuildMembers(guildId: number) {
  return db.select({
    role: guildMembersTable.role,
    contribution: guildMembersTable.contribution,
    username: playersTable.username,
    level: playersTable.level,
  }).from(guildMembersTable)
    .innerJoin(playersTable, eq(guildMembersTable.playerId, playersTable.id))
    .where(eq(guildMembersTable.guildId, guildId));
}
