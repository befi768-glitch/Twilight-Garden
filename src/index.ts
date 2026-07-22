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
  await setupDatabase();
  await connectDatabase();

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
        title: '🌙 Welcome to Twilight Garden!',
        description: [
          'A magical garden RPG game has arrived in your server!',
          '',
          '**Getting Started (prefix: `.`)**',
          '• `.player profile` — View your character',
          '• `.garden plant` — Start growing plants',
          '• `.economy shop` — Buy seeds and items',
          '• `.explore go` — Venture into the world',
          '• `.quest available` — Accept quests',
          '• `.pet adopt` — Get a companion',
          '',
          '*Use any command to create your character automatically.*',
        ].join('\n'),
        color: 0x9b59b6,
        footer: 'The twilight garden awaits...',
      });
      await guild.systemChannel.send({ embeds: [embed] }).catch(() => {});
    }
  });

  // ─── Message handler ───────────────────────────────────────────────────────
  client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;
    if (!message.content.startsWith(PREFIX)) return;
    if (!message.guildId) {
      await message.reply('Twilight Garden commands only work inside a server!');
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
              title: `🏆 Achievement Unlocked!`,
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
      await message.reply('❌ An unexpected error occurred. Please try again.').catch(() => {});
    }
  });

  await client.login(TOKEN);
}

main().catch((err) => {
  logger.error('Fatal error', { error: String(err) });
  process.exit(1);
});
