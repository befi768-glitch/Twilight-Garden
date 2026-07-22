import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../../client';
import { PlayerService } from '../../services/PlayerService';
import { JournalService } from '../../services/JournalService';
import { createEmbed } from '../../utils/embed';

const TYPE_EMOJIS: Record<string, string> = {
  plant: '🌱', wildlife: '🐾', npc: '👤', area: '🗺️', event: '⚡', achievement: '🏆',
};

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('journal')
    .setDescription('Your discovery journal')
    .addSubcommand((sub) => sub.setName('all').setDescription('View all journal entries'))
    .addSubcommand((sub) =>
      sub.setName('category')
        .setDescription('Filter journal by category')
        .addStringOption((o) =>
          o.setName('type').setDescription('Category').setRequired(true)
            .addChoices(
              { name: '🌱 Plants', value: 'plant' },
              { name: '🐾 Wildlife', value: 'wildlife' },
              { name: '👤 NPCs', value: 'npc' },
              { name: '🗺️ Areas', value: 'area' },
              { name: '⚡ Events', value: 'event' },
              { name: '🏆 Achievements', value: 'achievement' },
            )
        )
    ) as any,

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    const sub = interaction.options.getSubcommand();
    const player = await PlayerService.getOrCreate(interaction.user.id, interaction.guildId!, interaction.user.username);

    const type = sub === 'category' ? interaction.options.getString('type', true) : undefined;
    const entries = await JournalService.getEntries(player.id, type);

    if (!entries.length) {
      return interaction.editReply({ embeds: [createEmbed({ title: '📓 Journal', description: '*No entries yet. Explore, harvest, and meet NPCs to fill your journal!*', color: 0x8e44ad })] });
    }

    const lines = entries.slice(0, 20).map((e) =>
      `${TYPE_EMOJIS[e.type] ?? '📝'} **${e.title}**\n> ${e.content.slice(0, 80)}${e.content.length > 80 ? '...' : ''}\n> *<t:${Math.floor(new Date(e.discoveredAt).getTime() / 1000)}:D>*`
    );

    const embed = createEmbed({
      title: `📓 Journal — ${entries.length} Entries`,
      description: lines.join('\n\n'),
      color: 0x8e44ad,
      footer: entries.length > 20 ? `Showing 20 of ${entries.length} entries` : undefined,
    });
    return interaction.editReply({ embeds: [embed] });
  },
};
