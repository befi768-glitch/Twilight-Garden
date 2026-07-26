import { db } from "@workspace/db";
import { plotsTable, inventoryTable, playerQuestsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { SEEDS, getSeedById } from "../data/seeds";
import { getOrCreatePlayer, randomInt, todayDate } from "../utils/helpers";
import { getTodayWeather, getGrowthMultiplier, isAutoWatered } from "./weather";
import type { Player } from "@workspace/db";

const BASE_PLOTS = 3;
const MAX_PLOTS = 6;

export async function getPlayerPlots(playerId: number) {
  const plots = await db.select().from(plotsTable)
    .where(eq(plotsTable.playerId, playerId))
    .orderBy(plotsTable.position);

  // Ensure base plots exist
  if (plots.length === 0) {
    const newPlots = [];
    for (let i = 0; i < BASE_PLOTS; i++) {
      newPlots.push({ playerId, position: i, isLocked: false });
    }
    // locked extra slots
    for (let i = BASE_PLOTS; i < MAX_PLOTS; i++) {
      newPlots.push({ playerId, position: i, isLocked: true });
    }
    await db.insert(plotsTable).values(newPlots);
    return db.select().from(plotsTable).where(eq(plotsTable.playerId, playerId)).orderBy(plotsTable.position);
  }
  return plots;
}

export async function plantSeed(
  playerId: number,
  position: number,
  seedId: string,
): Promise<{ success: boolean; message: string }> {
  const seed = getSeedById(seedId);
  if (!seed) return { success: false, message: "Hạt giống không tồn tại!" };

  const plots = await getPlayerPlots(playerId);
  const plot = plots.find(p => p.position === position);
  if (!plot) return { success: false, message: "Ô đất không tồn tại!" };
  if (plot.isLocked) return { success: false, message: "Ô đất bị khóa! Dùng `.shop` mua Giấy mở đất." };
  if (plot.seedType) return { success: false, message: "Ô đất đã có cây! Thu hoạch trước." };

  const { season } = await getTodayWeather();
  if (!seed.seasons.includes(season)) {
    return { success: false, message: `${seed.name} chỉ trồng được vào ${seed.seasons.join(", ")}!` };
  }

  // Check inventory for seed
  const inv = await db.select().from(inventoryTable)
    .where(and(eq(inventoryTable.playerId, playerId), eq(inventoryTable.itemId, `seed_${seedId}`)))
    .limit(1);
  if (!inv.length || inv[0]!.quantity < 1) {
    return { success: false, message: `Bạn không có hạt giống ${seed.name}! Mua ở \`.shop\`` };
  }

  await db.update(plotsTable)
    .set({ seedType: seedId, plantedAt: new Date(), wateredAt: null, fertilizedAt: null })
    .where(eq(plotsTable.id, plot.id));

  // Remove seed from inventory
  if (inv[0]!.quantity === 1) {
    await db.delete(inventoryTable).where(eq(inventoryTable.id, inv[0]!.id));
  } else {
    await db.update(inventoryTable)
      .set({ quantity: inv[0]!.quantity - 1 })
      .where(eq(inventoryTable.id, inv[0]!.id));
  }

  return { success: true, message: `Đã trồng ${seed.emoji} ${seed.name} vào ô ${position + 1}!` };
}

export async function waterPlot(
  playerId: number,
  position: number,
): Promise<{ success: boolean; message: string }> {
  const plots = await getPlayerPlots(playerId);
  const plot = plots.find(p => p.position === position);
  if (!plot) return { success: false, message: "Ô đất không tồn tại!" };
  if (!plot.seedType) return { success: false, message: "Ô đất trống!" };

  const now = new Date();
  if (plot.wateredAt) {
    const nextWater = new Date(plot.wateredAt.getTime() + 4 * 60 * 60 * 1000);
    if (now < nextWater) {
      const remaining = nextWater.getTime() - now.getTime();
      const mins = Math.ceil(remaining / 60000);
      return { success: false, message: `Cây đã được tưới! Chờ ${mins} phút nữa.` };
    }
  }

  await db.update(plotsTable).set({ wateredAt: now }).where(eq(plotsTable.id, plot.id));
  return { success: true, message: `Đã tưới ô ${position + 1}! 💧` };
}

export async function harvestPlot(
  playerId: number,
  position: number,
  petPassives: string[],
): Promise<{ success: boolean; message: string; earned?: number; items?: string[] }> {
  const { weather } = await getTodayWeather();
  const plots = await getPlayerPlots(playerId);
  const plot = plots.find(p => p.position === position);
  if (!plot || !plot.seedType) return { success: false, message: "Không có gì để thu hoạch!" };

  const seed = getSeedById(plot.seedType);
  if (!seed) return { success: false, message: "Lỗi: hạt giống không xác định!" };

  if (!plot.plantedAt) return { success: false, message: "Cây chưa được trồng!" };

  const growMultiplier = getGrowthMultiplier(weather);
  const effectiveGrowTime = seed.growTimeMs * growMultiplier;

  // Fertilizer: halve grow time
  const fertilizedBoost = plot.fertilizedAt ? 0.5 : 1.0;
  const finalGrowTime = effectiveGrowTime * fertilizedBoost;

  const autoWatered = isAutoWatered(weather);
  const isWatered = autoWatered || (plot.wateredAt && plot.wateredAt > plot.plantedAt);

  if (!isWatered) {
    // Unwatered = +30% grow time
  }

  const readyAt = new Date(plot.plantedAt.getTime() + finalGrowTime);
  if (new Date() < readyAt) {
    const remaining = readyAt.getTime() - Date.now();
    const mins = Math.ceil(remaining / 60000);
    return { success: false, message: `Cây chưa chín! Còn ${mins} phút nữa. 🌱` };
  }

  // Calculate yield
  let yieldAmount = randomInt(seed.yieldMin, seed.yieldMax);
  if (petPassives.includes("yield_boost")) yieldAmount = Math.ceil(yieldAmount * 1.15);

  // Add to inventory
  await addToInventory(playerId, seed.id, yieldAmount);

  // Rare seed from rabbit
  const extraItems: string[] = [];
  if (petPassives.includes("seed_finder") && Math.random() < 0.1) {
    const rareSeeds = Object.values(SEEDS).filter(s => s.rarity === "rare" || s.rarity === "legendary");
    if (rareSeeds.length > 0) {
      const rareSeed = rareSeeds[Math.floor(Math.random() * rareSeeds.length)]!;
      await addToInventory(playerId, `seed_${rareSeed.id}`, 1);
      extraItems.push(`${rareSeed.emoji} Hạt ${rareSeed.name}`);
    }
  }

  // Clear plot
  await db.update(plotsTable)
    .set({ seedType: null, plantedAt: null, wateredAt: null, fertilizedAt: null, harvestCount: (plot.harvestCount || 0) + 1 })
    .where(eq(plotsTable.id, plot.id));

  // Update quest progress
  await updateQuestProgress(playerId, "harvest", 1, seed.id);

  return {
    success: true,
    message: `Thu hoạch ${seed.emoji} **${yieldAmount}x ${seed.name}**!`,
    earned: yieldAmount * seed.sellPrice,
    items: extraItems,
  };
}

export async function addToInventory(playerId: number, itemId: string, qty: number) {
  const existing = await db.select().from(inventoryTable)
    .where(and(eq(inventoryTable.playerId, playerId), eq(inventoryTable.itemId, itemId)))
    .limit(1);

  if (existing.length > 0) {
    await db.update(inventoryTable)
      .set({ quantity: existing[0]!.quantity + qty })
      .where(eq(inventoryTable.id, existing[0]!.id));
  } else {
    await db.insert(inventoryTable).values({ playerId, itemId, quantity: qty });
  }
}

export async function removeFromInventory(playerId: number, itemId: string, qty: number): Promise<boolean> {
  const existing = await db.select().from(inventoryTable)
    .where(and(eq(inventoryTable.playerId, playerId), eq(inventoryTable.itemId, itemId)))
    .limit(1);
  if (!existing.length || existing[0]!.quantity < qty) return false;
  if (existing[0]!.quantity === qty) {
    await db.delete(inventoryTable).where(eq(inventoryTable.id, existing[0]!.id));
  } else {
    await db.update(inventoryTable)
      .set({ quantity: existing[0]!.quantity - qty })
      .where(eq(inventoryTable.id, existing[0]!.id));
  }
  return true;
}

export async function updateQuestProgress(playerId: number, type: string, amount: number, itemId?: string) {
  const today = todayDate();
  const quests = await db.select().from(playerQuestsTable)
    .where(and(eq(playerQuestsTable.playerId, playerId), eq(playerQuestsTable.date, today)));

  for (const pq of quests) {
    if (pq.completed) continue;
    // We'll let the quest command handle this in detail
  }
}

export function renderGarden(plots: Awaited<ReturnType<typeof getPlayerPlots>>, weather: string): string {
  const plotEmojis = plots.map(p => {
    if (p.isLocked) return "🔒";
    if (!p.seedType) return "🟫";
    const seed = getSeedById(p.seedType);
    if (!seed) return "🌱";
    const isWatered = p.wateredAt && p.plantedAt && p.wateredAt > p.plantedAt;
    return isWatered ? `${seed.emoji}💧` : seed.emoji;
  });

  const rows = [];
  for (let i = 0; i < plotEmojis.length; i += 3) {
    rows.push(plotEmojis.slice(i, i + 3).join(" "));
  }
  return rows.join("\n");
}
