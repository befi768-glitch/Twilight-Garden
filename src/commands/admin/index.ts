import { Message, PermissionFlagsBits } from 'discord.js';
import { Command } from '../../client';
import { GuildService } from '../../services/GuildService';
import { WorldEventService, WORLD_EVENTS } from '../../services/WorldEventService';
import { NewsService } from '../../services/NewsService';
import { createEmbed, errorEmbed, successEmbed } from '../../utils/embed';

function parseChannelMention(str: string): string | null {
  const m = str?.match(/^<#(\d+)>$/);
  return m ? m[1] : null;
}

const HELP = [
  '**Admin Commands (Manage Guild required):**',
  '`.admin set_news_channel #channel` — Set news channel',
  '`.admin set_notify_channel #channel` — Set notification channel',
  '`.admin force_event <eventId>` — Force start a world event',
  '`.admin post_news <title> | <content>` — Post custom news',
  '`.admin status` — View bot/server status',
].join('\n');

export const command: Command = {
  name: 'admin',

  async execute(message: Message, args: string[]) {
    // Check permissions
    const member = message.member;
    if (!member?.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return void message.reply({ embeds: [errorEmbed('You need **Manage Guild** permission to use admin commands.')] });
    }

    const sub = args[0]?.toLowerCase();
    if (!sub) return void message.reply(HELP);

    await message.channel.sendTyping();

    if (sub === 'set_news_channel') {
      const channelId = parseChannelMention(args[1]);
      if (!channelId) return void message.reply({ embeds: [errorEmbed('Usage: `.admin set_news_channel #channel`')] });
      await GuildService.setNewsChannel(message.guildId!, channelId);
      return void message.reply({ embeds: [successEmbed(`News channel set to <#${channelId}>`)] });
    }

    if (sub === 'set_notify_channel') {
      const channelId = parseChannelMention(args[1]);
      if (!channelId) return void message.reply({ embeds: [errorEmbed('Usage: `.admin set_notify_channel #channel`')] });
      await GuildService.setNotificationChannel(message.guildId!, channelId);
      return void message.reply({ embeds: [successEmbed(`Notification channel set to <#${channelId}>`)] });
    }

    if (sub === 'force_event') {
      const eventId = args[1];
      if (!eventId) return void message.reply({ embeds: [errorEmbed(`Usage: \`.admin force_event <eventId>\`\nAvailable: ${Object.keys(WORLD_EVENTS).join(', ')}`)] });
      try {
        const active = await WorldEventService.startEvent(message.guildId!, eventId);
        const event = WORLD_EVENTS[eventId];
        return void message.reply({ embeds: [successEmbed(`Started world event: **${event.emoji} ${event.name}**!\nEnds <t:${Math.floor(new Date(active.endsAt).getTime() / 1000)}:R>`)] });
      } catch (err) {
        return void message.reply({ embeds: [errorEmbed(String(err instanceof Error ? err.message : err))] });
      }
    }

    if (sub === 'post_news') {
      // Format: .admin post_news Title here | Content here
      const rest = args.slice(1).join(' ');
      const pipeIdx = rest.indexOf(' | ');
      if (pipeIdx === -1) return void message.reply({ embeds: [errorEmbed('Usage: `.admin post_news <title> | <content>`')] });
      const title = rest.slice(0, pipeIdx).trim();
      const content = rest.slice(pipeIdx + 3).trim();
      if (!title || !content) return void message.reply({ embeds: [errorEmbed('Usage: `.admin post_news <title> | <content>`')] });
      await NewsService.postNews(message.guildId!, title, content, 'world_event', 2);
      return void message.reply({ embeds: [successEmbed(`Posted news: **${title}**`)] });
    }

    if (sub === 'status') {
      const world = await GuildService.getOrCreateWorldState(message.guildId!);
      const config = await GuildService.getOrCreateConfig(message.guildId!);
      return void message.reply({ embeds: [createEmbed({
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

    return void message.reply(HELP);
  },
};
