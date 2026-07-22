import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../../client';
import { PlayerService } from '../../services/PlayerService';
import { NpcService, NPCS } from '../../services/NpcService';
import { createEmbed, errorEmbed, successEmbed } from '../../utils/embed';
import { formatNumber } from '../../utils/helpers';

const NPC_RELATION_COLORS: Record<string, number> = {
  stranger: 0x888888, acquaintance: 0x5dade2, friend: 0x2ecc71, close_friend: 0xf39c12, rival: 0xe74c3c, beloved: 0xff69b4,
};

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('npc')
    .setDescription('Interact with NPCs')
    .addSubcommand((sub) => sub.setName('list').setDescription('View all known NPCs'))
    .addSubcommand((sub) =>
      sub.setName('talk')
        .setDescription('Talk to an NPC')
        .addStringOption((o) => o.setName('npc').setDescription('NPC to talk to').setRequired(true)
          .addChoices(...Object.values(NPCS).map((n) => ({ name: `${n.emoji} ${n.name} — ${n.title}`, value: n.id }))))
    )
    .addSubcommand((sub) =>
      sub.setName('gift')
        .setDescription('Give a gift to an NPC')
        .addStringOption((o) => o.setName('npc').setDescription('NPC').setRequired(true)
          .addChoices(...Object.values(NPCS).map((n) => ({ name: `${n.emoji} ${n.name}`, value: n.id }))))
        .addStringOption((o) => o.setName('item').setDescription('Item ID to give').setRequired(true))
    )
    .addSubcommand((sub) => sub.setName('relations').setDescription('View your NPC relationships')) as any,

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    const sub = interaction.options.getSubcommand();
    const player = await PlayerService.getOrCreate(interaction.user.id, interaction.guildId!, interaction.user.username);

    if (sub === 'list') {
      const lines = Object.values(NPCS).map((n) =>
        `${n.emoji} **${n.name}** — *${n.title}*\n📍 ${n.location} · ${n.description}`
      );
      const embed = createEmbed({ title: '👥 Twilight NPCs', description: lines.join('\n\n'), color: 0x16a085 });
      return interaction.editReply({ embeds: [embed] });
    }

    if (sub === 'talk') {
      const npcId = interaction.options.getString('npc', true);
      const npc = NPCS[npcId];
      if (!npc) return interaction.editReply({ embeds: [errorEmbed('NPC not found.')] });
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
        return interaction.editReply({ embeds: [embed] });
      } catch (err) {
        return interaction.editReply({ embeds: [errorEmbed(String(err instanceof Error ? err.message : err))] });
      }
    }

    if (sub === 'gift') {
      const npcId = interaction.options.getString('npc', true);
      const itemId = interaction.options.getString('item', true);
      const npc = NPCS[npcId];
      if (!npc) return interaction.editReply({ embeds: [errorEmbed('NPC not found.')] });
      try {
        const result = await NpcService.giftItem(player.id, npcId, itemId);
        return interaction.editReply({ embeds: [successEmbed(`${result.response}\n+${result.relationGain} relation with **${npc.name}**!`)] });
      } catch (err) {
        return interaction.editReply({ embeds: [errorEmbed(String(err instanceof Error ? err.message : err))] });
      }
    }

    if (sub === 'relations') {
      const relations = await NpcService.getAllRelations(player.id);
      if (!relations.length) return interaction.editReply({ embeds: [createEmbed({ title: '👥 NPC Relations', description: '*You haven\'t met any NPCs yet. Explore areas to find them!*', color: 0x16a085 })] });

      const lines = relations.map((r) => {
        const npc = NPCS[r.npcId];
        return `${npc?.emoji ?? '👤'} **${npc?.name ?? r.npcId}** — ${r.relation} (${formatNumber(r.relationScore)} pts)`;
      });
      return interaction.editReply({ embeds: [createEmbed({ title: '👥 NPC Relations', description: lines.join('\n'), color: 0x16a085 })] });
    }
  },
};
