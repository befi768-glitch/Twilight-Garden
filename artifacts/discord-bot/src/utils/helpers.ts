import { db } from "@workspace/db";
import { playersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export async function getOrCreatePlayer(discordId: string, username: string) {
  const existing = await db.select().from(playersTable)
    .where(eq(playersTable.discordId, discordId))
    .limit(1);

  if (existing.length > 0) return existing[0]!;

  const [player] = await db.insert(playersTable).values({
    discordId,
    username,
    coins: 100,
    exp: 0,
    level: 1,
  }).returning();

  return player!;
}

export function formatTime(ms: number): string {
  if (ms <= 0) return "Sẵn sàng!";
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((ms % (1000 * 60)) / 1000);
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function calcLevelExp(level: number): number {
  return level * 100;
}

export function expToLevel(exp: number): number {
  let level = 1;
  let total = 0;
  while (total + calcLevelExp(level) <= exp) {
    total += calcLevelExp(level);
    level++;
  }
  return level;
}

export function progressBar(current: number, max: number, length = 10): string {
  const filled = Math.round((current / max) * length);
  const empty = length - filled;
  return `${"█".repeat(filled)}${"░".repeat(empty)}`;
}

export function todayDate(): string {
  return new Date().toISOString().split("T")[0]!;
}
