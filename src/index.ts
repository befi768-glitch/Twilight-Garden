import 'dotenv/config';
import { Events, REST, Routes, ActivityType } from 'discord.js';
import { TwilightClient } from './client';
import { connectDatabase } from './database';
import { loadCommands, ALL_COMMANDS } from './commands';
import { startTickEngine } from './systems/time';
import { startWeatherSystem } from './systems/weather';
import { startSeasonSystem } from './systems/seasons';
import { GuildService } from './services/GuildService';
import { AchievementService } from './services/AchievementService';
import { logger } from './utils/logger';
import { createEmbed } from './utils/embed';

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;

if (!TOKEN || !CLIENT_ID) {
  console.error('❌  Missing required env vars: DISCORD_TOKEN and/or DISCORD_CLIENT_ID');
  process.exit(1);
}

async function registerSlashCommands(guildIds: string[]): Promise<void> {
  const rest = new REST({ version: '10' }).setToken(TOKEN);
  const commandData = ALL_COMMANDS.map((c) => c.data.toJSON());

  // Register globally (takes up to 1 hour to propagate) OR per-guild (instant)
  if (process.env.GUILD_ID) {
    // Dev mode: register to specific guild for instant updates
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, process.env.GUILD_ID), { body: commandData });
    logger.info(`Registered ${commandData.length} commands to guild ${process.env.GUILD_ID}`);
  } else {
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commandData });
    logger.info(`Registered ${commandData.length} global commands`);
  }
}

async function main(): Promise<void> {
  // Connect to database
  await connectDatabase();

  const client = new TwilightClient();
  loadCommands(client);

  // ─── Ready event ─────────────────────────────────────────────────────────
  client.once(Events.ClientReady, async (c) => {
    logger.info(`Logged in as ${c.user.tag}`);

    // Set bot presence
    c.user.setActivity('🌙 Twilight Garden', { type: ActivityType.Playing });

    // Register slash commands
    try {
      const guildIds = [...c.guilds.cache.keys()];
      await registerSlashCommands(guildIds);
    } catch (err) {
      logger.error('Failed to register commands', { error: String(err) });
    }

    // Initialize world state for all guilds
    const guildIds = [...c.guilds.cache.keys()];
    for (const guildId of guildIds) {
      await GuildService.getOrCreateWorldState(guildId);
    }

    // Start game systems
    startTickEngine(guildIds);
    startWeatherSystem(guildIds);
    startSeasonSystem(guildIds);

    logger.info(`Twilight Garden is running in ${guildIds.length} guild(s)`);
  });

  // ─── Guild join ────────────────────────────────────────────────────────────
  client.on(Events.GuildCreate, async (guild) => {
    logger.info(`Joined guild: ${guild.name} (${guild.id})`);
    await GuildService.getOrCreateWorldState(guild.id);
    await GuildService.getOrCreateConfig(guild.id);

    // Send welcome message to system channel if available
    if (guild.systemChannel) {
      const embed = createEmbed({
        title: '🌙 Welcome to Twilight Garden!',
        description: [
          'A magical garden RPG game has arrived in your server!',
          '',
          '**Getting Started:**',
          '• `/player profile` — View your character',
          '• `/garden plant` — Start growing plants',
          '• `/economy shop` — Buy seeds and items',
          '• `/explore go` — Venture into the world',
          '• `/quest available` — Accept quests',
          '• `/pet adopt` — Get a companion',
          '',
          '*Use any command to create your character automatically.*',
        ].join('\n'),
        color: 0x9b59b6,
        footer: 'The twilight garden awaits...',
      });
      await guild.systemChannel.send({ embeds: [embed] }).catch(() => {});
    }
  });

  // ─── Interaction handler ───────────────────────────────────────────────────
  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    if (!interaction.guildId) {
      await interaction.reply({ content: 'Twilight Garden commands only work inside a server!', ephemeral: true });
      return;
    }

    const command = client.commands.get(interaction.commandName);
    if (!command) {
      await interaction.reply({ content: 'Unknown command.', ephemeral: true });
      return;
    }

    try {
      await command.execute(interaction);

      // Check for unnotified achievements after every command
      const { PlayerService } = await import('./services/PlayerService');
      const player = await PlayerService.getByDiscord(interaction.user.id, interaction.guildId);
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
            await interaction.followUp({ embeds: [achEmbed], ephemeral: false }).catch(() => {});
          }
        }
      }
    } catch (err) {
      logger.error('Command error', { command: interaction.commandName, error: String(err) });
      const errorMsg = { content: '❌ An unexpected error occurred. Please try again.', ephemeral: true };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errorMsg).catch(() => {});
      } else {
        await interaction.reply(errorMsg).catch(() => {});
      }
    }
  });

  // ─── Login ────────────────────────────────────────────────────────────────
  await client.login(TOKEN);
}

main().catch((err) => {
  logger.error('Fatal error', { error: String(err) });
  process.exit(1);
});
