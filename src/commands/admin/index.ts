import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { Command } from '../../client';
import { GuildService } from '../../services/GuildService';
import { WorldEventService, WORLD_EVENTS } from '../../services/WorldEventService';
import { NewsService } from '../../services/NewsService';
import { createEmbed, errorEmbed, successEmbed } from '../../utils/embed';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('admin')
    .setDescription('Admin — bot configuration and management')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub.setName('set_news_channel')
        .setDescription('Set the news broadcast channel')
        .addChannelOption((o) => o.setName('channel').setDescription('Channel for world news').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub.setName('set_notify_channel')
        .setDescription('Set the notification channel')
        .addChannelOption((o) => o.setName('channel').setDescription('Notification channel').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub.setName('force_event')
        .setDescription('Force start a world event')
        .addStringOption((o) =>
          o.setName('event').setDescription('Event to start').setRequired(true)
            .addChoices(...Object.values(WORLD_EVENTS).map((e) => ({ name: `${e.emoji} ${e.name}`, value: e.id })))
        )
    )
    .addSubcommand((sub) =>
      sub.setName('post_news')
        .setDescription('Post a custom news item')
        .addStringOption((o) => o.setName('title').setDescription('News title').setRequired(true))
        .addStringOption((o) => o.setName('content').setDescription('News content').setRequired(true))
    )
    .addSubcommand((sub) => sub.setName('status').setDescription('View bot and server status')) as any,

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });
    const sub = interaction.options.getSubcommand();

    if (sub === 'set_news_channel') {
      const channel = interaction.options.getChannel('channel', true);
      await GuildService.setNewsChannel(interaction.guildId!, channel.id);
      return interaction.editReply({ embeds: [successEmbed(`News channel set to <#${channel.id}>`)] });
    }

    if (sub === 'set_notify_channel') {
      const channel = interaction.options.getChannel('channel', true);
      await GuildService.setNotificationChannel(interaction.guildId!, channel.id);
      return interaction.editReply({ embeds: [successEmbed(`Notification channel set to <#${channel.id}>`)] });
    }

    if (sub === 'force_event') {
      const eventId = interaction.options.getString('event', true);
      try {
        const active = await WorldEventService.startEvent(interaction.guildId!, eventId);
        const event = WORLD_EVENTS[eventId];
        return interaction.editReply({ embeds: [successEmbed(`Started world event: **${event.emoji} ${event.name}**!\nEnds <t:${Math.floor(new Date(active.endsAt).getTime() / 1000)}:R>`)] });
      } catch (err) {
        return interaction.editReply({ embeds: [errorEmbed(String(err instanceof Error ? err.message : err))] });
      }
    }

    if (sub === 'post_news') {
      const title = interaction.options.getString('title', true);
      const content = interaction.options.getString('content', true);
      await NewsService.postNews(interaction.guildId!, title, content, 'world_event', 2);
      return interaction.editReply({ embeds: [successEmbed(`Posted news: **${title}**`)] });
    }

    if (sub === 'status') {
      const world = await GuildService.getOrCreateWorldState(interaction.guildId!);
      const config = await GuildService.getOrCreateConfig(interaction.guildId!);
      return interaction.editReply({ embeds: [createEmbed({
        title: '⚙️ Server Status',
        color: 0x3498db,
        fields: [
          { name: '🌍 World Tick', value: String(world.worldTick), inline: true },
          { name: '📅 Day', value: String(world.dayNumber), inline: true },
          { name: '🍂 Season', value: world.currentSeason, inline: true },
          { name: '📰 News Channel', value: config.newsChannelId ? `<#${config.newsChannelId}>` : '*Not set*', inline: true },
          { name: '🔔 Notify Channel', value: config.notificationChannelId ? `<#${config.notificationChannelId}>` : '*Not set*', inline: true },
        ],
      })] });
    }
  },
};
