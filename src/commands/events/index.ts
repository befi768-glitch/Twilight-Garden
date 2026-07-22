import { Message } from 'discord.js';
import { Command } from '../../client';
import { PlayerService } from '../../services/PlayerService';
import { WorldEventService, WORLD_EVENTS } from '../../services/WorldEventService';
import { createEmbed, errorEmbed, successEmbed } from '../../utils/embed';
import { rarityEmoji } from '../../utils/helpers';

export const command: Command = {
  name: 'su_kien',

  async execute(message: Message, args: string[]) {
    const sub = args[0]?.toLowerCase() ?? 'hientai';
    if ('sendTyping' in message.channel) await (message.channel as any).sendTyping();
    const player = await PlayerService.getOrCreate(message.author.id, message.guildId!, message.author.username);

    if (sub === 'hientai') {
      const active = await WorldEventService.getActiveEvent(message.guildId!);
      if (!active) {
        return void message.reply({ embeds: [createEmbed({ title: '🌍 Sự Kiện Thế Giới', description: '*Chưa có sự kiện nào. Quay lại sau — sự kiện xuất hiện ngẫu nhiên!*', color: 0x9b59b6 })] });
      }
      const event = WORLD_EVENTS[active.eventId];
      const participants = (active.participants as string[]).length;
      const embed = createEmbed({
        title: `${event.emoji} ${event.name}`,
        description: event.description,
        color: 0x9b59b6,
        fields: [
          { name: '👥 Người tham gia', value: String(participants), inline: true },
          { name: '⏰ Kết thúc', value: `<t:${Math.floor(new Date(active.endsAt).getTime() / 1000)}:R>`, inline: true },
          { name: '🎁 Phần thưởng', value: `🌙${event.participantRewards.coins} · ✨${event.participantRewards.xp} XP`, inline: true },
        ],
      });
      return void message.reply({ embeds: [embed] });
    }

    if (sub === 'thamgia') {
      try {
        const result = await WorldEventService.participate(message.guildId!, player.id);
        if (result.alreadyIn) {
          return void message.reply({ embeds: [createEmbed({ title: '✅ Đã Tham Gia', description: `Bạn đã tham gia **${result.event.name}** rồi!`, color: 0x2ecc71 })] });
        }
        return void message.reply({ embeds: [successEmbed(`Đã tham gia **${result.event.emoji} ${result.event.name}**!\nBạn sẽ nhận thưởng khi sự kiện kết thúc.`)] });
      } catch (err) {
        return void message.reply({ embeds: [errorEmbed(String(err instanceof Error ? err.message : err))] });
      }
    }

    if (sub === 'danhsach') {
      const lines = Object.values(WORLD_EVENTS).map((e) =>
        `${e.emoji} **${e.name}** ${rarityEmoji[e.rarity]}\n> ${e.description}\n> ⏱️ ${e.durationHours} giờ · 🎁 🌙${e.participantRewards.coins} · ✨${e.participantRewards.xp} XP`
      );
      return void message.reply({ embeds: [createEmbed({ title: '🌍 Danh Sách Sự Kiện', description: lines.join('\n\n'), color: 0x9b59b6 })] });
    }

    return void message.reply('Cách dùng: `.su_kien hientai` / `.su_kien thamgia` / `.su_kien danhsach`');
  },
};
