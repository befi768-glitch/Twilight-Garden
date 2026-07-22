import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../../client';
import { PlayerService } from '../../services/PlayerService';
import { WorldEventService, WORLD_EVENTS } from '../../services/WorldEventService';
import { createEmbed, errorEmbed, successEmbed } from '../../utils/embed';
import { rarityEmoji, formatCoins } from '../../utils/helpers';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('event')
    .setDescription('World events — join, view, and participate')
    .addSubcommand((sub) => sub.setName('current').setDescription('View the current world event'))
    .addSubcommand((sub) => sub.setName('join').setDescription('Join the current world event'))
    .addSubcommand((sub) => sub.setName('history').setDescription('View all possible world events')) as any,

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    const sub = interaction.options.getSubcommand();
    const player = await PlayerService.getOrCreate(interaction.user.id, interaction.guildId!, interaction.user.username);

    if (sub === 'current') {
      const active = await WorldEventService.getActiveEvent(interaction.guildId!);
      if (!active) {
        return interaction.editReply({ embeds: [createEmbed({ title: '🌍 World Event', description: '*No active world event right now. Check back later — events occur randomly!*', color: 0x9b59b6 })] });
      }
      const event = WORLD_EVENTS[active.eventId];
      const participants = (active.participants as string[]).length;
      const embed = createEmbed({
        title: `${event.emoji} ${event.name}`,
        description: event.description,
        color: 0x9b59b6,
        fields: [
          { name: '👥 Participants', value: String(participants), inline: true },
          { name: '⏰ Ends', value: `<t:${Math.floor(new Date(active.endsAt).getTime() / 1000)}:R>`, inline: true },
          { name: '🎁 Rewards', value: `🌙${event.participantRewards.coins} · ✨${event.participantRewards.xp} XP`, inline: true },
        ],
      });
      return interaction.editReply({ embeds: [embed] });
    }

    if (sub === 'join') {
      try {
        const result = await WorldEventService.participate(interaction.guildId!, player.id);
        if (result.alreadyIn) {
          return interaction.editReply({ embeds: [createEmbed({ title: '✅ Already Participating', description: `You are already in **${result.event.name}**!`, color: 0x2ecc71 })] });
        }
        return interaction.editReply({ embeds: [successEmbed(`Joined **${result.event.emoji} ${result.event.name}**!\nYou will receive rewards when the event ends.`)] });
      } catch (err) {
        return interaction.editReply({ embeds: [errorEmbed(String(err instanceof Error ? err.message : err))] });
      }
    }

    if (sub === 'history') {
      const lines = Object.values(WORLD_EVENTS).map((e) =>
        `${e.emoji} **${e.name}** ${rarityEmoji[e.rarity]}\n> ${e.description}\n> ⏱️ ${e.durationHours}h · 🎁 🌙${e.participantRewards.coins} · ✨${e.participantRewards.xp} XP`
      );
      return interaction.editReply({ embeds: [createEmbed({ title: '🌍 World Events Catalogue', description: lines.join('\n\n'), color: 0x9b59b6 })] });
    }
  },
};
