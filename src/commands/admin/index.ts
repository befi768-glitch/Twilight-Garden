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
  '**Lệnh Admin (cần quyền Quản Lý Server):**',
  '`.admin kenh_tin_tuc #kenh` — Đặt kênh tin tức',
  '`.admin kenh_thongbao #kenh` — Đặt kênh thông báo',
  '`.admin bat_sukien <mãSK>` — Bắt buộc bắt đầu sự kiện',
  '`.admin dang_tin <tiêu đề> | <nội dung>` — Đăng tin tức',
  '`.admin trangthai` — Xem trạng thái bot/server',
].join('\n');

export const command: Command = {
  name: 'admin',

  async execute(message: Message, args: string[]) {
    const member = message.member;
    if (!member?.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return void message.reply({ embeds: [errorEmbed('Bạn cần quyền **Quản Lý Server** để dùng lệnh admin.')] });
    }

    const sub = args[0]?.toLowerCase();
    if (!sub) return void message.reply(HELP);

    if ('sendTyping' in message.channel) await (message.channel as any).sendTyping();

    if (sub === 'kenh_tin_tuc') {
      const channelId = parseChannelMention(args[1]);
      if (!channelId) return void message.reply({ embeds: [errorEmbed('Cách dùng: `.admin kenh_tin_tuc #kênh`')] });
      await GuildService.setNewsChannel(message.guildId!, channelId);
      return void message.reply({ embeds: [successEmbed(`Đã đặt kênh tin tức thành <#${channelId}>`)] });
    }

    if (sub === 'kenh_thongbao') {
      const channelId = parseChannelMention(args[1]);
      if (!channelId) return void message.reply({ embeds: [errorEmbed('Cách dùng: `.admin kenh_thongbao #kênh`')] });
      await GuildService.setNotificationChannel(message.guildId!, channelId);
      return void message.reply({ embeds: [successEmbed(`Đã đặt kênh thông báo thành <#${channelId}>`)] });
    }

    if (sub === 'bat_sukien') {
      const eventId = args[1];
      if (!eventId) return void message.reply({ embeds: [errorEmbed(`Cách dùng: \`.admin bat_sukien <mãSK>\`\nCác sự kiện: ${Object.keys(WORLD_EVENTS).join(', ')}`)] });
      try {
        const active = await WorldEventService.startEvent(message.guildId!, eventId);
        const event = WORLD_EVENTS[eventId];
        return void message.reply({ embeds: [successEmbed(`Đã bắt đầu sự kiện: **${event.emoji} ${event.name}**!\nKết thúc <t:${Math.floor(new Date(active.endsAt).getTime() / 1000)}:R>`)] });
      } catch (err) {
        return void message.reply({ embeds: [errorEmbed(String(err instanceof Error ? err.message : err))] });
      }
    }

    if (sub === 'dang_tin') {
      const rest = args.slice(1).join(' ');
      const pipeIdx = rest.indexOf(' | ');
      if (pipeIdx === -1) return void message.reply({ embeds: [errorEmbed('Cách dùng: `.admin dang_tin <tiêu đề> | <nội dung>`')] });
      const title = rest.slice(0, pipeIdx).trim();
      const content = rest.slice(pipeIdx + 3).trim();
      if (!title || !content) return void message.reply({ embeds: [errorEmbed('Cách dùng: `.admin dang_tin <tiêu đề> | <nội dung>`')] });
      await NewsService.postNews(message.guildId!, title, content, 'world_event', 2);
      return void message.reply({ embeds: [successEmbed(`Đã đăng tin: **${title}**`)] });
    }

    if (sub === 'trangthai') {
      const world = await GuildService.getOrCreateWorldState(message.guildId!);
      const config = await GuildService.getOrCreateConfig(message.guildId!);
      return void message.reply({ embeds: [createEmbed({
        title: '⚙️ Trạng Thái Server',
        color: 0x3498db,
        fields: [
          { name: '🌍 Vòng thế giới', value: String(world.worldTick), inline: true },
          { name: '📅 Ngày', value: String(world.dayNumber), inline: true },
          { name: '🍂 Mùa', value: world.currentSeason, inline: true },
          { name: '📰 Kênh tin tức', value: config.newsChannelId ? `<#${config.newsChannelId}>` : '*Chưa đặt*', inline: true },
          { name: '🔔 Kênh thông báo', value: config.notificationChannelId ? `<#${config.notificationChannelId}>` : '*Chưa đặt*', inline: true },
        ],
      })] });
    }

    return void message.reply(HELP);
  },
};
