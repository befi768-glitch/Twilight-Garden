import { Message } from 'discord.js';
import { Command } from '../../client';
import { PlayerService } from '../../services/PlayerService';
import { NpcService, NPCS } from '../../services/NpcService';
import { createEmbed, errorEmbed, successEmbed } from '../../utils/embed';
import { formatNumber } from '../../utils/helpers';

const NPC_RELATION_COLORS: Record<string, number> = {
  stranger: 0x888888, acquaintance: 0x5dade2, friend: 0x2ecc71,
  close_friend: 0xf39c12, rival: 0xe74c3c, beloved: 0xff69b4,
};

const HELP = [
  '**NPC Commands:**',
  '`.npc list` — View all NPCs',
  '`.npc talk <npcId>` — Talk to an NPC',
  '`.npc gift <npcId> <itemId>` — Give a gift',
  '`.npc relations` — View your relationships',
].join('\n');

export const command: Command = {
  name: 'npc',

  async execute(message: Message, args: string[]) {
    const sub = args[0]?.toLowerCase();
    if (!sub) return void message.reply(HELP);

    await message.channel.sendTyping();
    const player = await PlayerService.getOrCreate(message.author.id, message.guildId!, message.author.username);

    if (sub === 'list') {
      const lines = Object.values(NPCS).map((n) =>
        `${n.emoji} **${n.name}** [\`${n.id}\`] — *${n.title}*\n📍 ${n.location} · ${n.description}`
      );
      return void message.reply({ embeds: [createEmbed({ title: '👥 Twilight NPCs', description: lines.join('\n\n'), color: 0x16a085 })] });
    }

    if (sub === 'talk') {
      const npcId = args[1];
      if (!npcId) return void message.reply({ embeds: [errorEmbed('Usage: `.npc talk <npcId>` — Use `.npc list` to see NPC IDs.')] });
      const npc = NPCS[npcId];
      if (!npc) return void message.reply({ embeds: [errorEmbed(`Unknown NPC \`${npcId}\`. Use \`.npc list\` to see options.`)] });
      try {
        const result = await NpcService.talk(player.id, npcId);
        const relation = await NpcService.getOrCreateRelation(player.id, npcId);
        const embed = createEmbed({
          title: `${npc.emoji} ${npc.name} says:`,
          description: `*"${result.dialogue}"*`,
          color: NPC_RELATION_COLORS[relation.relation] ?? 0x888888,
        }).addFields(
          { name: '💬 Relation', value: `${relation.relation} (${formatNumber(relation.relationScore)} pts)`, inline: true },
          { name: '✨ Gained', value: result.relationGain > 0 ? `+${result.relationGain} relation` : 'No change', inline: true },
        );
        return void message.reply({ embeds: [embed] });
      } catch (err) {
        return void message.reply({ embeds: [errorEmbed(String(err instanceof Error ? err.message : err))] });
      }
    }

    if (sub === 'gift') {
      const npcId = args[1];
      const itemId = args[2];
      if (!npcId || !itemId) return void message.reply({ embeds: [errorEmbed('Usage: `.npc gift <npcId> <itemId>`')] });
      const npc = NPCS[npcId];
      if (!npc) return void message.reply({ embeds: [errorEmbed(`Unknown NPC \`${npcId}\`. Use \`.npc list\` to see options.`)] });
      try {
        const result = await NpcService.giftItem(player.id, npcId, itemId);
        return void message.reply({ embeds: [successEmbed(`${result.response}\n+${result.relationGain} relation with **${npc.name}**!`)] });
      } catch (err) {
        return void message.reply({ embeds: [errorEmbed(String(err instanceof Error ? err.message : err))] });
      }
    }

    if (sub === 'relations') {
      const relations = await NpcService.getAllRelations(player.id);
      if (!relations.length) return void message.reply({ embeds: [createEmbed({ title: '👥 NPC Relations', description: "*You haven't met any NPCs yet. Explore areas to find them!*", color: 0x16a085 })] });
      const lines = relations.map((r) => {
        const npc = NPCS[r.npcId];
        return `${npc?.emoji ?? '👤'} **${npc?.name ?? r.npcId}** — ${r.relation} (${formatNumber(r.relationScore)} pts)`;
      });
      return void message.reply({ embeds: [createEmbed({ title: '👥 NPC Relations', description: lines.join('\n'), color: 0x16a085 })] });
    }

    return void message.reply(HELP);
  },
};
