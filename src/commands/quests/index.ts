import { Message } from 'discord.js';
import { Command } from '../../client';
import { PlayerService } from '../../services/PlayerService';
import { QuestService, QUESTS } from '../../services/QuestService';
import { questEmbed, errorEmbed, successEmbed } from '../../utils/embed';
import { formatCoins, rarityEmoji, progressBar } from '../../utils/helpers';

const HELP = [
  '**Quest Commands:**',
  '`.quest available` — View available quests',
  '`.quest active` — View your active quests',
  '`.quest accept <questId>` — Accept a quest',
  '`.quest history` — View completed quests',
].join('\n');

export const command: Command = {
  name: 'quest',

  async execute(message: Message, args: string[]) {
    const sub = args[0]?.toLowerCase();
    if (!sub) return void message.reply(HELP);

    await message.channel.sendTyping();
    const player = await PlayerService.getOrCreate(message.author.id, message.guildId!, message.author.username);

    if (sub === 'available') {
      const quests = await QuestService.getAvailableQuests(player.id);
      if (!quests.length) return void message.reply({ embeds: [questEmbed('Available Quests', '*No quests available right now. Keep leveling up and exploring!*')] });
      const lines = quests.map((q) =>
        `${rarityEmoji[q.rarity]} **${q.name}** [\`${q.id}\`]\n> ${q.description}\n> 🌙${q.rewards.coins} · ✨${q.rewards.xp} XP${q.timeLimit ? ` · ⏰${q.timeLimit}min` : ''}`
      );
      return void message.reply({ embeds: [questEmbed('Available Quests', lines.join('\n\n'))] });
    }

    if (sub === 'active') {
      const active = await QuestService.getActiveQuests(player.id);
      if (!active.length) return void message.reply({ embeds: [questEmbed('Active Quests', '*No active quests. Use `.quest accept` to start one!*')] });
      const lines = active.map((pq) => {
        const quest = QUESTS[pq.questId];
        const objLines = pq.objectives.map((o: any) => `  • ${o.description}: ${progressBar(o.current, o.required, 8)} ${o.current}/${o.required}`);
        return `**${quest?.name ?? pq.questId}**\n${objLines.join('\n')}`;
      });
      return void message.reply({ embeds: [questEmbed('Active Quests', lines.join('\n\n'))] });
    }

    if (sub === 'accept') {
      const questId = args[1];
      if (!questId) return void message.reply({ embeds: [errorEmbed('Usage: `.quest accept <questId>` — Use `.quest available` to see quest IDs.')] });
      try {
        await QuestService.acceptQuest(player.id, questId);
        const quest = QUESTS[questId];
        return void message.reply({ embeds: [successEmbed(`Accepted **${quest?.name ?? questId}**!\n> ${quest?.description ?? ''}`)] });
      } catch (err) {
        return void message.reply({ embeds: [errorEmbed(String(err instanceof Error ? err.message : err))] });
      }
    }

    if (sub === 'history') {
      const all = await QuestService.getPlayerQuests(player.id);
      const done = all.filter((q) => q.status === 'completed');
      if (!done.length) return void message.reply({ embeds: [questEmbed('Quest History', '*No completed quests yet.*')] });
      const lines = done.slice(-10).map((pq) => {
        const quest = QUESTS[pq.questId];
        return `✅ **${quest?.name ?? pq.questId}** — <t:${Math.floor(new Date(pq.completedAt ?? new Date()).getTime() / 1000)}:R>`;
      });
      return void message.reply({ embeds: [questEmbed('Completed Quests', lines.join('\n'))] });
    }

    return void message.reply(HELP);
  },
};
