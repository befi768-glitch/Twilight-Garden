import { Message } from "discord.js";
import { getOrCreatePlayer, formatTime } from "../utils/helpers";
import { exploreEmbed, errorEmbed } from "../utils/embed";
import { explore } from "../systems/exploration";
import { db } from "@workspace/db";
import { petsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const exploreCooldowns = new Map<number, number>();
const EXPLORE_COOLDOWN = 30 * 60 * 1000; // 30 minutes

export async function handleExplore(msg: Message) {
  const player = await getOrCreatePlayer(msg.author.id, msg.author.username);

  const lastExplore = exploreCooldowns.get(player.id);
  if (lastExplore) {
    const elapsed = Date.now() - lastExplore;
    if (elapsed < EXPLORE_COOLDOWN) {
      const remaining = EXPLORE_COOLDOWN - elapsed;
      return msg.reply({ embeds: [errorEmbed(`Bạn đang nghỉ ngơi! Còn **${formatTime(remaining)}** nữa.`)] });
    }
  }

  exploreCooldowns.set(player.id, Date.now());

  const pets = await db.select().from(petsTable).where(eq(petsTable.playerId, player.id));
  const passives = pets.map(p => p.type);

  const result = await explore(player.id, passives);

  const itemLines = result.items.map(i => `${i.emoji} **${i.qty}x ${i.name}**`);

  let desc = `${result.emoji} **${result.location}**\n\n*${result.story}*\n\n`;
  desc += `💰 Nhận được **${result.coins}** 🪙\n`;
  desc += `✨ +${result.exp} EXP\n`;
  if (itemLines.length > 0) {
    desc += `🎁 Vật phẩm: ${itemLines.join(", ")}`;
  }

  const embed = exploreEmbed("Thám Hiểm!", desc);
  embed.setFooter({ text: `Cooldown: 30 phút` });

  return msg.reply({ embeds: [embed] });
}
