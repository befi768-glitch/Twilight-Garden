import { Message } from 'discord.js';
import { Command } from '../../client';
import { PlayerService } from '../../services/PlayerService';
import { ExplorationService, AREAS } from '../../services/ExplorationService';
import { GuildService } from '../../services/GuildService';
import { encounterWildlife } from '../../systems/wildlife';
import { explorationEmbed, errorEmbed } from '../../utils/embed';
import { AreaType } from '../../models/types';

const HELP = [
  '**Lệnh Khám Phá:**',
  '`.khampha khuvuc` — Xem danh sách khu vực',
  '`.khampha di <mãKV>` — Khám phá khu vực',
  '`.khampha lichsu` — Xem lịch sử khám phá',
].join('\n');

export const command: Command = {
  name: 'khampha',

  async execute(message: Message, args: string[]) {
    const sub = args[0]?.toLowerCase();
    if (!sub) return void message.reply(HELP);

    if ('sendTyping' in message.channel) await (message.channel as any).sendTyping();
    const player = await PlayerService.getOrCreate(message.author.id, message.guildId!, message.author.username);
    const world = await GuildService.getOrCreateWorldState(message.guildId!);

    if (sub === 'khuvuc') {
      const lines = Object.values(AREAS).map((a) =>
        `${a.emoji} **${a.name}** [\`${a.id}\`] — Cấp tối thiểu: ${a.minLevel} · Năng lượng: ⚡${a.energyCost}\n> ${a.description}`
      );
      return void message.reply({ embeds: [explorationEmbed('Các Khu Vực Có Thể Khám Phá', lines.join('\n\n'))] });
    }

    if (sub === 'di') {
      const areaId = args[1]?.toLowerCase() as AreaType;
      if (!areaId) return void message.reply({ embeds: [errorEmbed('Cách dùng: `.khampha di <mãKV>` — Dùng `.khampha khuvuc` để xem danh sách.')] });
      if (!AREAS[areaId]) return void message.reply({ embeds: [errorEmbed(`Không tìm thấy khu vực \`${areaId}\`. Dùng \`.khampha khuvuc\` để xem.`)] });
      try {
        const result = await ExplorationService.explore(player.id, areaId, world);

        let wildlifeMsg = '';
        if (Math.random() < 0.4) {
          const enc = await encounterWildlife(player.id, areaId, world.currentSeason as any, world.currentWeather as any, world.timeOfDay as any, message.guildId!);
          if (enc) {
            wildlifeMsg = `\n\n🐾 **Gặp Sinh Vật!** Bạn phát hiện **${enc.wildlife.emoji} ${enc.wildlife.name}**${enc.isNew ? ' — *Khám phá mới!* 🆕' : ''}`;
          }
        }

        const area = AREAS[areaId];
        const embed = explorationEmbed(`Đã khám phá: ${area.emoji} ${area.name}`, result.message + wildlifeMsg)
          .addFields(
            { name: '⚡ Năng lượng còn lại', value: String(player.energyCurrent - area.energyCost), inline: true },
            { name: '🌤️ Thời tiết', value: world.currentWeather, inline: true },
          );
        return void message.reply({ embeds: [embed] });
      } catch (err) {
        return void message.reply({ embeds: [errorEmbed(String(err instanceof Error ? err.message : err))] });
      }
    }

    if (sub === 'lichsu') {
      const logs = await ExplorationService.getExplorationHistory(player.id, 8);
      if (!logs.length) return void message.reply({ embeds: [explorationEmbed('Lịch Sử Khám Phá', '*Chưa khám phá lần nào. Dùng `.khampha di` để bắt đầu phiêu lưu!*')] });
      const lines = logs.map((l) => `**${l.area}** — ${l.event}\n> *<t:${Math.floor(new Date(l.exploredAt).getTime() / 1000)}:R>*`);
      return void message.reply({ embeds: [explorationEmbed('Lịch Sử Khám Phá', lines.join('\n\n'))] });
    }

    return void message.reply(HELP);
  },
};
