import { db } from "@workspace/db";
import { playersTable, inventoryTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { getSeedById } from "../data/seeds";
import { getItemById } from "../data/items";
import { addToInventory } from "./garden";
import { expToLevel } from "../utils/helpers";

export async function sellItems(
  playerId: number,
  itemId: string,
  qty: number,
): Promise<{ success: boolean; message: string; earned?: number }> {
  const inv = await db.select().from(inventoryTable)
    .where(and(eq(inventoryTable.playerId, playerId), eq(inventoryTable.itemId, itemId)))
    .limit(1);

  if (!inv.length || inv[0]!.quantity < qty) {
    return { success: false, message: "Bạn không có đủ số lượng để bán!" };
  }

  // Calculate price
  let priceEach = 0;
  const seed = getSeedById(itemId);
  if (seed) {
    priceEach = seed.sellPrice;
  } else {
    const item = getItemById(itemId);
    if (item) priceEach = item.sellPrice;
  }
  if (priceEach === 0) return { success: false, message: "Mặt hàng này không thể bán!" };

  const totalEarned = priceEach * qty;

  // Remove from inventory
  if (inv[0]!.quantity === qty) {
    await db.delete(inventoryTable).where(eq(inventoryTable.id, inv[0]!.id));
  } else {
    await db.update(inventoryTable)
      .set({ quantity: inv[0]!.quantity - qty })
      .where(eq(inventoryTable.id, inv[0]!.id));
  }

  // Add coins + exp
  const player = await db.select().from(playersTable).where(eq(playersTable.id, playerId)).limit(1);
  if (!player.length) return { success: false, message: "Người chơi không tồn tại!" };

  const newCoins = player[0]!.coins + totalEarned;
  const newExp = player[0]!.exp + Math.floor(totalEarned / 10);
  const newLevel = expToLevel(newExp);

  await db.update(playersTable)
    .set({ coins: newCoins, exp: newExp, level: newLevel })
    .where(eq(playersTable.id, playerId));

  return { success: true, message: `Bán thành công!`, earned: totalEarned };
}

export async function addCoins(playerId: number, amount: number, expGain = 0) {
  const player = await db.select().from(playersTable).where(eq(playersTable.id, playerId)).limit(1);
  if (!player.length) return;
  const newExp = player[0]!.exp + expGain;
  await db.update(playersTable).set({
    coins: player[0]!.coins + amount,
    exp: newExp,
    level: expToLevel(newExp),
  }).where(eq(playersTable.id, playerId));
}

export async function removeCoins(playerId: number, amount: number): Promise<boolean> {
  const player = await db.select().from(playersTable).where(eq(playersTable.id, playerId)).limit(1);
  if (!player.length || player[0]!.coins < amount) return false;
  await db.update(playersTable).set({ coins: player[0]!.coins - amount }).where(eq(playersTable.id, playerId));
  return true;
}

export async function buyItem(
  playerId: number,
  itemId: string,
  qty: number,
): Promise<{ success: boolean; message: string }> {
  const seed = getSeedById(itemId);
  const item = getItemById(itemId);
  const obj = seed || item;
  if (!obj) return { success: false, message: "Vật phẩm không tồn tại!" };

  const totalCost = obj.buyPrice * qty;
  const player = await db.select().from(playersTable).where(eq(playersTable.id, playerId)).limit(1);
  if (!player.length) return { success: false, message: "Người chơi không tồn tại!" };
  if (player[0]!.coins < totalCost) {
    return { success: false, message: `Không đủ tiền! Cần **${totalCost}** 🪙, bạn có **${player[0]!.coins}** 🪙` };
  }

  await db.update(playersTable).set({ coins: player[0]!.coins - totalCost }).where(eq(playersTable.id, playerId));

  const invItemId = seed ? `seed_${itemId}` : itemId;
  await addToInventory(playerId, invItemId, qty);

  return { success: true, message: `Mua thành công **${qty}x ${obj.name}**! (-${totalCost} 🪙)` };
}

export async function getLeaderboard() {
  return db.select({
    username: playersTable.username,
    coins: playersTable.coins,
    level: playersTable.level,
  }).from(playersTable)
    .orderBy(playersTable.coins)
    .limit(10);
}
