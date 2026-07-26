import { db } from "@workspace/db";
import { raidsTable, defensesTable, playersTable, inventoryTable, petsTable } from "@workspace/db";
import { eq, and, desc, gte } from "drizzle-orm";
import { randomInt } from "../utils/helpers";
import { addCoins, removeCoins } from "./economy";

const RAID_COOLDOWN_MS = 2 * 60 * 60 * 1000; // 2 hours
const REVENGE_WINDOW_MS = 24 * 60 * 60 * 1000;

export async function canRaid(attackerId: number): Promise<{ canRaid: boolean; cooldownMs?: number }> {
  const lastRaid = await db.select().from(raidsTable)
    .where(eq(raidsTable.attackerId, attackerId))
    .orderBy(desc(raidsTable.createdAt))
    .limit(1);

  if (!lastRaid.length) return { canRaid: true };

  const elapsed = Date.now() - lastRaid[0]!.createdAt.getTime();
  if (elapsed < RAID_COOLDOWN_MS) {
    return { canRaid: false, cooldownMs: RAID_COOLDOWN_MS - elapsed };
  }
  return { canRaid: true };
}

export async function performRaid(
  attackerId: number,
  defenderId: number,
  attackerPetPassives: string[],
  hasLuckyCharm: boolean,
): Promise<{
  success: boolean;
  loot: number;
  lootItems: string;
  message: string;
}> {
  // Calculate base success rate
  let successRate = 0.45;

  // Attacker bonuses
  if (attackerPetPassives.includes("explore_boost")) successRate += 0.05;
  if (hasLuckyCharm) successRate += 0.20;

  // Defender defenses
  const defenses = await db.select().from(defensesTable)
    .where(eq(defensesTable.playerId, defenderId));

  for (const d of defenses) {
    if (d.type === "fence") successRate -= 0.20;
    if (d.type === "scarecrow") successRate -= 0.10;
    if (d.type === "trap") {
      // Trap: 30% chance to fail and trap attacker
      if (Math.random() < 0.30) {
        await logRaid(attackerId, defenderId, false, 0, "bẫy");
        return {
          success: false,
          loot: 0,
          lootItems: "",
          message: "💀 Bạn bị dính bẫy! Raid thất bại và mất 2h cooldown thêm.",
        };
      }
      successRate -= 0.10;
    }
  }

  // Defender pet bonuses
  const defPets = await db.select().from(petsTable).where(eq(petsTable.playerId, defenderId));
  const defPassives = defPets.map(p => p.type);
  if (defPassives.includes("cat")) successRate -= 0.40;
  if (defPassives.includes("dog")) successRate -= 0.25;

  successRate = Math.max(0.05, Math.min(0.90, successRate));

  const success = Math.random() < successRate;

  if (!success) {
    await logRaid(attackerId, defenderId, false, 0, "");
    return { success: false, loot: 0, lootItems: "", message: "Raid thất bại! Bạn bị phát hiện." };
  }

  // Calculate loot: 10-30% of defender's coins
  const defender = await db.select().from(playersTable).where(eq(playersTable.id, defenderId)).limit(1);
  if (!defender.length) return { success: false, loot: 0, lootItems: "", message: "Mục tiêu không tồn tại!" };

  const lootPct = (randomInt(10, 30)) / 100;
  const loot = Math.floor(defender[0]!.coins * lootPct);
  const actualLoot = Math.min(loot, defender[0]!.coins);

  if (actualLoot > 0) {
    await removeCoins(defenderId, actualLoot);
    await addCoins(attackerId, actualLoot, 10);
  }

  await logRaid(attackerId, defenderId, true, actualLoot, "");
  return {
    success: true,
    loot: actualLoot,
    lootItems: "",
    message: `Raid thành công! Cướp được **${actualLoot}** 🪙!`,
  };
}

async function logRaid(attackerId: number, defenderId: number, success: boolean, loot: number, lootItems: string) {
  await db.insert(raidsTable).values({ attackerId, defenderId, success, loot, lootItems });
}

export async function getDefenses(playerId: number) {
  return db.select().from(defensesTable).where(eq(defensesTable.playerId, playerId));
}

export async function addDefense(playerId: number, type: string) {
  const existing = await db.select().from(defensesTable)
    .where(and(eq(defensesTable.playerId, playerId), eq(defensesTable.type, type)))
    .limit(1);
  if (existing.length) {
    await db.update(defensesTable)
      .set({ level: existing[0]!.level + 1, durability: 100 })
      .where(eq(defensesTable.id, existing[0]!.id));
  } else {
    await db.insert(defensesTable).values({ playerId, type });
  }
}

export async function canRevenge(attackerId: number, defenderId: number): Promise<boolean> {
  const recent = await db.select().from(raidsTable)
    .where(and(
      eq(raidsTable.attackerId, defenderId),
      eq(raidsTable.defenderId, attackerId),
      gte(raidsTable.createdAt, new Date(Date.now() - REVENGE_WINDOW_MS)),
    ))
    .limit(1);
  return recent.length > 0;
}
