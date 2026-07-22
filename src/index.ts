import 'dotenv/config';
import { Events, ActivityType } from 'discord.js';
import { TwilightClient } from './client';
import { connectDatabase } from './database';
import { setupDatabase } from './database/setup';
import { loadCommands } from './commands';
import { startTickEngine } from './systems/time';
import { startWeatherSystem } from './systems/weather';
import { startSeasonSystem } from './systems/seasons';
import { GuildService } from './services/GuildService';
import { AchievementService } from './services/AchievementService';
import { logger } from './utils/logger';
import { createEmbed } from './utils/embed';

const PREFIX = '.';

if (!process.env.DISCORD_TOKEN || !process.env.DISCORD_CLIENT_ID) {
  console.error('❌  Missing required env vars: DISCORD_TOKEN and/or DISCORD_CLIENT_ID');
  process.exit(1);
}

const TOKEN = process.env.DISCORD_TOKEN as string;

async function main(): Promise<void> {
  logger.info('Connecting to database...');
  await setupDatabase().catch((err) => {
    logger.error('setupDatabase failed', { error: String(err), message: err?.message });
    throw err;
  });
  await connectDatabase().catch((err) => {
    logger.error('connectDatabase failed', { error: String(err), message: err?.message });
    throw err;
  });
  logger.info('Database ready');

  const client = new TwilightClient();
  loadCommands(client);

  // ─── Ready event ─────────────────────────────────────────────────────────
  client.once(Events.ClientReady, async (c) => {
    logger.info(`Logged in as ${c.user.tag}`);
    c.user.setActivity('🌙 Twilight Garden', { type: ActivityType.Playing });

    const guildIds = [...c.guilds.cache.keys()];
    for (const guildId of guildIds) {
      await GuildService.getOrCreateWorldState(guildId);
    }

    startTickEngine(guildIds);
    startWeatherSystem(guildIds);
    startSeasonSystem(guildIds);

    logger.info(`Twilight Garden is running in ${guildIds.length} guild(s) — prefix: ${PREFIX}`);
  });

  // ─── Guild join ────────────────────────────────────────────────────────────
  client.on(Events.GuildCreate, async (guild) => {
    logger.info(`Joined guild: ${guild.name} (${guild.id})`);
    await GuildService.getOrCreateWorldState(guild.id);
    await GuildService.getOrCreateConfig(guild.id);

    if (guild.systemChannel) {
      const embed = createEmbed({
        title: '🌙 Chào Mừng Đến Twilight Garden!',
        description: [
          'Game RPG làm vườn huyền bí đã đến server của bạn!',
          '',
          '**Bắt Đầu (prefix: `.`)**',
          '• `.nguoichoi` — Xem nhân vật của bạn',
          '• `.vuon trong` — Bắt đầu trồng cây',
          '• `.kinhte shop` — Mua hạt giống và vật phẩm',
          '• `.khampha di` — Khám phá thế giới',
          '• `.nhiem_vu sansan` — Nhận nhiệm vụ',
          '• `.thuocung nuoi` — Nhận nuôi thú cưng',
          '',
          '*Dùng bất kỳ lệnh nào để tạo nhân vật tự động.*',
        ].join('\n'),
        color: 0x9b59b6,
        footer: 'Khu vườn hoàng hôn đang chờ bạn...',
      });
      await guild.systemChannel.send({ embeds: [embed] }).catch(() => {});
    }
  });

  // ─── Message handler ───────────────────────────────────────────────────────
  client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;
    if (!message.content.startsWith(PREFIX)) return;
    if (!message.guildId) {
      await message.reply('Lệnh Twilight Garden chỉ dùng được trong server!');
      return;
    }

    const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
    const commandName = args.shift()!.toLowerCase();
    if (!commandName) return;

    const command = client.commands.get(commandName);
    if (!command) return;

    try {
      await command.execute(message, args);

      // Check for unnotified achievements after every command
      const { PlayerService } = await import('./services/PlayerService');
      const player = await PlayerService.getByDiscord(message.author.id, message.guildId);
      if (player) {
        const unnotified = await AchievementService.getUnnotified(player.id);
        if (unnotified.length > 0) {
          const { ACHIEVEMENTS } = await import('./services/AchievementService');
          for (const pa of unnotified) {
            const ach = ACHIEVEMENTS[pa.achievementId];
            if (!ach) continue;
            await AchievementService.markNotified(player.id, pa.achievementId);
            const achEmbed = createEmbed({
              title: `🏆 Thành Tích Mới!`,
              description: `${ach.emoji} **${ach.name}**\n${ach.description}\n\n+🌙${ach.reward.coins} · +✨${ach.reward.xp} XP`,
              color: 0xffd700,
              footer: `${ach.rarity.toUpperCase()} Achievement`,
            });
            await message.channel.send({ embeds: [achEmbed] }).catch(() => {});
          }
        }
      }
    } catch (err) {
      logger.error('Command error', { command: commandName, error: String(err) });
      await message.reply('❌ Đã xảy ra lỗi. Vui lòng thử lại.').catch(() => {});
    }
  });

  await client.login(TOKEN);
}

main().catch((err) => {
  const details = err instanceof AggregateError
    ? { type: 'AggregateError', errors: err.errors?.map((e: any) => String(e)) }
    : { type: err?.constructor?.name, message: err?.message, stack: err?.stack };
  logger.error('Fatal error', details);
  console.error('FATAL:', JSON.stringify(details, null, 2));
  process.exit(1);
});
