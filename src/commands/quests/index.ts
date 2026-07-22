import { Message } from 'discord.js';
import { Command } from '../../client';
import { PlayerService } from '../../services/PlayerService';
import { QuestService, QUESTS } from '../../services/QuestService';
import { questEmbed, errorEmbed, successEmbed } from '../../utils/embed';
import { rarityEmoji, progressBar } from '../../utils/helpers';

const HELP = [
  '**Lệnh Nhiệm Vụ:**',
  '`.nhiem_vu sansan` — Xem nhiệm vụ có thể nhận',
  '`.nhiem_vu danglam` — Xem nhiệm vụ đang thực hiện',
  '`.nhiem_vu nhan <mãNV>` — Nhận nhiệm vụ',
  '`.nhiem_vu lichsu` — Xem nhiệm vụ đã hoàn thành',
].join('\n');

export const command: Command = {
  name: 'nhiem_vu',

  async execute(message: Message, args: string[]) {
    const sub = args[0]?.toLowerCase();
    if (!sub) return void message.reply(HELP);

    if ('sendTyping' in message.channel) await (message.channel as any).sendTyping();
    const player = await PlayerService.getOrCreate(message.author.id, message.guildId!, message.author.username);

    if (sub === 'sansan') {
      const quests = await QuestService.getAvailableQuests(player.id);
      if (!quests.length) return void message.reply({ embeds: [questEmbed('Nhiệm Vụ Có Thể Nhận', '*Chưa có nhiệm vụ nào. Hãy lên cấp và khám phá thêm!*')] });
      const lines = quests.map((q) =>
        `${rarityEmoji[q.rarity]} **${q.name}** [\`${q.id}\`]\n> ${q.description}\n> 🌙${q.rewards.coins} · ✨${q.rewards.xp} XP${q.timeLimit ? ` · ⏰${q.timeLimit} phút` : ''}`
      );
      return void message.reply({ embeds: [questEmbed('Nhiệm Vụ Có Thể Nhận', lines.join('\n\n'))] });
    }

    if (sub === 'danglam') {
      const active = await QuestService.getActiveQuests(player.id);
      if (!active.length) return void message.reply({ embeds: [questEmbed('Nhiệm Vụ Đang Làm', '*Chưa nhận nhiệm vụ nào. Dùng `.nhiem_vu nhan` để bắt đầu!*')] });
      const lines = active.map((pq) => {
        const quest = QUESTS[pq.questId];
        const objLines = pq.objectives.map((o: any) => `  • ${o.description}: ${progressBar(o.current, o.required, 8)} ${o.current}/${o.required}`);
        return `**${quest?.name ?? pq.questId}**\n${objLines.join('\n')}`;
      });
      return void message.reply({ embeds: [questEmbed('Nhiệm Vụ Đang Làm', lines.join('\n\n'))] });
    }

    if (sub === 'nhan') {
      const questId = args[1];
      if (!questId) return void message.reply({ embeds: [errorEmbed('Cách dùng: `.nhiem_vu nhan <mãNV>` — Dùng `.nhiem_vu sansan` để xem mã nhiệm vụ.')] });
      try {
        await QuestService.acceptQuest(player.id, questId);
        const quest = QUESTS[questId];
        return void message.reply({ embeds: [successEmbed(`Đã nhận nhiệm vụ **${quest?.name ?? questId}**!\n> ${quest?.description ?? ''}`)] });
      } catch (err) {
        return void message.reply({ embeds: [errorEmbed(String(err instanceof Error ? err.message : err))] });
      }
    }

    if (sub === 'lichsu') {
      const all = await QuestService.getPlayerQuests(player.id);
      const done = all.filter((q) => q.status === 'completed');
      if (!done.length) return void message.reply({ embeds: [questEmbed('Lịch Sử Nhiệm Vụ', '*Chưa hoàn thành nhiệm vụ nào.*')] });
      const lines = done.slice(-10).map((pq) => {
        const quest = QUESTS[pq.questId];
        return `✅ **${quest?.name ?? pq.questId}** — <t:${Math.floor(new Date(pq.completedAt ?? new Date()).getTime() / 1000)}:R>`;
      });
      return void message.reply({ embeds: [questEmbed('Nhiệm Vụ Đã Hoàn Thành', lines.join('\n'))] });
    }

    return void message.reply(HELP);
  },
};
