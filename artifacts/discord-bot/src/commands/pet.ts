import { Message } from "discord.js";
import { EmbedBuilder } from "discord.js";
import { getOrCreatePlayer } from "../utils/helpers";
import { COLORS, errorEmbed, successEmbed } from "../utils/embed";
import { db } from "@workspace/db";
import { petsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { PETS } from "../data/pets_data";
import { removeFromInventory } from "../systems/garden";

export async function handlePet(msg: Message, args: string[]) {
  const player = await getOrCreatePlayer(msg.author.id, msg.author.username);
  const sub = args[0]?.toLowerCase();

  const pets = await db.select().from(petsTable).where(eq(petsTable.playerId, player.id));

  if (!sub || sub === "view" || sub === "xem") {
    if (!pets.length) {
      const embed = new EmbedBuilder()
        .setColor(COLORS.info)
        .setTitle("🐾 Thú Cưng Của Bạn")
        .setDescription("Chưa có thú cưng! Mua ở `.shop pet`");
      return msg.reply({ embeds: [embed] });
    }

    const lines = pets.map(p => {
      const pd = PETS[p.type];
      const happinessBar = "❤️".repeat(Math.ceil(p.happiness / 20));
      return `${pd?.emoji ?? "🐾"} **${p.name}** (Lv.${p.level})\n   └ 😊 ${p.happiness}/100 ${happinessBar}\n   └ 🎯 ${pd?.ability ?? "?"}`;
    });

    const embed = new EmbedBuilder()
      .setColor(COLORS.garden)
      .setTitle("🐾 Thú Cưng Của Bạn")
      .setDescription(lines.join("\n\n"))
      .setFooter({ text: ".pet feed <loại> — cho ăn" })
      .setTimestamp();

    return msg.reply({ embeds: [embed] });
  }

  if (sub === "feed" || sub === "cho_ăn") {
    const type = args[1];
    if (!type) return msg.reply({ embeds: [errorEmbed("Dùng: `.pet feed <loại>`")] });

    const pet = pets.find(p => p.type === type);
    if (!pet) return msg.reply({ embeds: [errorEmbed("Bạn không có thú cưng này!")] });

    const hasFood = await removeFromInventory(player.id, "pet_food", 1);
    if (!hasFood) return msg.reply({ embeds: [errorEmbed("Không có đồ ăn! Mua ở `.shop`")] });

    const newHappiness = Math.min(100, pet.happiness + 30);
    await db.update(petsTable)
      .set({ happiness: newHappiness, lastFed: new Date() })
      .where(eq(petsTable.id, pet.id));

    return msg.reply({ embeds: [successEmbed("Cho Ăn", `${PETS[pet.type]?.emoji} **${pet.name}** đã ăn no! Happiness: ${newHappiness}/100 ❤️`)] });
  }

  if (sub === "rename" || sub === "đổi_tên") {
    const type = args[1];
    const newName = args.slice(2).join(" ");
    if (!type || !newName) return msg.reply({ embeds: [errorEmbed("Dùng: `.pet rename <loại> <tên mới>`")] });

    const pet = pets.find(p => p.type === type);
    if (!pet) return msg.reply({ embeds: [errorEmbed("Không có thú cưng này!")] });

    await db.update(petsTable).set({ name: newName }).where(eq(petsTable.id, pet.id));
    return msg.reply({ embeds: [successEmbed("Đổi Tên", `${PETS[pet.type]?.emoji} Đặt tên mới: **${newName}**!`)] });
  }

  return msg.reply({ embeds: [errorEmbed("`.pet` — xem | `.pet feed <loại>` — cho ăn | `.pet rename <loại> <tên>` — đổi tên")] });
}
