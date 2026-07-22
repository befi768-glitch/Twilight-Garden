import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../../client';
import { PlayerService } from '../../services/PlayerService';
import { QuestService, QUESTS } from '../../services/QuestService';
import { questEmbed, errorEmbed, successEmbed } from '../../utils/embed';
import { formatCoins, rarityEmoji, progressBar } from '../../utils/helpers';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('quest')
    .setDescription('Quest system — accept, track, and complete quests')
    .addSubcommand((sub) => sub.setName('available').setDescription('View available quests'))
    .addSubcommand((sub) => sub.setName('active').setDescription('View your active quests'))
    .addSubcommand((sub) =>
      sub.setName('accept')
        .setDescription('Accept a quest')
        .addStringOption((o) =>
          o.setName('quest').setDescription('Quest ID').setRequired(true)
            .addChoices(...Object.values(QUESTS).map((q) => ({ name: `${rarityEmoji[q.rarity]} ${q.name}`, value: q.id })))
        )
    )
    .addSubcommand((sub) => sub.setName('history').setDescription('View completed quests')) as any,

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    const sub = interaction.options.getSubcommand();
    const player = await PlayerService.getOrCreate(interaction.user.id, interaction.guildId!, interaction.user.username);

    if (sub === 'available') {
      const quests = await QuestService.getAvailableQuests(player.id);
      if (!quests.length) return interaction.editReply({ embeds: [questEmbed('Available Quests', '*No quests available right now. Keep leveling up and exploring!*')] });

      const lines = quests.map((q) =>
        `${rarityEmoji[q.rarity]} **${q.name}** [\`${q.id}\`]\n> ${q.description}\n> 🌙${q.rewards.coins} · ✨${q.rewards.xp} XP${q.timeLimit ? ` · ⏰${q.timeLimit}min` : ''}`
      );
      return interaction.editReply({ embeds: [questEmbed('Available Quests', lines.join('\n\n'))] });
    }

    if (sub === 'active') {
      const active = await QuestService.getActiveQuests(player.id);
      if (!active.length) return interaction.editReply({ embeds: [questEmbed('Active Quests', '*No active quests. Use `/quest accept` to start one!*')] });

      const lines = active.map((pq) => {
        const quest = QUESTS[pq.questId];
        const objLines = pq.objectives.map((o) => `  • ${o.description}: ${progressBar(o.current, o.required, 8)} ${o.current}/${o.required}`);
        return `**${quest?.name ?? pq.questId}**\n${objLines.join('\n')}`;
      });
      return interaction.editReply({ embeds: [questEmbed('Active Quests', lines.join('\n\n'))] });
    }

    if (sub === 'accept') {
      const questId = interaction.options.getString('quest', true);
      try {
        const pq = await QuestService.acceptQuest(player.id, questId);
        const quest = QUESTS[questId];
        return interaction.editReply({ embeds: [successEmbed(`Accepted **${quest.name}**!\n> ${quest.description}`)] });
      } catch (err) {
        return interaction.editReply({ embeds: [errorEmbed(String(err instanceof Error ? err.message : err))] });
      }
    }

    if (sub === 'history') {
      const all = await QuestService.getPlayerQuests(player.id);
      const done = all.filter((q) => q.status === 'completed');
      if (!done.length) return interaction.editReply({ embeds: [questEmbed('Quest History', '*No completed quests yet.*')] });

      const lines = done.slice(-10).map((pq) => {
        const quest = QUESTS[pq.questId];
        return `✅ **${quest?.name ?? pq.questId}** — <t:${Math.floor(new Date(pq.completedAt ?? new Date()).getTime() / 1000)}:R>`;
      });
      return interaction.editReply({ embeds: [questEmbed('Completed Quests', lines.join('\n'))] });
    }
  },
};
