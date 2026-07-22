import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { ALL_COMMANDS } from './commands';

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID; // optional: register to 1 guild instantly

if (!TOKEN || !CLIENT_ID) {
  console.error('❌  Missing DISCORD_TOKEN or DISCORD_CLIENT_ID in environment');
  process.exit(1);
}

const rest = new REST({ version: '10' }).setToken(TOKEN);
const commandData = ALL_COMMANDS.map((c) => c.data.toJSON());

(async () => {
  try {
    console.log(`📋  Preparing to register ${commandData.length} commands...`);

    if (GUILD_ID) {
      // Guild-specific: instant (use for dev / testing)
      await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
        body: commandData,
      });
      console.log(`✅  Registered ${commandData.length} commands to guild ${GUILD_ID} (instant)`);
    } else {
      // Global: takes up to 1 hour to propagate
      await rest.put(Routes.applicationCommands(CLIENT_ID), {
        body: commandData,
      });
      console.log(`✅  Registered ${commandData.length} global commands (may take up to 1 hour to appear)`);
    }

    console.log('\nCommands registered:');
    ALL_COMMANDS.forEach((c) => console.log(`  /${c.data.name}`));
  } catch (err) {
    console.error('❌  Failed to register commands:', err);
    process.exit(1);
  }
})();
