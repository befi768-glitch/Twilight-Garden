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
  name: 'journal',

  async execute(message: Message, args: string[]) {
    const sub = args[0]?.toLowerCase() ?? 'all';
    await message.channel.sendTyping();
    const player = await PlayerService.getOrCreate(message.author.id, message.guildId!, message.author.username);

    const type = sub === 'category' ? args[1]?.toLowerCase() : undefined;
    if (sub === 'category' && (!type || !VALID_TYPES.includes(type))) {
      return void message.reply(`Usage: \`.journal category <type>\`\nTypes: ${VALID_TYPES.join(', ')}`);
    }

    const entries = await JournalService.getEntries(player.id, type);
    if (!entries.length) {
      return void message.reply({ embeds: [createEmbed({ title: '📓 Journal', description: '*No entries yet. Explore, harvest, and meet NPCs to fill your journal!*', color: 0x8e44ad })] });
    }

    const lines = entries.slice(0, 20).map((e) =>
      `${TYPE_EMOJIS[e.type] ?? '📝'} **${e.title}**\n> ${e.content.slice(0, 80)}${e.content.length > 80 ? '...' : ''}\n> *<t:${Math.floor(new Date(e.discoveredAt).getTime() / 1000)}:D>*`
    );

    return void message.reply({ embeds: [createEmbed({
      title: `📓 Journal — ${entries.length} Entries`,
      description: lines.join('\n\n'),
      color: 0x8e44ad,
      footer: entries.length > 20 ? `Showing 20 of ${entries.length} entries` : undefined,
    })] });
  },
};
