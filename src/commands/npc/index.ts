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
  '**Lệnh NPC:**',
  '`.npc danhsach` — Xem tất cả NPC',
  '`.npc noi <mãNPC>` — Nói chuyện với NPC',
  '`.npc tang <mãNPC> <mãVật>` — Tặng quà cho NPC',
  '`.npc quanhe` — Xem quan hệ với NPC',
].join('\n');

export const command: Command = {
  name: 'npc',

  async execute(message: Message, args: string[]) {
    const sub = args[0]?.toLowerCase();
    if (!sub) return void message.reply(HELP);

    if ('sendTyping' in message.channel) await (message.channel as any).sendTyping();
    const player = await PlayerService.getOrCreate(message.author.id, message.guildId!, message.author.username);

    if (sub === 'danhsach') {
      const lines = Object.values(NPCS).map((n) =>
        `${n.emoji} **${n.name}** [\`${n.id}\`] — *${n.title}*\n📍 ${n.location} · ${n.description}`
      );
      return void message.reply({ embeds: [createEmbed({ title: '👥 Nhân Vật NPC', description: lines.join('\n\n'), color: 0x16a085 })] });
    }

    if (sub === 'noi') {
      const npcId = args[1];
      if (!npcId) return void message.reply({ embeds: [errorEmbed('Cách dùng: `.npc noi <mãNPC>` — Dùng `.npc danhsach` để xem mã NPC.')] });
      const npc = NPCS[npcId];
      if (!npc) return void message.reply({ embeds: [errorEmbed(`Không tìm thấy NPC \`${npcId}\`. Dùng \`.npc danhsach\` để xem.`)] });
      try {
        const result = await NpcService.talk(player.id, npcId);
        const relation = await NpcService.getOrCreateRelation(player.id, npcId);
        const embed = createEmbed({
          title: `${npc.emoji} ${npc.name} nói:`,
          description: `*"${result.dialogue}"*`,
          color: NPC_RELATION_COLORS[relation.relation] ?? 0x888888,
        }).addFields(
          { name: '💬 Quan hệ', value: `${relation.relation} (${formatNumber(relation.relationScore)} điểm)`, inline: true },
          { name: '✨ Tăng thêm', value: result.relationGain > 0 ? `+${result.relationGain} quan hệ` : 'Không thay đổi', inline: true },
        );
        return void message.reply({ embeds: [embed] });
      } catch (err) {
        return void message.reply({ embeds: [errorEmbed(String(err instanceof Error ? err.message : err))] });
      }
    }

    if (sub === 'tang') {
      const npcId = args[1];
      const itemId = args[2];
      if (!npcId || !itemId) return void message.reply({ embeds: [errorEmbed('Cách dùng: `.npc tang <mãNPC> <mãVật>`')] });
      const npc = NPCS[npcId];
      if (!npc) return void message.reply({ embeds: [errorEmbed(`Không tìm thấy NPC \`${npcId}\`. Dùng \`.npc danhsach\` để xem.`)] });
      try {
        const result = await NpcService.giftItem(player.id, npcId, itemId);
        return void message.reply({ embeds: [successEmbed(`${result.response}\n+${result.relationGain} quan hệ với **${npc.name}**!`)] });
      } catch (err) {
        return void message.reply({ embeds: [errorEmbed(String(err instanceof Error ? err.message : err))] });
      }
    }

    if (sub === 'quanhe') {
      const relations = await NpcService.getAllRelations(player.id);
      if (!relations.length) return void message.reply({ embeds: [createEmbed({ title: '👥 Quan Hệ NPC', description: '*Bạn chưa gặp NPC nào. Hãy khám phá các khu vực!*', color: 0x16a085 })] });
      const lines = relations.map((r) => {
        const npc = NPCS[r.npcId];
        return `${npc?.emoji ?? '👤'} **${npc?.name ?? r.npcId}** — ${r.relation} (${formatNumber(r.relationScore)} điểm)`;
      });
      return void message.reply({ embeds: [createEmbed({ title: '👥 Quan Hệ NPC', description: lines.join('\n'), color: 0x16a085 })] });
    }

    return void message.reply(HELP);
  },
};
