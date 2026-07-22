import { TwilightClient } from '../client';
import { logger } from '../utils/logger';

import { command as gardenCmd } from './garden';
import { command as economyCmd } from './economy';
import { command as inventoryCmd } from './inventory';
import { command as playerCmd } from './player';
import { command as explorationCmd } from './exploration';
import { command as petsCmd } from './pets';
import { command as questsCmd } from './quests';
import { command as npcCmd } from './npc';
import { command as wildlifeCmd } from './wildlife';
import { command as achievementsCmd } from './achievements';
import { command as homeCmd } from './home';
import { command as journalCmd } from './journal';
import { command as newsCmd } from './news';
import { command as eventsCmd } from './events';
import { command as socialCmd } from './social';
import { command as leaderboardCmd } from './leaderboard';
import { command as worldCmd } from './world';
import { command as adminCmd } from './admin';
import { command as huongdanCmd } from './huongdan';

const ALL_COMMANDS = [
  gardenCmd, economyCmd, inventoryCmd, playerCmd, explorationCmd,
  petsCmd, questsCmd, npcCmd, wildlifeCmd, achievementsCmd,
  homeCmd, journalCmd, newsCmd, eventsCmd, socialCmd,
  leaderboardCmd, worldCmd, adminCmd, huongdanCmd,
];

export function loadCommands(client: TwilightClient): void {
  for (const command of ALL_COMMANDS) {
    client.commands.set(command.name, command);
    logger.info(`Loaded command: .${command.name}`);
  }
}
