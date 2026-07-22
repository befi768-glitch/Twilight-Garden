import cron from 'node-cron';
import { GuildService } from '../../services/GuildService';
import { GardenService } from '../../services/GardenService';
import { PetService } from '../../services/PetService';
import { EconomyService } from '../../services/EconomyService';
import { WorldEventService } from '../../services/WorldEventService';
import { AchievementService } from '../../services/AchievementService';
import { db, schema } from '../../database';
import { logger } from '../../utils/logger';
import { TimeOfDay } from '../../models/types';

function currentTimeOfDay(): TimeOfDay {
  const hour = new Date().getUTCHours();
  if (hour >= 5 && hour < 7) return 'dawn';
  if (hour >= 7 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 20) return 'evening';
  if (hour >= 20 && hour < 23) return 'night';
  return 'midnight';
}

/** Main tick — every 15 minutes */
export async function worldTick(guildId: string): Promise<void> {
  try {
    const world = await GuildService.getOrCreateWorldState(guildId);
    const timeOfDay = currentTimeOfDay();

    // Update world tick
    await GuildService.updateWorldState(guildId, {
      worldTick: world.worldTick + 1,
      timeOfDay,
      lastTickAt: new Date(),
    });

    // Tick plant growth for all players
    const players = await db.select().from(schema.players);
    for (const player of players) {
      await GardenService.tickGrowth(player.id);
      await AchievementService.checkStatAchievements(player.id);
    }

    // Decay pet stats
    await PetService.decayAll();

    // Resolve expired auctions
    await EconomyService.resolveAuctions();

    // Resolve expired world events
    await WorldEventService.resolveExpiredEvents();

    // Maybe spawn new world event
    await WorldEventService.maybeSpawnEvent(guildId);

    logger.info(`World tick ${world.worldTick + 1} for guild ${guildId}`);
  } catch (err) {
    logger.error('World tick error', { error: String(err) });
  }
}

/** Start the cron scheduler */
export function startTickEngine(guildIds: string[]): void {
  // Tick every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    for (const guildId of guildIds) {
      // FIX: wrap each guild separately so one failure doesn't stop the rest
      try {
        await worldTick(guildId);
      } catch (err) {
        logger.error(`World tick failed for guild ${guildId}`, { error: String(err) });
      }
    }
  });

  // Daily reset at midnight UTC
  cron.schedule('0 0 * * *', async () => {
    for (const guildId of guildIds) {
      try {
        const world = await GuildService.getOrCreateWorldState(guildId);
        await GuildService.updateWorldState(guildId, { dayNumber: world.dayNumber + 1 });
        logger.info(`New day ${world.dayNumber + 1} for guild ${guildId}`);
      } catch (err) {
        logger.error(`Daily reset failed for guild ${guildId}`, { error: String(err) });
      }
    }
  });

  logger.info('Tick engine started');
}
