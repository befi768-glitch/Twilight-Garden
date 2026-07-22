import { Message } from 'discord.js';
import { Command } from '../../client';
import { PlayerService } from '../../services/PlayerService';
import { JournalService } from '../../services/JournalService';
import { createEmbed } from '../../utils/embed';

const TYPE_EMOJIS: Record<string, string> = {
  plant: '🌱', wildlife: '🐾', npc: '👤', area: '🗺️', event: '⚡', achievement: '🏆',
};

const VALID_TYPES = ['plant', 'wildlife', 'npc', 'area', 'event', 'achievement'];

export const command: Command = {
  name: 'nhat_ky',

  async execute(message: Message, args: string[]) {
    const sub = args[0]?.toLowerCase() ?? 'tatca';
    await message.channel.sendTyping();
    const player = await PlayerService.getOrCreate(message.author.id, message.guildId!, message.author.username);

    const type = sub === 'loai' ? args[1]?.toLowerCase() : undefined;
    if (sub === 'loai' && (!type || !VALID_TYPES.includes(type))) {
      return void message.reply(`Cách dùng: \`.nhat_ky loai <loại>\`\nCác loại: ${VALID_TYPES.join(', ')}`);
    }

    const entries = await JournalService.getEntries(player.id, type);
    if (!entries.length) {
      return void message.reply({ embeds: [createEmbed({ title: '📓 Nhật Ký', description: '*Chưa có ghi chép nào. Hãy khám phá, thu hoạch và gặp gỡ NPC để điền vào nhật ký!*', color: 0x8e44ad })] });
    }

    const lines = entries.slice(0, 20).map((e) =>
      `${TYPE_EMOJIS[e.type] ?? '📝'} **${e.title}**\n> ${e.content.slice(0, 80)}${e.content.length > 80 ? '...' : ''}\n> *<t:${Math.floor(new Date(e.discoveredAt).getTime() / 1000)}:D>*`
    );

    return void message.reply({ embeds: [createEmbed({
      title: `📓 Nhật Ký — ${entries.length} Ghi Chép`,
      description: lines.join('\n\n'),
      color: 0x8e44ad,
      footer: entries.length > 20 ? `Hiển thị 20/${entries.length} ghi chép` : undefined,
    })] });
  },
};
