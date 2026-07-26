import { Message } from "discord.js";
import { EmbedBuilder } from "discord.js";
import { getOrCreatePlayer, todayDate } from "../utils/helpers";
import { COLORS, successEmbed, errorEmbed } from "../utils/embed";
import { db } from "@workspace/db";
import { playerQuestsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { DAILY_QUESTS } from "../data/quests_data";
import { addCoins } from "../systems/economy";
import { addToInventory } from "../systems/garden";

// Assign 3 random daily quests to a player (seeded by date for consistency)
function getDailyQuestsForDate(date: string): typeof DAILY_QUESTS {
  // Simple pseudo-random seeded by date string sum
  const seed = date.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const shuffled = [...DAILY_QUESTS];
  let s = seed;
  for (let i = shuffled.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(s) % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }
  return shuffled.slice(0, 3);
}

export async function handleQuest(msg: Message, args: string[]) {
  const player = await getOrCreatePlayer(msg.author.id, msg.author.username);
  const today = todayDate();
  const dailyQuests = getDailyQuestsForDate(today);

  // Ensure quest entries exist
  const existing = await db.select().from(playerQuestsTable)
    .where(and(eq(playerQuestsTable.playerId, player.id), eq(playerQuestsTable.date, today)));

  for (const q of dailyQuests) {
    const has = existing.find(e => e.questId === q.id);
    if (!has) {
      await db.insert(playerQuestsTable).values({
        playerId: player.id,
        questId: q.id,
        progress: 0,
        completed: false,
        date: today,
      });
    }
  }

  const fresh = await db.select().from(playerQuestsTable)
    .where(and(eq(playerQuestsTable.playerId, player.id), eq(playerQuestsTable.date, today)));

  // Claim
  if (args[0]?.toLowerCase() === "claim") {
    const questId = args[1];
    const pq = fresh.find(q => q.questId === questId);
    const qData = DAILY_QUESTS.find(q => q.id === questId);
    if (!pq || !qData) return msg.reply({ embeds: [errorEmbed("Quest không tồn tại!")] });
    if (!pq.completed) return msg.reply({ embeds: [errorEmbed("Quest chưa hoàn thành!")] });
    if (pq.claimedAt) return msg.reply({ embeds: [errorEmbed("Đã nhận thưởng rồi!")] });

    await db.update(playerQuestsTable)
      .set({ claimedAt: new Date() })
      .where(eq(playerQuestsTable.id, pq.id));

    await addCoins(player.id, qData.rewardCoins, qData.rewardExp);
    if (qData.rewardItem) await addToInventory(player.id, qData.rewardItem, 1);

    let rewardMsg = `+${qData.rewardCoins}🪙 +${qData.rewardExp}EXP`;
    if (qData.rewardItem) rewardMsg += ` + vật phẩm đặc biệt!`;

    return msg.reply({ embeds: [successEmbed("Nhận Thưởng Quest!", `${qData.emoji} **${qData.name}**\n${rewardMsg}`)] });
  }

  // View quests
  const lines = dailyQuests.map(q => {
    const pq = fresh.find(e => e.questId === q.id);
    const progress = pq?.progress ?? 0;
    const completed = pq?.completed ?? false;
    const claimed = !!pq?.claimedAt;

    const statusIcon = claimed ? "✅" : completed ? "🎁" : "⏳";
    const bar = `${Math.min(progress, q.target)}/${q.target}`;
    const reward = `${q.rewardCoins}🪙 ${q.rewardExp}EXP${q.rewardItem ? " + vật phẩm" : ""}`;
    const claimHint = completed && !claimed ? `\n   └ \`.quest claim ${q.id}\`` : "";

    return `${statusIcon} ${q.emoji} **${q.name}**\n   └ ${q.description} [${bar}]\n   └ Thưởng: ${reward}${claimHint}`;
  });

  const embed = new EmbedBuilder()
    .setColor(COLORS.info)
    .setTitle("📋 Nhiệm Vụ Hôm Nay")
    .setDescription(lines.join("\n\n"))
    .setFooter({ text: "Reset lúc 0:00 mỗi ngày" })
    .setTimestamp();

  return msg.reply({ embeds: [embed] });
}

export async function updateQuestProgress(playerId: number, type: string, amount: number, itemId?: string) {
  const today = todayDate();
  const dailyQuests = getDailyQuestsForDate(today);
  const matching = dailyQuests.filter(q => q.type === type && (!q.itemFilter || q.itemFilter === itemId));

  for (const q of matching) {
    const pq = await db.select().from(playerQuestsTable)
      .where(and(
        eq(playerQuestsTable.playerId, playerId),
        eq(playerQuestsTable.questId, q.id),
        eq(playerQuestsTable.date, today),
      )).limit(1);

    if (!pq.length || pq[0]!.completed) continue;

    const newProgress = pq[0]!.progress + amount;
    const completed = newProgress >= q.target;

    await db.update(playerQuestsTable)
      .set({ progress: newProgress, completed })
      .where(eq(playerQuestsTable.id, pq[0]!.id));
  }
}
